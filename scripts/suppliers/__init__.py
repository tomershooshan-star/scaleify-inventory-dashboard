"""
Supplier connectors for the Inventory Intelligence Dashboard.
Each connector normalizes supplier data into a standard format.
"""


class SupplierConnector:
    """Base class for all supplier connectors."""

    def __init__(self, config: dict):
        self.name = config.get("name", "Unknown Supplier")
        self.lead_time = config.get("lead_time_days", 7)
        self.min_order = config.get("min_order_qty", 1)
        self.categories = config.get("categories", [])
        self.contact_email = config.get("contact_email", "")
        self.config = config

    def fetch_inventory(self) -> list:
        """
        Fetch current inventory data from this supplier.
        Returns a list of dicts with standard fields:
            sku, product, category, current_stock, daily_demand,
            unit_cost, reorder_qty, lead_time_days, supplier
        """
        raise NotImplementedError(f"{self.__class__.__name__} must implement fetch_inventory()")

    def check_availability(self, sku: str) -> dict:
        """
        Check availability for a specific SKU with this supplier.
        Returns: {"sku": str, "available": bool, "stock": int, "lead_time_days": int}
        """
        raise NotImplementedError(f"{self.__class__.__name__} must implement check_availability()")

    def __repr__(self):
        return f"<{self.__class__.__name__} name='{self.name}'>"
