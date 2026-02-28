"""
Stockout cost calculator.
For each out-of-stock or critical item, calculates:
- Direct lost sales (demand * revenue per unit)
- Emergency order premium (15-30% surcharge estimate)
- Customer churn cost (industry-based estimate)
Stores daily costs in the database and returns totals.
"""

import json
import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from scripts.database import get_all_items, log_cost, get_costs_for_date

# Revenue multiplier: assumes cost * multiplier = retail price
# Conservative 2x for distribution, adjust per industry
DEFAULT_MARGIN_MULTIPLIER = 2.0

# Emergency order surcharge rates
EMERGENCY_SURCHARGE = {
    "out": 0.30,      # 30% surcharge for out-of-stock rush orders
    "critical": 0.20,  # 20% surcharge for critical rush orders
    "warning": 0.10,   # 10% surcharge possibility
}

# Estimated customer churn cost per incident
# This is the estimated value of a lost customer relationship
CHURN_COST_PER_STOCKOUT = {
    "out": 500,       # High churn risk when completely out
    "critical": 200,  # Moderate churn risk
    "warning": 50,    # Low churn risk
}


def load_business_config() -> dict:
    """Load business config for industry-specific adjustments."""
    config_path = os.path.join(BASE_DIR, "config", "business.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def calculate_item_costs(item: dict) -> dict:
    """
    Calculate all stockout cost components for a single inventory item.
    Returns dict with cost breakdown.
    """
    daily_demand = item.get("daily_demand", 0)
    unit_cost = item.get("unit_cost", 0)
    tier = item.get("tier", "healthy")
    current_stock = item.get("current_stock", 0)
    days_left = item.get("days_left", 999)

    # Skip healthy and watch items -- no immediate cost impact
    if tier in ("healthy", "watch"):
        return None

    # --- Direct Lost Sales ---
    # Units we can't sell because we're out or about to be out
    revenue_per_unit = unit_cost * DEFAULT_MARGIN_MULTIPLIER
    profit_per_unit = revenue_per_unit - unit_cost

    if tier == "out":
        # Full daily demand is lost
        lost_units = daily_demand
    elif tier == "critical":
        # Estimate partial lost sales as demand exceeds dwindling stock
        lost_units = max(0, daily_demand - (current_stock / max(days_left, 1)))
    elif tier == "warning":
        # Small fraction of demand at risk
        lost_units = daily_demand * 0.1
    else:
        lost_units = 0

    direct_lost_sales = round(lost_units * revenue_per_unit, 2)

    # --- Emergency Order Premium ---
    surcharge_rate = EMERGENCY_SURCHARGE.get(tier, 0)
    reorder_qty = item.get("reorder_qty", 0)
    emergency_premium = round(reorder_qty * unit_cost * surcharge_rate, 2) if tier in ("out", "critical") else 0

    # --- Customer Churn Cost ---
    # Probability of losing a customer due to stockout
    churn_cost = CHURN_COST_PER_STOCKOUT.get(tier, 0)
    # Scale by demand volume -- higher demand items affect more customers
    if daily_demand > 20:
        churn_cost *= 2
    elif daily_demand > 10:
        churn_cost *= 1.5

    churn_cost = round(churn_cost, 2)

    # --- Total Daily Cost ---
    total_daily = round(direct_lost_sales + (emergency_premium / 7) + churn_cost, 2)
    # Amortize emergency premium over a week since it's a one-time hit per order

    return {
        "sku": item["sku"],
        "product": item.get("product", ""),
        "tier": tier,
        "days_left": days_left,
        "current_stock": current_stock,
        "daily_demand": daily_demand,
        "unit_cost": unit_cost,
        "direct_lost_sales": direct_lost_sales,
        "emergency_premium": emergency_premium,
        "churn_cost": churn_cost,
        "total_daily_cost": total_daily,
    }


def calculate_all_costs() -> dict:
    """
    Calculate stockout costs for all at-risk items.
    Logs costs to database and returns summary.
    """
    items = get_all_items()
    today = datetime.now().strftime("%Y-%m-%d")

    # Check if we already logged costs today (idempotent)
    existing_costs = get_costs_for_date(today)
    already_logged_skus = {c["sku"] for c in existing_costs}

    cost_items = []
    total_daily_cost = 0
    items_affected = 0

    for item in items:
        costs = calculate_item_costs(item)
        if costs is None:
            continue

        cost_items.append(costs)
        total_daily_cost += costs["total_daily_cost"]
        items_affected += 1

        # Log to database (skip if already logged today for this SKU)
        if costs["sku"] not in already_logged_skus:
            # Log direct lost sales
            if costs["direct_lost_sales"] > 0:
                log_cost({
                    "sku": costs["sku"],
                    "product": costs["product"],
                    "date": today,
                    "daily_cost": costs["direct_lost_sales"],
                    "cost_type": "direct_lost_sales",
                    "notes": f"Tier: {costs['tier']}, {costs['daily_demand']} units/day demand",
                })

            # Log emergency premium
            if costs["emergency_premium"] > 0:
                log_cost({
                    "sku": costs["sku"],
                    "product": costs["product"],
                    "date": today,
                    "daily_cost": costs["emergency_premium"],
                    "cost_type": "emergency_premium",
                    "notes": f"Estimated surcharge on reorder qty {item.get('reorder_qty', 0)}",
                })

            # Log churn cost
            if costs["churn_cost"] > 0:
                log_cost({
                    "sku": costs["sku"],
                    "product": costs["product"],
                    "date": today,
                    "daily_cost": costs["churn_cost"],
                    "cost_type": "customer_churn",
                    "notes": f"Estimated customer loss risk at tier: {costs['tier']}",
                })

    # Sort by highest cost
    cost_items.sort(key=lambda x: x["total_daily_cost"], reverse=True)

    weekly_estimate = round(total_daily_cost * 7, 2)
    monthly_estimate = round(total_daily_cost * 30, 2)

    summary = {
        "date": today,
        "items_affected": items_affected,
        "total_daily_cost": round(total_daily_cost, 2),
        "total_weekly_estimate": weekly_estimate,
        "total_monthly_estimate": monthly_estimate,
        "top_cost_items": cost_items[:10],
        "all_cost_items": cost_items,
        "already_logged": len(already_logged_skus) > 0,
    }

    # Print summary
    print(f"\n--- Stockout Cost Summary ({today}) ---")
    print(f"Items affected: {items_affected}")
    print(f"Daily stockout cost: ${total_daily_cost:,.2f}")
    print(f"Weekly estimate: ${weekly_estimate:,.2f}")
    print(f"Monthly estimate: ${monthly_estimate:,.2f}")

    if cost_items:
        print(f"\nTop 5 costliest items:")
        for i, c in enumerate(cost_items[:5], 1):
            print(f"  {i}. {c['sku']} - {c['product']}: ${c['total_daily_cost']:,.2f}/day "
                  f"({c['tier']}, {c['days_left']} days left)")

    return summary


def main():
    from scripts.database import init_db
    init_db()
    calculate_all_costs()


if __name__ == "__main__":
    main()
