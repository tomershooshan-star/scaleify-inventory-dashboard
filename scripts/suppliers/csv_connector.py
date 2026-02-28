"""
CSV-based connector for suppliers without APIs.
Watches a folder for CSV files matching supplier name pattern,
parses them, and moves processed files to a processed/ subfolder.
"""

import os
import shutil
import sys

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from scripts.suppliers import SupplierConnector
from scripts.import_inventory import read_csv_file, read_xlsx_file, parse_number


class CSVConnector(SupplierConnector):
    """Connector for suppliers that provide data via CSV/XLSX exports."""

    def __init__(self, config: dict):
        super().__init__(config)
        csv_folder = config.get("csv_folder", "data/imports/")
        if os.path.isabs(csv_folder):
            self.csv_folder = csv_folder
        else:
            self.csv_folder = os.path.join(BASE_DIR, csv_folder)
        self.processed_folder = os.path.join(self.csv_folder, "processed")

    def _find_files(self) -> list:
        """Find CSV/XLSX files in the watch folder that match this supplier."""
        if not os.path.isdir(self.csv_folder):
            return []

        matching = []
        supplier_lower = self.name.lower().replace(" ", "").replace("-", "").replace("_", "")

        for fname in os.listdir(self.csv_folder):
            if not fname.lower().endswith((".csv", ".xlsx")):
                continue
            # Skip files in processed subfolder
            full_path = os.path.join(self.csv_folder, fname)
            if not os.path.isfile(full_path):
                continue

            # Match by supplier name in filename (flexible matching)
            fname_lower = fname.lower().replace(" ", "").replace("-", "").replace("_", "")
            if supplier_lower in fname_lower:
                matching.append(full_path)

        return matching

    def _parse_file(self, file_path: str) -> list:
        """Parse a single CSV or XLSX file into standard format items."""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".csv":
            raw_rows = read_csv_file(file_path)
        elif ext in (".xlsx", ".xls"):
            raw_rows = read_xlsx_file(file_path)
        else:
            return []

        items = []
        for row_num, item in raw_rows:
            if not item.get("sku"):
                continue

            # Parse and normalize
            parsed = {
                "sku": item.get("sku", ""),
                "product": item.get("product", item.get("sku", "")),
                "category": item.get("category", ""),
                "location": item.get("location", ""),
                "current_stock": int(parse_number(item.get("current_stock", "0"))),
                "daily_demand": parse_number(item.get("daily_demand", "0")),
                "unit_cost": parse_number(item.get("unit_cost", "0")),
                "supplier": self.name,
                "lead_time_days": self.lead_time,
                "reorder_qty": int(parse_number(item.get("reorder_qty", str(self.min_order)))),
            }
            items.append(parsed)

        return items

    def _move_to_processed(self, file_path: str):
        """Move a processed file to the processed/ subfolder."""
        os.makedirs(self.processed_folder, exist_ok=True)
        dest = os.path.join(self.processed_folder, os.path.basename(file_path))

        # If file already exists in processed, add a counter
        if os.path.exists(dest):
            base, ext = os.path.splitext(dest)
            counter = 1
            while os.path.exists(f"{base}_{counter}{ext}"):
                counter += 1
            dest = f"{base}_{counter}{ext}"

        shutil.move(file_path, dest)

    def fetch_inventory(self) -> list:
        """
        Find and parse CSV files for this supplier.
        Moves processed files to processed/ subfolder.
        """
        files = self._find_files()

        if not files:
            print(f"  No new files found for {self.name} in {self.csv_folder}")
            return []

        all_items = []
        for file_path in files:
            print(f"  Parsing: {os.path.basename(file_path)}")
            items = self._parse_file(file_path)
            all_items.extend(items)
            self._move_to_processed(file_path)
            print(f"    -> {len(items)} items parsed, file moved to processed/")

        print(f"  -> {len(all_items)} total items from {self.name}")
        return all_items

    def check_availability(self, sku: str) -> dict:
        """
        For CSV-based suppliers, availability checks require fresh data.
        Returns last known data if available, otherwise indicates manual check needed.
        """
        return {
            "sku": sku,
            "available": False,
            "stock": 0,
            "lead_time_days": self.lead_time,
            "note": f"Manual check required -- contact {self.name} at {self.contact_email}",
        }


if __name__ == "__main__":
    test_config = {
        "name": "Test Supplier",
        "csv_folder": "data/imports/",
        "lead_time_days": 10,
        "min_order_qty": 100,
    }
    connector = CSVConnector(test_config)
    print(f"Connector: {connector}")
    print(f"Watch folder: {connector.csv_folder}")
    files = connector._find_files()
    print(f"Files found: {len(files)}")
