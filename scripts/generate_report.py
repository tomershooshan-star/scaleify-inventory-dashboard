"""
Daily report generator for the Inventory Intelligence Dashboard.
Generates a markdown report with alert counts, at-risk items,
estimated costs, supplier performance, and resolved items.
"""

import json
import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from scripts.database import (
    get_all_items,
    get_active_alerts,
    get_tier_counts,
    get_cost_summary,
    get_costs_for_date,
)

REPORTS_DIR = os.path.join(BASE_DIR, "data", "reports")


def load_business_config() -> dict:
    """Load business config."""
    config_path = os.path.join(BASE_DIR, "config", "business.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"business_name": "Inventory Dashboard"}


def load_suppliers_config() -> dict:
    """Load suppliers config."""
    config_path = os.path.join(BASE_DIR, "config", "suppliers.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"suppliers": []}


def generate_supplier_snapshot(items: list) -> list:
    """Generate supplier performance data from inventory items."""
    supplier_data = {}

    for item in items:
        supplier = item.get("supplier", "Unknown")
        if not supplier:
            continue

        if supplier not in supplier_data:
            supplier_data[supplier] = {
                "name": supplier,
                "total_items": 0,
                "critical_items": 0,
                "out_items": 0,
                "avg_days_left": 0,
                "total_days_left": 0,
                "lead_time": item.get("lead_time_days", 0),
            }

        data = supplier_data[supplier]
        data["total_items"] += 1
        data["total_days_left"] += item.get("days_left", 0)

        tier = item.get("tier", "healthy")
        if tier == "critical":
            data["critical_items"] += 1
        elif tier == "out":
            data["out_items"] += 1

    # Calculate averages
    for data in supplier_data.values():
        if data["total_items"] > 0:
            data["avg_days_left"] = round(data["total_days_left"] / data["total_items"], 1)

    # Sort by most problems first
    return sorted(supplier_data.values(),
                  key=lambda x: (x["out_items"], x["critical_items"]),
                  reverse=True)


def generate_report(alert_summary: dict = None, cost_summary: dict = None) -> str:
    """
    Generate a daily summary report in markdown format.
    Returns the report content as a string.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    business = load_business_config()
    business_name = business.get("business_name", "Inventory Dashboard")

    items = get_all_items()
    tier_counts = get_tier_counts()
    active_alerts = get_active_alerts()

    # Use provided summaries or generate fresh data
    if cost_summary is None:
        cost_data = get_cost_summary(days=30)
    else:
        cost_data = cost_summary

    today_costs = get_costs_for_date(today)

    report = []
    report.append(f"# Inventory Report: {today}")
    report.append(f"")
    report.append(f"> {business_name} -- Generated {now}")
    report.append(f"")
    report.append(f"---")
    report.append(f"")

    # --- Overview ---
    total_items = len(items)
    out_count = tier_counts.get("out", 0)
    critical_count = tier_counts.get("critical", 0)
    warning_count = tier_counts.get("warning", 0)
    watch_count = tier_counts.get("watch", 0)
    healthy_count = tier_counts.get("healthy", 0)
    at_risk = out_count + critical_count + warning_count

    report.append(f"## Overview")
    report.append(f"")
    report.append(f"| Metric | Count |")
    report.append(f"|--------|-------|")
    report.append(f"| Total SKUs tracked | {total_items} |")
    report.append(f"| Healthy (14+ days) | {healthy_count} |")
    report.append(f"| Watch (7-14 days) | {watch_count} |")
    report.append(f"| Warning (3-7 days) | {warning_count} |")
    report.append(f"| Critical (<3 days) | {critical_count} |")
    report.append(f"| Out of Stock | {out_count} |")
    report.append(f"| **Items at risk** | **{at_risk}** |")
    report.append(f"")

    # --- Active Alerts ---
    report.append(f"## Active Alerts ({len(active_alerts)})")
    report.append(f"")

    if active_alerts:
        report.append(f"| Tier | SKU | Product | Days Left | Est. Daily Loss | Action |")
        report.append(f"|------|-----|---------|-----------|-----------------|--------|")

        for alert in active_alerts[:15]:
            tier = alert.get("tier", "?").upper()
            sku = alert.get("sku", "")
            product = alert.get("product", "")
            days_left = alert.get("days_left", 0)
            daily_loss = alert.get("estimated_daily_loss", 0)
            action = alert.get("recommended_action", "")
            # Truncate long action text for table readability
            if len(action) > 60:
                action = action[:57] + "..."
            report.append(f"| {tier} | {sku} | {product} | {days_left} | ${daily_loss:,.0f} | {action} |")

        if len(active_alerts) > 15:
            report.append(f"")
            report.append(f"_...and {len(active_alerts) - 15} more alerts_")
    else:
        report.append(f"No active alerts. All items are within safe stock levels.")

    report.append(f"")

    # --- Top 10 At-Risk Items ---
    at_risk_items = [i for i in items if i.get("tier") in ("out", "critical", "warning")]
    at_risk_items.sort(key=lambda x: x.get("days_left", 999))

    report.append(f"## Top 10 At-Risk Items")
    report.append(f"")

    if at_risk_items:
        report.append(f"| # | SKU | Product | Stock | Daily Demand | Days Left | Supplier | Lead Time |")
        report.append(f"|---|-----|---------|-------|--------------|-----------|----------|-----------|")

        for i, item in enumerate(at_risk_items[:10], 1):
            report.append(
                f"| {i} | {item['sku']} | {item['product']} | "
                f"{item['current_stock']} | {item['daily_demand']} | "
                f"{item['days_left']} | {item.get('supplier', '')} | "
                f"{item.get('lead_time_days', '?')} days |"
            )
    else:
        report.append(f"No items currently at risk.")

    report.append(f"")

    # --- Stockout Costs ---
    daily_cost = cost_data.get("total_daily_cost", 0) if isinstance(cost_data, dict) and "total_daily_cost" in cost_data else 0
    weekly_cost = cost_data.get("total_weekly_estimate", 0) if isinstance(cost_data, dict) and "total_weekly_estimate" in cost_data else 0
    monthly_cost = cost_data.get("total_monthly_estimate", 0) if isinstance(cost_data, dict) and "total_monthly_estimate" in cost_data else 0

    # Fallback to the 30-day summary if per-day data not available
    if daily_cost == 0:
        summary_30d = get_cost_summary(days=30)
        total_30d = summary_30d.get("total_cost", 0) or 0
        days_with_costs = summary_30d.get("days_with_costs", 1) or 1
        daily_cost = round(total_30d / max(days_with_costs, 1), 2)
        weekly_cost = round(daily_cost * 7, 2)
        monthly_cost = round(daily_cost * 30, 2)

    report.append(f"## Estimated Stockout Costs")
    report.append(f"")
    report.append(f"| Period | Estimated Cost |")
    report.append(f"|--------|---------------|")
    report.append(f"| Daily | ${daily_cost:,.2f} |")
    report.append(f"| Weekly | ${weekly_cost:,.2f} |")
    report.append(f"| Monthly | ${monthly_cost:,.2f} |")
    report.append(f"")

    if today_costs:
        # Show cost breakdown for today
        cost_by_type = {}
        for cost in today_costs:
            ctype = cost.get("cost_type", "other")
            cost_by_type[ctype] = cost_by_type.get(ctype, 0) + cost.get("daily_cost", 0)

        if cost_by_type:
            report.append(f"**Today's cost breakdown:**")
            report.append(f"")
            for ctype, amount in sorted(cost_by_type.items(), key=lambda x: x[1], reverse=True):
                label = ctype.replace("_", " ").title()
                report.append(f"- {label}: ${amount:,.2f}")
            report.append(f"")

    # --- Supplier Snapshot ---
    supplier_stats = generate_supplier_snapshot(items)

    report.append(f"## Supplier Performance Snapshot")
    report.append(f"")

    if supplier_stats:
        report.append(f"| Supplier | Items | Out | Critical | Avg Days Left | Lead Time |")
        report.append(f"|----------|-------|-----|----------|---------------|-----------|")

        for s in supplier_stats:
            flag = " (!)" if s["out_items"] > 0 or s["critical_items"] > 2 else ""
            report.append(
                f"| {s['name']}{flag} | {s['total_items']} | "
                f"{s['out_items']} | {s['critical_items']} | "
                f"{s['avg_days_left']} | {s['lead_time']} days |"
            )
    else:
        report.append(f"No supplier data available.")

    report.append(f"")

    # --- Resolved Since Last Report ---
    if alert_summary and alert_summary.get("resolved_details"):
        resolved = alert_summary["resolved_details"]
        report.append(f"## Resolved Since Last Check ({len(resolved)} items)")
        report.append(f"")
        for r in resolved[:10]:
            report.append(f"- {r['sku']} - {r['product']}")
        if len(resolved) > 10:
            report.append(f"- ...and {len(resolved) - 10} more")
        report.append(f"")

    # --- Footer ---
    report.append(f"---")
    report.append(f"")
    report.append(f"*Report generated by Inventory Intelligence Dashboard*")

    return "\n".join(report)


def save_report(content: str) -> str:
    """Save report to data/reports/ directory. Returns the file path."""
    os.makedirs(REPORTS_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    file_path = os.path.join(REPORTS_DIR, f"{today}.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return file_path


def main(alert_summary: dict = None, cost_summary: dict = None) -> str:
    """Generate and save the daily report. Returns file path."""
    from scripts.database import init_db
    init_db()

    content = generate_report(alert_summary, cost_summary)
    file_path = save_report(content)
    print(f"Report generated: {file_path}")
    return file_path


if __name__ == "__main__":
    main()
