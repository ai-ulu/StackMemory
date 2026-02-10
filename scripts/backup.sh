#!/bin/bash
# AI-ULU Backup Script

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

echo "💾 AI-ULU Backup"
echo "================"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data volumes
echo "📦 Backing up data volumes..."
docker run --rm \
    -v emergent-ai-ulu_redis_data:/data/redis \
    -v emergent-ai-ulu_prometheus_data:/data/prometheus \
    -v emergent-ai-ulu_grafana_data:/data/grafana \
    -v $(pwd)/$BACKUP_DIR:/backup \
    alpine tar czf /backup/backup_$TIMESTAMP.tar.gz /data

echo "✅ Backup created: $BACKUP_FILE"
echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"

# Keep only last 7 backups
echo "🧹 Cleaning old backups..."
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup complete!"
