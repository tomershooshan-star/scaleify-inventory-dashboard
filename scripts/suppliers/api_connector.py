"""
Generic REST API connector for suppliers with API access.
Makes authenticated GET requests, maps response to standard inventory format.
"""

import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

# Add parent dirs to path for imports
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from scripts.suppliers import SupplierConnector


class APIConnector(SupplierConnector):
    """Connector for suppliers that expose a REST API for inventory data."""

    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds
    TIMEOUT = 30  # seconds

    def __init__(self, config: dict):
        super().__init__(config)
        self.api_endpoint = config.get("api_endpoint", "")
        self.api_key_env = config.get("api_key_env", "")
        self.api_key = os.environ.get(self.api_key_env, "") if self.api_key_env else ""

        # Optional response mapping -- customize per supplier API
        # Maps supplier API field names to our standard field names
        self.field_map = config.get("field_map", {
            "sku": "sku",
            "product": "product",
            "category": "category",
            "stock": "current_stock",
            "price": "unit_cost",
        })

    def _make_request(self, url: str, params: dict = None) -> dict:
        """Make an authenticated GET request with retry logic."""
        headers = {
            "Accept": "application/json",
        }

        # Add API key to headers if available
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["X-API-Key"] = self.api_key

        last_error = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = requests.get(
                    url,
                    headers=headers,
                    params=params,
                    timeout=self.TIMEOUT,
                )
                response.raise_for_status()
                return response.json()

            except requests.exceptions.Timeout:
                last_error = f"Timeout after {self.TIMEOUT}s"
                print(f"  Attempt {attempt}/{self.MAX_RETRIES}: {last_error}")
            except requests.exceptions.ConnectionError as e:
                last_error = f"Connection error: {e}"
                print(f"  Attempt {attempt}/{self.MAX_RETRIES}: {last_error}")
            except requests.exceptions.HTTPError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
                print(f"  Attempt {attempt}/{self.MAX_RETRIES}: {last_error}")
                # Don't retry on 4xx errors (auth issues, bad requests)
                if e.response.status_code < 500:
                    break
            except requests.exceptions.RequestException as e:
                last_error = str(e)
                print(f"  Attempt {attempt}/{self.MAX_RETRIES}: {last_error}")

            if attempt < self.MAX_RETRIES:
                time.sleep(self.RETRY_DELAY * attempt)

        raise ConnectionError(f"Failed after {self.MAX_RETRIES} attempts: {last_error}")

    def _map_item(self, raw_item: dict) -> dict:
        """Map a supplier API response item to our standard format."""
        item = {}

        for our_field, api_field in self.field_map.items():
            # Support nested keys with dot notation (e.g., "inventory.quantity")
            value = raw_item
            for key in api_field.split("."):
                if isinstance(value, dict):
                    value = value.get(key, "")
                else:
                    value = ""
                    break
            item[our_field] = value

        # Ensure required fields
        item.setdefault("sku", "")
        item.setdefault("product", "")
        item.setdefault("category", "")
        item.setdefault("current_stock", 0)
        item.setdefault("unit_cost", 0)
        item.setdefault("daily_demand", 0)

        # Add supplier metadata
        item["supplier"] = self.name
        item["lead_time_days"] = self.lead_time
        item["reorder_qty"] = self.min_order

        # Parse numerics
        for field in ["current_stock", "unit_cost", "daily_demand", "reorder_qty", "lead_time_days"]:
            try:
                item[field] = float(str(item[field]).replace(",", "").replace("$", ""))
            except (ValueError, TypeError):
                item[field] = 0

        item["current_stock"] = int(item["current_stock"])
        item["reorder_qty"] = int(item["reorder_qty"])
        item["lead_time_days"] = int(item["lead_time_days"])

        return item

    def fetch_inventory(self) -> list:
        """Fetch inventory data from the supplier API."""
        if not self.api_endpoint:
            print(f"  WARNING: No API endpoint configured for {self.name}")
            return []

        if not self.api_key:
            print(f"  WARNING: No API key found for {self.name} (env var: {self.api_key_env})")
            return []

        print(f"  Fetching inventory from {self.name} API...")

        try:
            data = self._make_request(self.api_endpoint)
        except ConnectionError as e:
            print(f"  ERROR: {e}")
            return []

        # Handle common response formats
        items_raw = []
        if isinstance(data, list):
            items_raw = data
        elif isinstance(data, dict):
            # Try common wrapper keys
            for key in ["items", "products", "inventory", "data", "results"]:
                if key in data and isinstance(data[key], list):
                    items_raw = data[key]
                    break
            if not items_raw:
                # Single item response
                items_raw = [data]

        items = []
        for raw in items_raw:
            try:
                mapped = self._map_item(raw)
                if mapped["sku"]:
                    items.append(mapped)
            except Exception as e:
                print(f"  WARNING: Failed to parse item: {e}")
                continue

        print(f"  -> {len(items)} items fetched from {self.name}")
        return items

    def check_availability(self, sku: str) -> dict:
        """Check availability for a specific SKU."""
        if not self.api_endpoint or not self.api_key:
            return {
                "sku": sku,
                "available": False,
                "stock": 0,
                "lead_time_days": self.lead_time,
                "error": "API not configured",
            }

        try:
            # Try appending SKU to endpoint
            url = f"{self.api_endpoint.rstrip('/')}/{sku}"
            data = self._make_request(url)
            mapped = self._map_item(data)
            return {
                "sku": sku,
                "available": mapped["current_stock"] > 0,
                "stock": mapped["current_stock"],
                "lead_time_days": self.lead_time,
            }
        except Exception as e:
            return {
                "sku": sku,
                "available": False,
                "stock": 0,
                "lead_time_days": self.lead_time,
                "error": str(e),
            }


if __name__ == "__main__":
    # Quick test with a sample config
    test_config = {
        "name": "Test Supplier",
        "api_endpoint": "https://api.example.com/inventory",
        "api_key_env": "SUPPLIER_API_KEY_1",
        "lead_time_days": 5,
        "min_order_qty": 50,
    }
    connector = APIConnector(test_config)
    print(f"Connector: {connector}")
    print("Note: This will fail without a real API endpoint. Configure in suppliers.json.")
