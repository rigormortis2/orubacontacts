#!/bin/bash

# Comprehensive JSON backup script for orubacontacts database
# Creates separate JSON files for each table with metadata

set -e

BACKUP_DIR="/Users/fatihalkan/Documents/GitHub/orubacontacts/backups/20251107_125734"
DB_CONTAINER="orubacontacts-db"
DB_NAME="orubacontacts"
DB_USER="postgres"

echo "🚀 Starting comprehensive database backup..."
echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup a table
backup_table() {
    local table_name=$1
    echo ""
    echo "📦 Backing up $table_name..."

    # Get record count
    local count=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table_name;")
    count=$(echo $count | tr -d ' ')

    echo "   Found $count records"

    # Export data as JSON using PostgreSQL's json_agg function
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "
        SELECT json_build_object(
            'metadata', json_build_object(
                'tableName', '$table_name',
                'recordCount', COUNT(*),
                'timestamp', NOW(),
                'backupVersion', '1.0.0'
            ),
            'data', COALESCE(json_agg(row_to_json(t.*)), '[]'::json)
        )
        FROM $table_name t;
    " | sed 's/^[[:space:]]*//' > "$BACKUP_DIR/${table_name}_backup.json"

    # Get file size
    local size=$(du -h "$BACKUP_DIR/${table_name}_backup.json" | cut -f1)
    echo "   ✅ Saved to ${table_name}_backup.json ($size)"
}

# Test connection
echo "🔌 Testing database connection..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
echo "✅ Connection successful"
echo ""

# Backup all tables
backup_table "odoo_contacts"
backup_table "hospitals"
backup_table "trello_matches"
backup_table "contacts"
backup_table "person_contacts"
backup_table "cities"
backup_table "job_titles"
backup_table "hospital_types"
backup_table "hospital_subtypes"
backup_table "trello_raw_datas"

# Get database version
DB_VERSION=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT version();")

# Create summary
echo ""
echo "📊 Creating backup summary..."

# Count total records and files
TOTAL_RECORDS=0
TOTAL_SIZE=0
TABLE_INFO=""

for table in odoo_contacts hospitals trello_matches contacts person_contacts cities job_titles hospital_types hospital_subtypes trello_raw_datas; do
    if [ -f "$BACKUP_DIR/${table}_backup.json" ]; then
        COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
        SIZE=$(stat -f%z "$BACKUP_DIR/${table}_backup.json" 2>/dev/null || stat -c%s "$BACKUP_DIR/${table}_backup.json" 2>/dev/null)
        TOTAL_RECORDS=$((TOTAL_RECORDS + COUNT))
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))

        SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
        TABLE_INFO="${TABLE_INFO}    {\"tableName\": \"$table\", \"recordCount\": $COUNT, \"fileSize\": $SIZE},\n"
    fi
done

# Remove trailing comma and newline
TABLE_INFO=$(echo -e "$TABLE_INFO" | sed '$ s/,$//')

# Create summary JSON
cat > "$BACKUP_DIR/backup_summary.json" << EOF
{
  "backupTimestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "databaseVersion": "$DB_VERSION",
  "tables": [
$TABLE_INFO
  ],
  "totalRecords": $TOTAL_RECORDS,
  "totalSize": $TOTAL_SIZE
}
EOF

echo "✅ Summary created"
echo ""
echo "================================================================================"
echo "✅ BACKUP COMPLETED SUCCESSFULLY"
echo "================================================================================"
echo ""
echo "📊 Summary:"
echo "   Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
echo "   Total Tables: 10"
echo "   Total Records: $(printf "%'d" $TOTAL_RECORDS)"
echo "   Total Size: $(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc) MB"
echo ""
echo "📋 Table Details:"
for table in odoo_contacts hospitals trello_matches contacts person_contacts cities job_titles hospital_types hospital_subtypes trello_raw_datas; do
    if [ -f "$BACKUP_DIR/${table}_backup.json" ]; then
        COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
        SIZE=$(stat -f%z "$BACKUP_DIR/${table}_backup.json" 2>/dev/null || stat -c%s "$BACKUP_DIR/${table}_backup.json" 2>/dev/null)
        SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
        printf "   - %-25s : %6s records (%.2f MB)\n" "$table" "$(printf "%'d" $COUNT)" "$SIZE_MB"
    fi
done

echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo "📄 Summary file: backup_summary.json"
echo ""
echo "🎉 Backup process completed successfully!"
