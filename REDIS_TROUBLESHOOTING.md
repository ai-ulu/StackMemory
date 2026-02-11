# 🔧 Redis Troubleshooting - Coolify

## Problem: Redis Hata Veriyor

### Çözüm 1: Coolify'da Ayrı Redis Service

1. **Coolify Dashboard** → **New Resource**
2. **Database** → **Redis** seç
3. **Settings:**
   ```
   Name: ai-ulu-redis
   Version: 7-alpine
   Password: [güçlü-şifre]
   Port: 6379
   Persistence: AOF
   ```
4. **Deploy** et
5. **Connection String** kopyala:
   ```
   redis://:password@redis-service-name:6379
   ```

### Çözüm 2: Redis'siz Deployment (Geçici)

Redis olmadan da çalışabilir! Docker Compose'u güncelleyelim:

```yaml
# Redis'i kaldır, sadece frontend + backend
services:
  frontend:
    # ... frontend config
    environment:
      - REDIS_URL=  # Boş bırak
  
  backend:
    # ... backend config
    environment:
      - REDIS_URL=  # Boş bırak
```

Uygulama Redis yoksa memory cache kullanır.

### Çözüm 3: Redis Hatalarını Debug Et

#### 1. Container Loglarını Kontrol Et
```bash
# Coolify terminal'de
docker logs redis-container-name

# Son 50 satır
docker logs --tail 50 redis-container-name
```

#### 2. Redis CLI ile Test Et
```bash
# Redis container'a gir
docker exec -it redis-container-name redis-cli

# Password ile auth
AUTH your-password

# Test
PING
# Cevap: PONG olmalı

# Set/Get test
SET test "hello"
GET test
```

#### 3. Network Connectivity Test
```bash
# Frontend container'dan Redis'e ping
docker exec frontend-container ping redis-service-name

# Port açık mı kontrol et
docker exec frontend-container nc -zv redis-service-name 6379
```

### Çözüm 4: Basit Redis Config

Eğer hala çalışmıyorsa, en basit config:

```yaml
redis:
  image: redis:7-alpine
  restart: always
  command: redis-server --appendonly yes
  # Password YOK (sadece test için)
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### Çözüm 5: External Redis (Upstash)

Coolify Redis çalışmıyorsa, external Redis kullan:

1. **Upstash** → https://upstash.com (Free tier)
2. **Create Database** → Redis
3. **Connection String** kopyala:
   ```
   redis://default:xxx@xxx.upstash.io:6379
   ```
4. Coolify'da environment variable olarak ekle:
   ```env
   REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   ```

## Hangi Hatayı Alıyorsun?

Bana şunu söyle:
1. **Hata mesajı nedir?** (tam metin)
2. **Redis nasıl kurdun?** (Coolify UI'dan mı, docker-compose'da mı?)
3. **Logs ne diyor?** (`docker logs redis-container`)

Ona göre spesifik çözüm veririm! 🔧

## Hızlı Test

Redis çalışıyor mu test et:

```bash
# 1. Container çalışıyor mu?
docker ps | grep redis

# 2. Logs temiz mi?
docker logs redis-container-name

# 3. Connection test
docker exec redis-container-name redis-cli ping
```

Sonuçları paylaş, beraber çözeriz! 💪
