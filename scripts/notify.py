"""
Notification sender for the Inventory Intelligence Dashboard.
Sends alerts via Slack webhook and/or email based on alert_rules.json config.
Deduplicates: won't re-notify for the same alert within 24 hours.
"""

import json
import os
import smtplib
import sys
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

# Track sent notifications to avoid duplicates within a session
# For persistence across runs, we use a simple JSON file
NOTIFICATION_LOG = os.path.join(BASE_DIR, "data", "notification_log.json")


def load_alert_rules() -> dict:
    """Load alert rules config."""
    rules_path = os.path.join(BASE_DIR, "config", "alert_rules.json")
    if os.path.exists(rules_path):
        with open(rules_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"tiers": {}}


def load_notification_log() -> dict:
    """Load the notification dedup log."""
    if os.path.exists(NOTIFICATION_LOG):
        try:
            with open(NOTIFICATION_LOG, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_notification_log(log: dict):
    """Save the notification dedup log."""
    os.makedirs(os.path.dirname(NOTIFICATION_LOG), exist_ok=True)
    with open(NOTIFICATION_LOG, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)


def was_recently_notified(sku: str, tier: str, log: dict) -> bool:
    """Check if we already sent a notification for this SKU+tier in the last 24h."""
    key = f"{sku}:{tier}"
    if key in log:
        last_sent = datetime.fromisoformat(log[key])
        if datetime.now() - last_sent < timedelta(hours=24):
            return True
    return False


def mark_notified(sku: str, tier: str, log: dict):
    """Record that we sent a notification for this SKU+tier."""
    key = f"{sku}:{tier}"
    log[key] = datetime.now().isoformat()


def clean_old_entries(log: dict) -> dict:
    """Remove notification log entries older than 48 hours."""
    cutoff = datetime.now() - timedelta(hours=48)
    cleaned = {}
    for key, timestamp in log.items():
        try:
            if datetime.fromisoformat(timestamp) > cutoff:
                cleaned[key] = timestamp
        except (ValueError, TypeError):
            continue
    return cleaned


# --- Slack ---

def format_slack_message(alerts: list, cost_summary: dict = None) -> dict:
    """Format alerts into a Slack Block Kit message."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Inventory Alert Report",
            }
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"Generated: {now}"}
            ]
        },
        {"type": "divider"},
    ]

    # Group by tier
    by_tier = {}
    for alert in alerts:
        tier = alert.get("tier", "unknown")
        if tier not in by_tier:
            by_tier[tier] = []
        by_tier[tier].append(alert)

    tier_emoji = {
        "out": ":red_circle:",
        "critical": ":rotating_light:",
        "warning": ":warning:",
        "watch": ":eyes:",
    }

    tier_order = ["out", "critical", "warning", "watch"]

    for tier in tier_order:
        if tier not in by_tier:
            continue

        tier_alerts = by_tier[tier]
        emoji = tier_emoji.get(tier, ":white_circle:")
        label = tier.upper()

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"{emoji} *{label}* ({len(tier_alerts)} items)"
            }
        })

        for alert in tier_alerts[:5]:  # Limit to 5 per tier to avoid huge messages
            sku = alert.get("sku", "?")
            product = alert.get("product", "Unknown")
            days_left = alert.get("days_left", 0)
            daily_loss = alert.get("estimated_daily_loss", 0)
            action = alert.get("recommended_action", "Review")

            text = f"*{sku}* - {product}\n"
            text += f"Days left: {days_left} | Est. daily loss: ${daily_loss:,.0f}\n"
            text += f"_{action}_"

            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": text}
            })

        if len(tier_alerts) > 5:
            blocks.append({
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"_...and {len(tier_alerts) - 5} more {tier} items_"}
                ]
            })

        blocks.append({"type": "divider"})

    # Cost summary if available
    if cost_summary:
        daily = cost_summary.get("total_daily_cost", 0)
        weekly = cost_summary.get("total_weekly_estimate", 0)
        monthly = cost_summary.get("total_monthly_estimate", 0)
        affected = cost_summary.get("items_affected", 0)

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f":money_with_wings: *Estimated Stockout Costs*\n"
                        f"Daily: ${daily:,.0f} | Weekly: ${weekly:,.0f} | Monthly: ${monthly:,.0f}\n"
                        f"_{affected} items contributing to losses_"
            }
        })

    return {"blocks": blocks}


def send_slack(alerts: list, cost_summary: dict = None) -> bool:
    """Send alert notifications to Slack via webhook."""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        print("  Slack: No SLACK_WEBHOOK_URL configured, skipping")
        return False

    message = format_slack_message(alerts, cost_summary)

    try:
        response = requests.post(
            webhook_url,
            json=message,
            timeout=10,
        )
        if response.status_code == 200:
            print(f"  Slack: Message sent ({len(alerts)} alerts)")
            return True
        else:
            print(f"  Slack: Failed with status {response.status_code}: {response.text[:200]}")
            return False
    except requests.RequestException as e:
        print(f"  Slack: Error sending message: {e}")
        return False


# --- Email ---

def format_email_html(alerts: list, cost_summary: dict = None) -> str:
    """Format alerts into an HTML email body."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 700px;">
    <h2 style="color: #1a2744;">Inventory Alert Report</h2>
    <p style="color: #666; font-size: 14px;">Generated: {now}</p>
    <hr style="border: 1px solid #e5e7eb;">
    """

    # Group by tier
    by_tier = {}
    for alert in alerts:
        tier = alert.get("tier", "unknown")
        if tier not in by_tier:
            by_tier[tier] = []
        by_tier[tier].append(alert)

    tier_colors = {
        "out": "#dc2626",
        "critical": "#f43f5e",
        "warning": "#f59e0b",
        "watch": "#4de8e8",
    }

    tier_order = ["out", "critical", "warning", "watch"]

    for tier in tier_order:
        if tier not in by_tier:
            continue

        tier_alerts = by_tier[tier]
        color = tier_colors.get(tier, "#666")

        html += f'<h3 style="color: {color};">{tier.upper()} ({len(tier_alerts)} items)</h3>'
        html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">'
        html += '''
        <tr style="background: #f9fafb; font-size: 13px;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Days Left</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Est. Daily Loss</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Action</th>
        </tr>
        '''

        for alert in tier_alerts:
            sku = alert.get("sku", "")
            product = alert.get("product", "")
            days_left = alert.get("days_left", 0)
            daily_loss = alert.get("estimated_daily_loss", 0)
            action = alert.get("recommended_action", "")

            html += f'''
            <tr style="font-size: 13px;">
                <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">{sku}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">{product}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">{days_left}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${daily_loss:,.0f}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">{action}</td>
            </tr>
            '''

        html += '</table>'

    # Cost summary
    if cost_summary:
        daily = cost_summary.get("total_daily_cost", 0)
        weekly = cost_summary.get("total_weekly_estimate", 0)
        monthly = cost_summary.get("total_monthly_estimate", 0)

        html += f'''
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <h3 style="color: #dc2626; margin-top: 0;">Estimated Stockout Costs</h3>
            <p style="font-size: 14px;">
                <strong>Daily:</strong> ${daily:,.0f} |
                <strong>Weekly:</strong> ${weekly:,.0f} |
                <strong>Monthly:</strong> ${monthly:,.0f}
            </p>
        </div>
        '''

    html += """
    <hr style="border: 1px solid #e5e7eb; margin-top: 24px;">
    <p style="color: #999; font-size: 12px;">Inventory Intelligence Dashboard</p>
    </body>
    </html>
    """

    return html


def send_email(alerts: list, cost_summary: dict = None) -> bool:
    """Send alert notifications via email."""
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    email_to = os.environ.get("ALERT_EMAIL_TO", "")

    if not all([smtp_host, smtp_user, smtp_password, email_to]):
        print("  Email: Missing SMTP configuration, skipping")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Inventory Alert: {len(alerts)} items need attention"
    msg["From"] = smtp_user
    msg["To"] = email_to

    html_body = format_email_html(alerts, cost_summary)
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, email_to.split(","), msg.as_string())
        print(f"  Email: Sent to {email_to} ({len(alerts)} alerts)")
        return True
    except smtplib.SMTPException as e:
        print(f"  Email: SMTP error: {e}")
        return False
    except Exception as e:
        print(f"  Email: Error: {e}")
        return False


# --- Main ---

def send_notifications(alerts: list, cost_summary: dict = None) -> dict:
    """
    Send notifications for alerts based on tier configuration.
    Deduplicates: won't re-send for the same alert within 24h.
    Returns: {"slack_sent": int, "email_sent": int, "skipped": int}
    """
    rules = load_alert_rules()
    tiers_config = rules.get("tiers", {})
    notification_log = load_notification_log()
    notification_log = clean_old_entries(notification_log)

    # Filter to only alerts that need notification and haven't been sent recently
    alerts_to_notify = []
    skipped = 0

    for alert in alerts:
        tier = alert.get("tier", "unknown")
        sku = alert.get("sku", "")

        # Check if this tier has notification channels configured
        tier_config = tiers_config.get(tier, {})
        notify_channels = tier_config.get("notify", [])

        if not notify_channels:
            continue  # This tier doesn't trigger notifications

        # Dedup check
        if was_recently_notified(sku, tier, notification_log):
            skipped += 1
            continue

        alerts_to_notify.append(alert)
        mark_notified(sku, tier, notification_log)

    if not alerts_to_notify:
        print("No new notifications to send (all deduplicated or no channels configured)")
        save_notification_log(notification_log)
        return {"slack_sent": 0, "email_sent": 0, "skipped": skipped}

    # Determine which channels to use based on the highest-severity alert
    channels_needed = set()
    for alert in alerts_to_notify:
        tier = alert.get("tier", "")
        tier_config = tiers_config.get(tier, {})
        for channel in tier_config.get("notify", []):
            channels_needed.add(channel)

    slack_sent = 0
    email_sent = 0

    if "slack" in channels_needed:
        if send_slack(alerts_to_notify, cost_summary):
            slack_sent = len(alerts_to_notify)

    if "email" in channels_needed:
        if send_email(alerts_to_notify, cost_summary):
            email_sent = len(alerts_to_notify)

    # Save the dedup log
    save_notification_log(notification_log)

    result = {
        "slack_sent": slack_sent,
        "email_sent": email_sent,
        "skipped": skipped,
    }

    print(f"\nSent {slack_sent} Slack messages, {email_sent} emails ({skipped} skipped as duplicates)")
    return result


def main():
    from scripts.database import init_db, get_active_alerts
    init_db()
    alerts = get_active_alerts()
    if alerts:
        send_notifications(alerts)
    else:
        print("No active alerts to notify about.")


if __name__ == "__main__":
    main()
