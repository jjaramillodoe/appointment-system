#!/bin/bash

# Database Backup Script
# This script creates a backup of your local MongoDB before migration

set -e

echo "🗄️  Starting database backup..."

# Create backup directory if it doesn't exist
BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

echo "📅 Backup timestamp: $TIMESTAMP"
echo "📁 Backup directory: $BACKUP_DIR/$BACKUP_NAME"

# Create MongoDB backup
echo "📦 Creating MongoDB backup..."
mongodump --uri="mongodb://localhost:27017/appointment-system" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress the backup
echo "🗜️  Compressing backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"

# Remove uncompressed directory
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Create symlink to latest backup
if [ -L "$BACKUP_DIR/latest" ]; then
    rm "$BACKUP_DIR/latest"
fi
ln -s "${BACKUP_NAME}.tar.gz" "$BACKUP_DIR/latest"

echo "✅ Backup completed successfully!"
echo "📁 Backup file: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "🔗 Latest backup: $BACKUP_DIR/latest"

# Show backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"

# List all backups
echo ""
echo "📋 Available backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz | tail -5

echo ""
echo "💡 To restore this backup:"
echo "   npm run db:restore"
echo ""
echo "💡 To migrate to production:"
echo "   npm run migrate:to-production"
