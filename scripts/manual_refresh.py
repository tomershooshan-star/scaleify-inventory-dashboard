"""
Manual refresh handler.
Checks data/imports/ for new CSV/XLSX files, processes each through the importer,
and moves processed files to data/imports/processed/.
Can be run manually or on a schedule.
"""

import os
import shutil
import sys

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from scripts.database import init_db
from scripts.import_inventory import import_file

IMPORT_DIR = os.path.join(BASE_DIR, "data", "imports")
PROCESSED_DIR = os.path.join(IMPORT_DIR, "processed")


def find_new_files() -> list:
    """Find all unprocessed CSV/XLSX files in the imports folder."""
    if not os.path.isdir(IMPORT_DIR):
        os.makedirs(IMPORT_DIR, exist_ok=True)
        return []

    files = []
    for fname in sorted(os.listdir(IMPORT_DIR)):
        if fname.lower().endswith((".csv", ".xlsx")):
            full_path = os.path.join(IMPORT_DIR, fname)
            if os.path.isfile(full_path):
                files.append(full_path)
    return files


def move_to_processed(file_path: str):
    """Move a file to the processed/ subfolder after import."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    dest = os.path.join(PROCESSED_DIR, os.path.basename(file_path))

    # Handle name collisions
    if os.path.exists(dest):
        base, ext = os.path.splitext(dest)
        counter = 1
        while os.path.exists(f"{base}_{counter}{ext}"):
            counter += 1
        dest = f"{base}_{counter}{ext}"

    shutil.move(file_path, dest)


def refresh() -> dict:
    """
    Process all new files in the imports folder.
    Returns: {"files_processed": int, "items_imported": int, "items_skipped": int}
    """
    files = find_new_files()

    if not files:
        print("No new files in data/imports/")
        return {"files_processed": 0, "items_imported": 0, "items_skipped": 0}

    print(f"Found {len(files)} file(s) to process")

    total_imported = 0
    total_skipped = 0
    files_processed = 0

    for file_path in files:
        fname = os.path.basename(file_path)
        print(f"\nProcessing: {fname}")

        try:
            result = import_file(file_path)
            total_imported += result["new"]
            total_skipped += result["skipped"]
            files_processed += 1
            move_to_processed(file_path)
            print(f"  -> {result['new']} items imported, {result['skipped']} skipped")
            print(f"  -> Moved to processed/")
        except Exception as e:
            print(f"  ERROR processing {fname}: {e}")
            # Don't move failed files -- leave them for inspection
            continue

    summary = {
        "files_processed": files_processed,
        "items_imported": total_imported,
        "items_skipped": total_skipped,
    }

    print(f"\nProcessed {files_processed} files, imported {total_imported} items")
    return summary


def main():
    init_db()
    refresh()


if __name__ == "__main__":
    main()
