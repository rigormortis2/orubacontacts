#!/usr/bin/env python3
"""
Comprehensive JSON backup script for orubacontacts database
Creates separate JSON files for each table with metadata
"""

import psycopg2
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'orubacontacts',
    'user': 'postgres',
    'password': 'postgres'
}

# Backup directory
BACKUP_DIR = '/Users/fatihalkan/Documents/GitHub/orubacontacts/backups/20251107_125734'

# Tables to backup
TABLES = [
    'odoo_contacts',
    'hospitals',
    'trello_matches',
    'contacts',
    'person_contacts',
    'cities',
    'job_titles',
    'hospital_types',
    'hospital_subtypes',
    'trello_raw_datas'
]

def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        raise

def get_database_version(conn) -> str:
    """Get PostgreSQL version"""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            return cur.fetchone()[0]
    except Exception as e:
        print(f"⚠️  Could not get database version: {e}")
        return "Unknown"

def get_table_columns(conn, table_name: str) -> List[str]:
    """Get column names for a table"""
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)
        return [row[0] for row in cur.fetchall()]

def backup_table(conn, table_name: str) -> Dict[str, Any]:
    """Backup a single table to JSON"""
    print(f"\n📦 Backing up {table_name}...")

    try:
        # Get columns
        columns = get_table_columns(conn, table_name)

        # Fetch all records
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {table_name};")
            rows = cur.fetchall()

        # Convert to list of dicts
        records = []
        for row in rows:
            record = {}
            for i, column in enumerate(columns):
                value = row[i]
                # Handle datetime serialization
                if isinstance(value, datetime):
                    value = value.isoformat()
                record[column] = value
            records.append(record)

        record_count = len(records)
        print(f"   Found {record_count} records")

        # Create backup object
        backup = {
            'metadata': {
                'tableName': table_name,
                'recordCount': record_count,
                'timestamp': datetime.now().isoformat(),
                'backupVersion': '1.0.0',
                'columns': columns
            },
            'data': records
        }

        # Write to file
        file_name = f"{table_name}_backup.json"
        file_path = os.path.join(BACKUP_DIR, file_name)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(backup, f, indent=2, ensure_ascii=False)

        # Get file size
        file_size = os.path.getsize(file_path)
        file_size_mb = file_size / (1024 * 1024)

        print(f"   ✅ Saved to {file_name} ({file_size_mb:.2f} MB)")

        return {
            'tableName': table_name,
            'recordCount': record_count,
            'timestamp': backup['metadata']['timestamp'],
            'filePath': file_path,
            'fileSize': file_size
        }

    except Exception as e:
        print(f"   ❌ Error backing up {table_name}: {e}")
        raise

def create_backups():
    """Main backup function"""
    print("🚀 Starting comprehensive database backup...")
    print(f"📁 Backup directory: {BACKUP_DIR}\n")

    # Ensure backup directory exists
    Path(BACKUP_DIR).mkdir(parents=True, exist_ok=True)

    backup_metadata = []
    conn = None

    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = get_db_connection()
        print("✅ Connection successful\n")

        # Get database version
        db_version = get_database_version(conn)

        # Backup each table
        for table in TABLES:
            metadata = backup_table(conn, table)
            backup_metadata.append(metadata)

        # Calculate totals
        total_records = sum(meta['recordCount'] for meta in backup_metadata)
        total_size = sum(meta['fileSize'] for meta in backup_metadata)

        # Create summary
        summary = {
            'backupTimestamp': datetime.now().isoformat(),
            'databaseVersion': db_version,
            'tables': backup_metadata,
            'totalRecords': total_records,
            'totalSize': total_size
        }

        # Write summary file
        summary_path = os.path.join(BACKUP_DIR, 'backup_summary.json')
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)

        # Print summary
        print("\n" + "=" * 80)
        print("✅ BACKUP COMPLETED SUCCESSFULLY")
        print("=" * 80)
        print(f"\n📊 Summary:")
        print(f"   Timestamp: {summary['backupTimestamp']}")
        print(f"   Database Version: {db_version.split(chr(10))[0]}")
        print(f"   Total Tables: {len(backup_metadata)}")
        print(f"   Total Records: {total_records:,}")
        print(f"   Total Size: {total_size / (1024 * 1024):.2f} MB")
        print("\n📋 Table Details:")

        for meta in backup_metadata:
            size_mb = meta['fileSize'] / (1024 * 1024)
            print(f"   - {meta['tableName']:<25} : {meta['recordCount']:>6,} records ({size_mb:.2f} MB)")

        print(f"\n📁 Backup location: {BACKUP_DIR}")
        print(f"📄 Summary file: backup_summary.json\n")

    except Exception as e:
        print(f"\n❌ Backup failed: {e}")
        raise
    finally:
        if conn:
            conn.close()
            print("🔌 Database connection closed")

if __name__ == '__main__':
    try:
        create_backups()
        print("🎉 Backup process completed successfully!")
        exit(0)
    except Exception as e:
        print(f"💥 Backup process failed: {e}")
        exit(1)
