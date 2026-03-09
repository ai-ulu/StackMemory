#!/bin/bash

# StackMemory Coolify Deployment Script
# Kullanım: ssh root@187.77.64.91 'bash -s' < deploy-to-coolify.sh

set -e  # Hata olursa dur

echo "🚀 StackMemory Coolify Deployment Başlıyor..."
echo "=========================================="

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Sistem Kontrolü
echo -e "${YELLOW}📊 Sistem Kontrolü...${NC}"
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker compose version
echo "Disk kullanımı:"
df -h | grep -E '^/dev/'
echo "Memory kullanımı:"
free -h

# 2. Coolify Durumu
echo -e "\n${YELLOW}🔍 Coolify Durumu...${NC}"
docker ps | grep coolify || echo "Coolify container bulunamadı!"

# 3. Çalışan Container'ları Listele
echo -e "\n${YELLOW}📦 Çalışan Container'lar:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 4. Redis Kontrolü
echo -e "\n${YELLOW}🔧 Redis Kontrolü...${NC}"
if docker ps | grep -q redis; then
    echo -e "${GREEN}✅ Redis container çalışıyor${NC}"
    REDIS_CONTAINER=$(docker ps | grep redis | awk '{print $1}')
    echo "Redis logs (son 10 satır):"
    docker logs --tail 10 $REDIS_CONTAINER
else
    echo -e "${RED}❌ Redis container çalışmıyor${NC}"
    echo "Redis'siz deployment yapılacak..."
fi

# 5. Network Kontrolü
echo -e "\n${YELLOW}🌐 Network Kontrolü...${NC}"
docker network ls

# 6. Volume Kontrolü
echo -e "\n${YELLOW}💾 Volume Kontrolü...${NC}"
docker volume ls

# 7. Port Kontrolü
echo -e "\n${YELLOW}🔌 Port Kontrolü...${NC}"
echo "Açık portlar:"
netstat -tlnp | grep -E ':(80|443|8000|3000|6379)' || echo "İlgili portlar boş"

# 8. Coolify API Kontrolü
echo -e "\n${YELLOW}🔗 Coolify API Kontrolü...${NC}"
curl -s http://localhost:8000/api/health || echo "Coolify API'ye erişilemiyor"

# 9. GitHub Erişim Kontrolü
echo -e "\n${YELLOW}🐙 GitHub Erişim Kontrolü...${NC}"
curl -s https://api.github.com/repos/ai-ulu/emergent-ai-ulu.com | grep -q "full_name" && \
    echo -e "${GREEN}✅ GitHub repo erişilebilir${NC}" || \
    echo -e "${RED}❌ GitHub repo erişilemiyor${NC}"

# 10. Upstash Redis Önerisi
echo -e "\n${YELLOW}☁️ Upstash Redis Önerisi:${NC}"
echo "Coolify'da Redis sorun çıkarıyorsa, Upstash kullan:"
echo "1. https://upstash.com → Sign Up"
echo "2. Create Redis Database"
echo "3. Connection string al"
echo "4. Coolify'da REDIS_URL olarak ekle"

# 11. Deployment Checklist
echo -e "\n${YELLOW}✅ Deployment Checklist:${NC}"
echo "[ ] Supabase keys hazır mı?"
echo "[ ] OpenAI key hazır mı?"
echo "[ ] Domain/IP hazır mı?"
echo "[ ] Redis: Upstash mı yoksa Redis'siz mi?"

# 12. Önerilen Deployment Komutu
echo -e "\n${GREEN}🎯 Önerilen Deployment:${NC}"
echo "1. Coolify dashboard'a git: http://187.77.64.91:8000"
echo "2. New Resource → Docker Compose"
echo "3. Repository: https://github.com/ai-ulu/emergent-ai-ulu.com"
echo "4. Docker Compose File: docker-compose.coolify-no-redis.yml"
echo "5. Environment Variables ekle (minimum 9 değişken)"
echo "6. Deploy tıkla"

# 13. Hızlı Redis Test
echo -e "\n${YELLOW}🧪 Redis Test (varsa):${NC}"
if docker ps | grep -q redis; then
    REDIS_CONTAINER=$(docker ps | grep redis | awk '{print $1}')
    docker exec $REDIS_CONTAINER redis-cli ping 2>/dev/null && \
        echo -e "${GREEN}✅ Redis PONG yanıtı verdi${NC}" || \
        echo -e "${RED}❌ Redis yanıt vermiyor${NC}"
fi

# 14. Sonuç
echo -e "\n${GREEN}=========================================="
echo "✅ Sistem Analizi Tamamlandı!"
echo "==========================================${NC}"
echo ""
echo "📋 Sonraki Adımlar:"
echo "1. Coolify dashboard'a git"
echo "2. Environment variables'ı hazırla"
echo "3. Redis'siz deployment yap (docker-compose.coolify-no-redis.yml)"
echo "4. Deployment çalıştıktan sonra Upstash Redis ekle"
echo ""
echo "🔗 Coolify: http://187.77.64.91:8000"
echo "📚 Rehber: QUICK_DEPLOY_GUIDE.md"
