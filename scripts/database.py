"""
Database module for Inventory Intelligence Dashboard.
Creates and manages the SQLite database for inventory tracking, alerts, and cost logging.
"""

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "inventory.db")
DB_PATH = os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)

# Resolve relative paths against the project root
if not os.path.isabs(DB_PATH):
    DB_PATH = os.path.join(BASE_DIR, DB_PATH)


@contextmanager
def get_connection():
    """Context manager for database connections."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS inventory_items (
                sku TEXT NOT NULL,
                product TEXT NOT NULL,
                category TEXT DEFAULT '',
                location TEXT DEFAULT '',
                current_stock INTEGER DEFAULT 0,
                daily_demand REAL DEFAULT 0,
                days_left REAL DEFAULT 0,
                tier TEXT DEFAULT 'healthy',
                supplier TEXT DEFAULT '',
                unit_cost REAL DEFAULT 0,
                reorder_qty INTEGER DEFAULT 0,
                lead_time_days INTEGER DEFAULT 0,
                last_updated TEXT DEFAULT '',
                PRIMARY KEY (sku, location)
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL,
                product TEXT NOT NULL,
                tier TEXT NOT NULL,
                days_left REAL DEFAULT 0,
                estimated_daily_loss REAL DEFAULT 0,
                recommended_action TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                resolved_at TEXT,
                resolved INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS stockout_costs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL,
                product TEXT NOT NULL,
                date TEXT NOT NULL,
                daily_cost REAL DEFAULT 0,
                cost_type TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_inventory_tier ON inventory_items(tier);
            CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory_items(supplier);
            CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
            CREATE INDEX IF NOT EXISTS idx_alerts_sku ON alerts(sku);
            CREATE INDEX IF NOT EXISTS idx_stockout_date ON stockout_costs(date);
        """)
    print("Database initialized at:", DB_PATH)


def upsert_item(item: dict):
    """Insert or update an inventory item. Key is (sku, location)."""
    now = datetime.now().isoformat()
    item.setdefault("last_updated", now)

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO inventory_items
                (sku, product, category, location, current_stock, daily_demand,
                 days_left, tier, supplier, unit_cost, reorder_qty, lead_time_days, last_updated)
            VALUES
                (:sku, :product, :category, :location, :current_stock, :daily_demand,
                 :days_left, :tier, :supplier, :unit_cost, :reorder_qty, :lead_time_days, :last_updated)
            ON CONFLICT(sku, location) DO UPDATE SET
                product = excluded.product,
                category = excluded.category,
                current_stock = excluded.current_stock,
                daily_demand = excluded.daily_demand,
                days_left = excluded.days_left,
                tier = excluded.tier,
                supplier = excluded.supplier,
                unit_cost = excluded.unit_cost,
                reorder_qty = excluded.reorder_qty,
                lead_time_days = excluded.lead_time_days,
                last_updated = excluded.last_updated
        """, item)


def upsert_items_batch(items: list):
    """Insert or update multiple inventory items in a single transaction."""
    now = datetime.now().isoformat()
    for item in items:
        item.setdefault("last_updated", now)

    with get_connection() as conn:
        conn.executemany("""
            INSERT INTO inventory_items
                (sku, product, category, location, current_stock, daily_demand,
                 days_left, tier, supplier, unit_cost, reorder_qty, lead_time_days, last_updated)
            VALUES
                (:sku, :product, :category, :location, :current_stock, :daily_demand,
                 :days_left, :tier, :supplier, :unit_cost, :reorder_qty, :lead_time_days, :last_updated)
            ON CONFLICT(sku, location) DO UPDATE SET
                product = excluded.product,
                category = excluded.category,
                current_stock = excluded.current_stock,
                daily_demand = excluded.daily_demand,
                days_left = excluded.days_left,
                tier = excluded.tier,
                supplier = excluded.supplier,
                unit_cost = excluded.unit_cost,
                reorder_qty = excluded.reorder_qty,
                lead_time_days = excluded.lead_time_days,
                last_updated = excluded.last_updated
        """, items)


def get_all_items() -> list:
    """Return all inventory items as a list of dicts."""
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM inventory_items ORDER BY days_left ASC").fetchall()
        return [dict(row) for row in rows]


def get_items_by_tier(tier: str) -> list:
    """Return inventory items matching a specific tier."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory_items WHERE tier = ? ORDER BY days_left ASC",
            (tier,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_items_at_risk() -> list:
    """Return items in critical, warning, or out tiers."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory_items WHERE tier IN ('out', 'critical', 'warning') ORDER BY days_left ASC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_tier_counts() -> dict:
    """Return count of items per tier."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT tier, COUNT(*) as count FROM inventory_items GROUP BY tier"
        ).fetchall()
        return {row["tier"]: row["count"] for row in rows}


def create_alert(alert: dict) -> int:
    """Create a new alert. Returns the alert ID."""
    now = datetime.now().isoformat()
    alert.setdefault("created_at", now)
    alert.setdefault("resolved", 0)

    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO alerts (sku, product, tier, days_left, estimated_daily_loss,
                                recommended_action, created_at, resolved)
            VALUES (:sku, :product, :tier, :days_left, :estimated_daily_loss,
                    :recommended_action, :created_at, :resolved)
        """, alert)
        return cursor.lastrowid


def get_active_alerts() -> list:
    """Return all unresolved alerts."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts WHERE resolved = 0 ORDER BY tier ASC, days_left ASC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_alert_for_sku(sku: str) -> dict:
    """Return the most recent unresolved alert for a SKU, or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM alerts WHERE sku = ? AND resolved = 0 ORDER BY created_at DESC LIMIT 1",
            (sku,)
        ).fetchone()
        return dict(row) if row else None


def resolve_alert(alert_id: int):
    """Mark an alert as resolved."""
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE alerts SET resolved = 1, resolved_at = ? WHERE id = ?",
            (now, alert_id)
        )


def resolve_alerts_for_sku(sku: str):
    """Resolve all active alerts for a given SKU."""
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE alerts SET resolved = 1, resolved_at = ? WHERE sku = ? AND resolved = 0",
            (now, sku)
        )


def log_cost(cost: dict):
    """Log a stockout cost entry."""
    cost.setdefault("date", datetime.now().strftime("%Y-%m-%d"))
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO stockout_costs (sku, product, date, daily_cost, cost_type, notes)
            VALUES (:sku, :product, :date, :daily_cost, :cost_type, :notes)
        """, cost)


def get_costs_for_date(date: str) -> list:
    """Return all stockout costs for a given date."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM stockout_costs WHERE date = ? ORDER BY daily_cost DESC",
            (date,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_cost_summary(days: int = 30) -> dict:
    """Return cost summary for the last N days."""
    with get_connection() as conn:
        row = conn.execute("""
            SELECT
                SUM(daily_cost) as total_cost,
                COUNT(DISTINCT sku) as items_affected,
                COUNT(DISTINCT date) as days_with_costs
            FROM stockout_costs
            WHERE date >= date('now', ? || ' days')
        """, (f"-{days}",)).fetchone()
        return dict(row) if row else {"total_cost": 0, "items_affected": 0, "days_with_costs": 0}


if __name__ == "__main__":
    init_db()
