#!/bin/bash
# AI-ULU Restore Script

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    echo "Available backups:"
    ls -lh ./backups/backup_*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "📥 AI-ULU Restore"
echo "================="
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "⚠️  This will overwrite current data. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Stop services
echo "🛑 Stopping services..."
docker-compose -f docker-compose.prod.yml down

# Restore data
echo "📦 Restoring data..."
docker run --rm \
    -v emergent-ai-ulu_redis_data:/data/redis \
    -v emergent-ai-ulu_prometheus_data:/data/prometheus \
    -v emergent-ai-ulu_grafana_data:/data/grafana \
    -v $(pwd)/$(dirname $BACKUP_FILE):/backup \
    alpine tar xzf /backup/$(basename $BACKUP_FILE) -C /

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Restore complete!"
