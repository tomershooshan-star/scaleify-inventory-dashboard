"""
Main orchestrator for the Inventory Intelligence Dashboard.
Runs the full pipeline:
  1. Manual refresh (check for new CSV/XLSX files)
  2. Supplier API refresh (fetch from configured API suppliers)
  3. Alert engine (evaluate thresholds, create/resolve alerts)
  4. Stockout calculator (estimate financial impact)
  5. Notifications (send Slack/email for new alerts)
  6. Report generation (daily markdown summary)

Usage:
  python run.py              # Run full pipeline
  python run.py --skip-notify  # Skip sending notifications (dry run)
  python run.py --report-only  # Only generate the report
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from scripts.database import init_db, get_tier_counts, get_all_items
from scripts.manual_refresh import refresh as manual_refresh
from scripts.import_inventory import import_file
from scripts.alert_engine import run_alert_engine
from scripts.stockout_calculator import calculate_all_costs
from scripts.notify import send_notifications
from scripts.generate_report import generate_report, save_report


def load_suppliers_config() -> list:
    """Load supplier configurations."""
    config_path = os.path.join(BASE_DIR, "config", "suppliers.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("suppliers", [])
    return []


def refresh_supplier_apis(suppliers: list) -> dict:
    """Fetch inventory data from all API-based suppliers."""
    from scripts.suppliers.api_connector import APIConnector
    from scripts.suppliers.csv_connector import CSVConnector

    results = {"api_fetched": 0, "csv_fetched": 0, "errors": []}

    for supplier_config in suppliers:
        name = supplier_config.get("name", "Unknown")
        supplier_type = supplier_config.get("type", "csv")

        if not name:
            continue

        try:
            if supplier_type == "api":
                connector = APIConnector(supplier_config)
                items = connector.fetch_inventory()
                if items:
                    # Import fetched items
                    from scripts.database import upsert_items_batch
                    from scripts.import_inventory import load_alert_rules, calculate_tier

                    rules = load_alert_rules()
                    for item in items:
                        daily_demand = item.get("daily_demand", 0)
                        current_stock = item.get("current_stock", 0)
                        if daily_demand > 0:
                            item["days_left"] = round(current_stock / daily_demand, 1)
                        elif current_stock > 0:
                            item["days_left"] = 999
                        else:
                            item["days_left"] = 0
                        item["tier"] = calculate_tier(item["days_left"], rules)
                        item.setdefault("location", "")
                        item.setdefault("category", "")
                        item.setdefault("product", item.get("sku", ""))

                    upsert_items_batch(items)
                    results["api_fetched"] += len(items)

            elif supplier_type == "csv":
                connector = CSVConnector(supplier_config)
                items = connector.fetch_inventory()
                if items:
                    from scripts.database import upsert_items_batch
                    from scripts.import_inventory import load_alert_rules, calculate_tier

                    rules = load_alert_rules()
                    for item in items:
                        daily_demand = item.get("daily_demand", 0)
                        current_stock = item.get("current_stock", 0)
                        if daily_demand > 0:
                            item["days_left"] = round(current_stock / daily_demand, 1)
                        elif current_stock > 0:
                            item["days_left"] = 999
                        else:
                            item["days_left"] = 0
                        item["tier"] = calculate_tier(item["days_left"], rules)
                        item.setdefault("location", "")
                        item.setdefault("category", "")
                        item.setdefault("product", item.get("sku", ""))

                    upsert_items_batch(items)
                    results["csv_fetched"] += len(items)

        except Exception as e:
            error_msg = f"{name}: {e}"
            results["errors"].append(error_msg)
            print(f"  ERROR with supplier {name}: {e}")
            # Continue with other suppliers

    return results


def print_step(step_num: int, total: int, description: str):
    """Print a formatted step header."""
    print(f"\n[{step_num}/{total}] {description}")
    print("-" * 50)


def run_pipeline(skip_notify: bool = False, report_only: bool = False):
    """Run the full inventory monitoring pipeline."""
    start_time = time.time()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_steps = 6

    print("=" * 60)
    print(f"  Inventory Intelligence Dashboard")
    print(f"  Pipeline run: {now}")
    print("=" * 60)

    # Step 0: Initialize database
    init_db()

    if report_only:
        print_step(1, 1, "Generating report...")
        report_content = generate_report()
        report_path = save_report(report_content)
        print(f"\nReport saved: {report_path}")
        return

    # Step 1: Manual refresh (check for new files in data/imports/)
    print_step(1, total_steps, "Checking for new import files...")
    try:
        refresh_result = manual_refresh()
        if refresh_result["files_processed"] > 0:
            print(f"  Processed {refresh_result['files_processed']} files, "
                  f"imported {refresh_result['items_imported']} items")
        else:
            print("  No new files to process")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Step 2: Supplier API refresh
    print_step(2, total_steps, "Refreshing supplier data...")
    suppliers = load_suppliers_config()
    active_suppliers = [s for s in suppliers if s.get("name")]
    if active_suppliers:
        try:
            supplier_result = refresh_supplier_apis(active_suppliers)
            print(f"  API items: {supplier_result['api_fetched']}, "
                  f"CSV items: {supplier_result['csv_fetched']}")
            if supplier_result["errors"]:
                for err in supplier_result["errors"]:
                    print(f"  WARNING: {err}")
        except Exception as e:
            print(f"  ERROR: {e}")
    else:
        print("  No suppliers configured (edit config/suppliers.json)")

    # Step 3: Alert engine
    print_step(3, total_steps, "Evaluating alert thresholds...")
    try:
        alert_summary = run_alert_engine()
    except Exception as e:
        print(f"  ERROR: {e}")
        alert_summary = {"alerts": [], "new_alert_details": []}

    # Step 4: Stockout cost calculator
    print_step(4, total_steps, "Calculating stockout costs...")
    try:
        cost_summary = calculate_all_costs()
    except Exception as e:
        print(f"  ERROR: {e}")
        cost_summary = {}

    # Step 5: Send notifications
    print_step(5, total_steps, "Sending notifications...")
    if skip_notify:
        print("  Skipped (--skip-notify flag)")
    else:
        try:
            alerts_to_notify = alert_summary.get("new_alert_details", [])
            if alerts_to_notify:
                send_notifications(alerts_to_notify, cost_summary)
            else:
                print("  No new alerts to notify about")
        except Exception as e:
            print(f"  ERROR: {e}")

    # Step 6: Generate report
    print_step(6, total_steps, "Generating daily report...")
    try:
        report_content = generate_report(alert_summary, cost_summary)
        report_path = save_report(report_content)
        print(f"  Saved: {report_path}")
    except Exception as e:
        print(f"  ERROR: {e}")

    # --- Final Summary ---
    elapsed = round(time.time() - start_time, 1)
    tier_counts = get_tier_counts()
    total_items = sum(tier_counts.values())

    print("\n" + "=" * 60)
    print("  Pipeline Complete")
    print("=" * 60)
    print(f"  Time: {elapsed}s")
    print(f"  Items tracked: {total_items}")
    print(f"  Healthy: {tier_counts.get('healthy', 0)}")
    print(f"  Watch: {tier_counts.get('watch', 0)}")
    print(f"  Warning: {tier_counts.get('warning', 0)}")
    print(f"  Critical: {tier_counts.get('critical', 0)}")
    print(f"  Out of Stock: {tier_counts.get('out', 0)}")

    daily_cost = cost_summary.get("total_daily_cost", 0) if cost_summary else 0
    if daily_cost > 0:
        print(f"  Est. daily loss: ${daily_cost:,.2f}")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Inventory Intelligence Dashboard - Daily Pipeline"
    )
    parser.add_argument(
        "--skip-notify",
        action="store_true",
        help="Skip sending Slack/email notifications"
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Only generate the report (skip refresh, alerts, notifications)"
    )
    args = parser.parse_args()

    run_pipeline(
        skip_notify=args.skip_notify,
        report_only=args.report_only,
    )


if __name__ == "__main__":
    main()
