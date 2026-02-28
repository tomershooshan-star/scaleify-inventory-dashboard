"""
Alert engine for the Inventory Intelligence Dashboard.
Reads all inventory items, evaluates tier status, creates new alerts
for items that crossed thresholds, and resolves alerts for recovered items.
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
    get_alert_for_sku,
    create_alert,
    resolve_alerts_for_sku,
)


def load_alert_rules() -> dict:
    """Load alert rules from config."""
    rules_path = os.path.join(BASE_DIR, "config", "alert_rules.json")
    if os.path.exists(rules_path):
        with open(rules_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "tiers": {
            "critical": {"days_left_max": 3, "action": "Order immediately"},
            "warning": {"days_left_max": 7, "action": "Order this week"},
            "watch": {"days_left_max": 14, "action": "Monitor closely"},
        }
    }


def determine_tier(days_left: float, rules: dict, category: str = "") -> str:
    """Determine the alert tier for a given days_left value."""
    tiers = rules.get("tiers", {})
    overrides = rules.get("category_overrides", {})

    # Check for category-specific overrides
    if category and category in overrides:
        tiers = {**tiers, **overrides[category]}

    if days_left <= 0:
        return "out"

    critical_max = tiers.get("critical", {}).get("days_left_max", 3)
    warning_max = tiers.get("warning", {}).get("days_left_max", 7)
    watch_max = tiers.get("watch", {}).get("days_left_max", 14)

    if days_left <= critical_max:
        return "critical"
    elif days_left <= warning_max:
        return "warning"
    elif days_left <= watch_max:
        return "watch"
    else:
        return "healthy"


def get_recommended_action(tier: str, item: dict, rules: dict) -> str:
    """Generate a specific recommended action based on tier and item data."""
    tiers = rules.get("tiers", {})
    base_action = tiers.get(tier, {}).get("action", "Review stock levels")

    if tier == "out":
        return f"STOCKOUT: {item['product']} -- place emergency order with {item.get('supplier', 'supplier')}. " \
               f"Reorder qty: {item.get('reorder_qty', 'N/A')}"
    elif tier == "critical":
        return f"{base_action} -- {item['product']} has ~{item.get('days_left', 0)} days left. " \
               f"Contact {item.get('supplier', 'supplier')} (lead time: {item.get('lead_time_days', '?')} days)"
    elif tier == "warning":
        return f"{base_action} -- {item['product']} at {item.get('current_stock', 0)} units " \
               f"({item.get('days_left', 0)} days supply)"
    else:
        return base_action


def estimate_daily_loss(item: dict) -> float:
    """Estimate daily financial loss for an at-risk item."""
    daily_demand = item.get("daily_demand", 0)
    unit_cost = item.get("unit_cost", 0)

    if daily_demand <= 0 or unit_cost <= 0:
        return 0

    # Estimate revenue as cost * margin multiplier (assume 2x markup for distribution)
    estimated_revenue_per_unit = unit_cost * 2.0
    daily_revenue_at_risk = daily_demand * estimated_revenue_per_unit

    tier = item.get("tier", "healthy")
    if tier == "out":
        return daily_revenue_at_risk  # Full loss
    elif tier == "critical":
        return daily_revenue_at_risk * 0.5  # Partial loss risk
    elif tier == "warning":
        return daily_revenue_at_risk * 0.2  # Lower risk
    else:
        return 0


def run_alert_engine() -> dict:
    """
    Main alert engine run.
    Evaluates all items, creates/resolves alerts, and returns summary.
    """
    rules = load_alert_rules()
    items = get_all_items()
    active_alerts = get_active_alerts()

    # Track which SKUs currently have alerts
    alerted_skus = {a["sku"] for a in active_alerts}

    new_alerts = []
    resolved_alerts = []
    alert_tiers = {"out": 0, "critical": 0, "warning": 0, "watch": 0}

    for item in items:
        sku = item["sku"]
        days_left = item.get("days_left", 999)
        tier = determine_tier(days_left, rules, item.get("category", ""))

        # Count by tier
        if tier in alert_tiers:
            alert_tiers[tier] += 1

        # Should this item have an alert?
        needs_alert = tier in ("out", "critical", "warning")
        has_alert = sku in alerted_skus

        if needs_alert and not has_alert:
            # New alert
            daily_loss = estimate_daily_loss(item)
            action = get_recommended_action(tier, item, rules)

            alert_data = {
                "sku": sku,
                "product": item.get("product", ""),
                "tier": tier,
                "days_left": days_left,
                "estimated_daily_loss": daily_loss,
                "recommended_action": action,
            }
            alert_id = create_alert(alert_data)
            alert_data["id"] = alert_id
            new_alerts.append(alert_data)

        elif needs_alert and has_alert:
            # Alert exists -- check if tier changed (escalated or de-escalated)
            existing = get_alert_for_sku(sku)
            if existing and existing["tier"] != tier:
                # Resolve old, create new with updated tier
                resolve_alerts_for_sku(sku)
                daily_loss = estimate_daily_loss(item)
                action = get_recommended_action(tier, item, rules)

                alert_data = {
                    "sku": sku,
                    "product": item.get("product", ""),
                    "tier": tier,
                    "days_left": days_left,
                    "estimated_daily_loss": daily_loss,
                    "recommended_action": action,
                }
                alert_id = create_alert(alert_data)
                alert_data["id"] = alert_id
                new_alerts.append(alert_data)

        elif not needs_alert and has_alert:
            # Item recovered -- resolve alert
            resolve_alerts_for_sku(sku)
            resolved_alerts.append({"sku": sku, "product": item.get("product", "")})

    # Get final active alerts
    final_alerts = get_active_alerts()

    summary = {
        "total_items": len(items),
        "new_alerts": len(new_alerts),
        "resolved_alerts": len(resolved_alerts),
        "active_alerts": len(final_alerts),
        "by_tier": alert_tiers,
        "alerts": final_alerts,
        "new_alert_details": new_alerts,
        "resolved_details": resolved_alerts,
    }

    # Print summary
    print(f"\n--- Alert Engine Summary ---")
    print(f"Items evaluated: {summary['total_items']}")
    print(f"Alerts: {alert_tiers.get('critical', 0)} critical, "
          f"{alert_tiers.get('warning', 0)} warning, "
          f"{alert_tiers.get('watch', 0)} watch, "
          f"{alert_tiers.get('out', 0)} out of stock")
    print(f"New alerts created: {summary['new_alerts']}")
    print(f"Alerts resolved: {summary['resolved_alerts']}")
    print(f"Total active alerts: {summary['active_alerts']}")

    return summary


def main():
    from scripts.database import init_db
    init_db()
    run_alert_engine()


if __name__ == "__main__":
    main()
