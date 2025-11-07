# Database Backup - orubacontacts

## Backup Information

**Backup Date:** 2025-11-07 10:02:35 UTC
**Database:** orubacontacts
**Database Version:** PostgreSQL 16.10 on aarch64-unknown-linux-musl
**Backup Type:** Comprehensive JSON + SQL
**Total Records:** 5,097
**Total Size:** 2.05 MB (JSON) + 1.4 MB (SQL)

## Backup Contents

This backup contains complete exports of all database tables in both JSON and SQL formats:

### JSON Backups (10 tables)

Each JSON file contains:
- **metadata**: Table name, record count, timestamp, backup version
- **data**: Array of all records with all columns

| Table Name | Records | Size | Description |
|------------|---------|------|-------------|
| odoo_contacts | 923 | 0.37 MB | Odoo contact imports with matching data |
| hospitals | 1,855 | 0.64 MB | Hospital reference data with relationships |
| trello_matches | 1,010 | 0.37 MB | Trello card matches to hospitals |
| contacts | 199 | 0.14 MB | Contact management system entries |
| person_contacts | 0 | 0.00 MB | Person-level contacts (legacy) |
| cities | 84 | 0.02 MB | Turkish cities reference table |
| job_titles | 4 | 0.00 MB | Job title reference data |
| hospital_types | 4 | 0.00 MB | Hospital type classifications |
| hospital_subtypes | 8 | 0.00 MB | Hospital subtype classifications |
| trello_raw_datas | 1,010 | 0.51 MB | Raw Trello card data |

### Files in This Backup

```
backups/20251107_125734/
├── backup_summary.json                 # Summary metadata for all backups
├── full_backup.sql                     # Complete SQL dump
├── odoo_contacts_backup.json          # Odoo contacts with matching
├── hospitals_backup.json              # Hospital reference data
├── trello_matches_backup.json         # Trello matches
├── contacts_backup.json               # Contact entries
├── person_contacts_backup.json        # Person contacts
├── cities_backup.json                 # Cities reference
├── job_titles_backup.json             # Job titles
├── hospital_types_backup.json         # Hospital types
├── hospital_subtypes_backup.json      # Hospital subtypes
├── trello_raw_datas_backup.json       # Raw Trello data
├── create_json_backups.sh             # Backup script (Shell)
├── create_json_backups.py             # Backup script (Python)
└── BACKUP_README.md                   # This file
```

## JSON File Structure

Each JSON backup file follows this structure:

```json
{
  "metadata": {
    "tableName": "table_name",
    "recordCount": 123,
    "timestamp": "2025-11-07T10:02:34.657790+00:00",
    "backupVersion": "1.0.0"
  },
  "data": [
    {
      "id": "uuid",
      "field1": "value1",
      "field2": "value2",
      ...
    },
    ...
  ]
}
```

## How to Use This Backup

### Restore Entire Database (SQL)

```bash
# Using Docker
docker exec -i orubacontacts-db psql -U postgres -d orubacontacts < full_backup.sql

# Direct PostgreSQL
psql -U postgres -d orubacontacts < full_backup.sql
```

### Load Specific Table (JSON)

```python
import json

# Load a backup file
with open('hospitals_backup.json', 'r') as f:
    backup = json.load(f)

# Access metadata
print(f"Table: {backup['metadata']['tableName']}")
print(f"Records: {backup['metadata']['recordCount']}")

# Access data
hospitals = backup['data']
for hospital in hospitals:
    print(hospital['hastaneAdi'])
```

### Query Data from JSON (Using jq)

```bash
# Get all hospital names
jq '.data[].hastaneAdi' hospitals_backup.json

# Get contacts with email
jq '.data[] | select(.email != null)' contacts_backup.json

# Count records in a table
jq '.metadata.recordCount' odoo_contacts_backup.json
```

### Import JSON Back to Database

```python
import json
import psycopg2

# Load backup
with open('hospitals_backup.json', 'r') as f:
    backup = json.load(f)

# Connect to database
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='orubacontacts',
    user='postgres',
    password='postgres'
)

# Insert records (example)
with conn.cursor() as cur:
    for record in backup['data']:
        # Build INSERT query based on your schema
        # ...
        pass

conn.commit()
conn.close()
```

## Database Schema Overview

### Core Tables

- **hospitals**: Main hospital reference table with 1,855 hospitals
  - Linked to cities, types, and subtypes
  - Contains hospital name (hastaneAdi) and location (il)

- **odoo_contacts**: 923 contacts imported from Odoo live system
  - Can be matched to hospitals
  - Contains matching status and confidence scores

- **contacts**: 199 contact entries in the new contact management system
  - Linked to hospitals and job titles
  - Contains personal information and notes

- **trello_matches**: 1,010 matches between Trello cards and hospitals
  - Contains contact information (phone, email) by role

### Reference Tables

- **cities**: 84 Turkish provinces and special locations
- **job_titles**: 4 job title classifications (Doktor, Satınalma, Biyomedikal, Diğer)
- **hospital_types**: 4 hospital types (Kamu, Özel, Muayenehane, Diğer)
- **hospital_subtypes**: 8 subtypes (Devlet, Eğitim Araştırma, etc.)

## Data Integrity

All JSON files have been verified:
- Valid JSON structure
- Correct record counts
- Complete field data
- UTF-8 encoding
- Pretty-printed (indent=2)

## Backup Script

The backup was created using:

```bash
./create_json_backups.sh
```

This script:
1. Connects to PostgreSQL via Docker
2. Exports each table as JSON using PostgreSQL's `json_agg()` function
3. Includes complete metadata for each table
4. Generates a summary file with statistics
5. Verifies all exports were successful

## Notes

- **Date Format**: All timestamps are in ISO 8601 format with timezone
- **UUIDs**: All IDs are UUID v4 format
- **Encoding**: UTF-8 with proper Turkish character support
- **Null Values**: Preserved as `null` in JSON
- **Relations**: Foreign keys are preserved as UUID strings

## Backup Verification

To verify backup integrity:

```bash
# Check JSON validity
for file in *_backup.json; do
    echo "Checking $file..."
    python3 -m json.tool "$file" > /dev/null && echo "✅ Valid" || echo "❌ Invalid"
done

# Compare record counts
docker exec orubacontacts-db psql -U postgres -d orubacontacts -c "\
    SELECT 'hospitals' as table, COUNT(*) FROM hospitals UNION ALL \
    SELECT 'contacts', COUNT(*) FROM contacts UNION ALL \
    SELECT 'odoo_contacts', COUNT(*) FROM odoo_contacts;"
```

## Support

For questions or issues with this backup:
- Check database connection settings
- Verify PostgreSQL container is running
- Ensure sufficient disk space for restore
- Review schema migrations if restoring to different version

## Version History

- **v1.0.0** (2025-11-07): Initial comprehensive backup
  - All 10 tables exported
  - Complete data with relationships
  - Verified integrity

---

**Backup created by:** Automated backup script
**Contact:** Check database administrator for restore procedures
