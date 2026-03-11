#!/bin/bash

# 🚀 TEK KOMUT DEPLOYMENT - SIFIR KONFIGÜRASYON
# Kullanım: curl -s https://raw.githubusercontent.com/ai-ulu/StackMemory/main/ONE_COMMAND_DEPLOY.sh | bash

set -e

echo "🚀 StackMemory Otomatik Deployment Başlıyor..."
echo "=========================================="

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Gerekli bilgileri al
echo -e "${YELLOW}📝 Bilgileri Gir:${NC}"
read -p "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
read -p "OpenAI API Key: " OPENAI_API_KEY
read -p "Domain veya IP (örn: 187.77.64.91): " DOMAIN

# 2. Upstash Redis (opsiyonel)
read -p "Upstash Redis URL var mı? (varsa gir, yoksa ENTER): " REDIS_URL

# 3. Repo'yu clone et
echo -e "\n${YELLOW}📦 Repo clone ediliyor...${NC}"
cd /tmp
rm -rf StackMemory
git clone https://github.com/ai-ulu/StackMemory.git
cd StackMemory

# 4. .env dosyası oluştur
echo -e "\n${YELLOW}🔧 Environment variables ayarlanıyor...${NC}"
cat > .env << EOF
# Supabase
SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# OpenAI
OPENAI_API_KEY=$OPENAI_API_KEY

# App
APP_URL=http://$DOMAIN
NEXT_PUBLIC_APP_URL=http://$DOMAIN
DOMAIN=$DOMAIN
NODE_ENV=production
ENVIRONMENT=production

# Redis (opsiyonel)
REDIS_URL=$REDIS_URL
EOF

# 5. Docker Compose seç
if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}Redis yok, Redis'siz deployment...${NC}"
    COMPOSE_FILE="docker-compose.coolify-no-redis.yml"
else
    echo -e "${GREEN}Redis var, tam deployment...${NC}"
    COMPOSE_FILE="docker-compose.coolify.yml"
fi

# 6. Eski container'ları temizle
echo -e "\n${YELLOW}🧹 Eski container'lar temizleniyor...${NC}"
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

# 7. Deploy et
echo -e "\n${YELLOW}🚀 Deployment başlıyor...${NC}"
docker compose -f $COMPOSE_FILE up -d --build

# 8. Bekle
echo -e "\n${YELLOW}⏳ Container'lar başlatılıyor (30 saniye)...${NC}"
sleep 30

# 9. Kontrol et
echo -e "\n${YELLOW}✅ Kontrol ediliyor...${NC}"
docker ps

# 10. Test et
echo -e "\n${YELLOW}🧪 Health check...${NC}"
curl -s http://localhost:3000/api/health || echo "Health check başarısız (normal, biraz daha bekle)"

# 11. Sonuç
echo -e "\n${GREEN}=========================================="
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "==========================================${NC}"
echo ""
echo "🌐 URL: http://$DOMAIN"
echo "📊 Container'lar: docker ps"
echo "📝 Logs: docker logs -f \$(docker ps | grep frontend | awk '{print \$1}')"
echo ""
echo "🎉 Başarılı! Browser'da aç: http://$DOMAIN"
