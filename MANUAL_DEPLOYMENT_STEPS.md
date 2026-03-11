# 🎯 StackMemory Manual Deployment Steps

Sen SSH ile bağlan, ben sana ne yapacağını söyleyeyim!

## 🔧 Adım 1: SSH Bağlan ve Sistem Kontrolü

```bash
# SSH bağlan
ssh root@187.77.64.91

# Sistem kontrolü
docker ps
docker --version
df -h
free -h
```

**Beklenen**: Docker çalışıyor, Coolify container'ı var

---

## 🔍 Adım 2: Redis Durumunu Kontrol Et

```bash
# Redis var mı?
docker ps | grep redis

# Varsa loglarına bak
docker logs $(docker ps | grep redis | awk '{print $1}')

# Redis test
docker exec $(docker ps | grep redis | awk '{print $1}') redis-cli ping
```

**Sonuç**:
- ✅ PONG yanıtı → Redis çalışıyor
- ❌ Hata → Redis'siz deployment yapacağız

---

## 🌐 Adım 3: Coolify Dashboard'a Git

Browser'da aç:
```
http://187.77.64.91:8000
```

Login yap (Coolify credentials)

---

## 📦 Adım 4: Yeni Resource Oluştur

1. **+ New Resource** tıkla
2. **Docker Compose** seç
3. **From Git Repository** seç

---

## 🔗 Adım 5: Repository Ayarları

```
Repository URL: https://github.com/ai-ulu/StackMemory
Branch: main
Docker Compose File: docker-compose.coolify-no-redis.yml
```

**ÖNEMLİ**: `docker-compose.coolify-no-redis.yml` kullan (Redis'siz)

---

## 🔐 Adım 6: Environment Variables Ekle

Coolify dashboard → **Environment Variables** sekmesi

### Minimum Gerekli (9 değişken):

```env
# 1-4: Supabase
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 5: OpenAI
OPENAI_API_KEY=sk-proj-...

# 6-8: App URL
APP_URL=http://187.77.64.91
NEXT_PUBLIC_APP_URL=http://187.77.64.91
DOMAIN=187.77.64.91

# 9-10: Node ENV
NODE_ENV=production
ENVIRONMENT=production
```

**Nereden alınır?**
- Supabase: `SUPABASE_KEYS_GUIDE.md` oku
- OpenAI: `OPENAI_KEY_GUIDE.md` oku

---

## 🚀 Adım 7: Deploy Et

1. **Deploy** butonuna tıkla
2. Build loglarını izle
3. Hata varsa bana söyle!

**Beklenen süre**: 5-10 dakika

---

## ✅ Adım 8: Test Et

### Browser'da Test
```
http://187.77.64.91
```

### SSH'dan Test
```bash
# Health check
curl http://localhost:3000/api/health

# Container'ları kontrol et
docker ps

# Frontend logs
docker logs $(docker ps | grep frontend | awk '{print $1}')

# Backend logs
docker logs $(docker ps | grep backend | awk '{print $1}')
```

---

## 🔧 Adım 9: Redis Ekle (Opsiyonel - Sonra)

Deployment çalıştıktan sonra:

### Seçenek A: Upstash Redis (Tavsiye)

1. https://upstash.com → Sign Up
2. Create Redis Database
3. Connection string al:
   ```
   redis://default:xxx@xxx.upstash.io:6379
   ```
4. Coolify'da environment variable ekle:
   ```env
   REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   ```
5. Docker Compose'u değiştir: `docker-compose.coolify.yml`
6. **Redeploy** tıkla

### Seçenek B: Coolify Redis Debug

```bash
# SSH'dan Redis container oluştur
docker run -d \
  --name stackmemory-redis \
  --network coolify \
  -e REDIS_PASSWORD=your-secure-password \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass your-secure-password

# Test et
docker exec stackmemory-redis redis-cli -a your-secure-password ping

# Coolify'da REDIS_URL ekle
REDIS_URL=redis://:your-secure-password@stackmemory-redis:6379
```

---

## 🚨 Sorun Giderme

### Hata 1: "Build failed"

```bash
# SSH'dan logs kontrol et
docker logs $(docker ps -a | grep frontend | awk '{print $1}')

# Disk doldu mu?
df -h

# Memory yeterli mi?
free -h
```

### Hata 2: "Cannot connect to Supabase"

```bash
# Network test
curl https://your-project.supabase.co

# Environment variables doğru mu?
docker exec $(docker ps | grep frontend | awk '{print $1}') env | grep SUPABASE
```

### Hata 3: "Port already in use"

```bash
# Port'u kim kullanıyor?
netstat -tlnp | grep :3000

# Container'ı durdur
docker stop $(docker ps | grep 3000 | awk '{print $1}')
```

---

## 📊 Monitoring

### Container Durumu
```bash
# Tüm container'lar
docker ps -a

# Logs (real-time)
docker logs -f $(docker ps | grep frontend | awk '{print $1}')

# Resource kullanımı
docker stats
```

### Disk ve Memory
```bash
# Disk
df -h

# Memory
free -h

# Docker disk kullanımı
docker system df
```

---

## 🎉 Başarılı Deployment Checklist

- [ ] Coolify dashboard açılıyor (http://187.77.64.91:8000)
- [ ] Environment variables eklendi (9 değişken)
- [ ] Docker Compose: `docker-compose.coolify-no-redis.yml`
- [ ] Deploy tıklandı
- [ ] Build başarılı (logs'da hata yok)
- [ ] Container'lar çalışıyor (`docker ps`)
- [ ] Frontend açılıyor (http://187.77.64.91)
- [ ] Health check çalışıyor (`/api/health`)
- [ ] Login sayfası görünüyor

---

## 📞 Yardım

Herhangi bir adımda takılırsan:

1. **Hata mesajını** kopyala
2. **Hangi adımda** olduğunu söyle
3. **Logs'u** paylaş:
   ```bash
   docker logs $(docker ps | grep frontend | awk '{print $1}') > frontend.log
   docker logs $(docker ps | grep backend | awk '{print $1}') > backend.log
   ```

Bana gönder, beraber çözeriz! 💪

---

## 🚀 Hızlı Komutlar

```bash
# Sistem durumu
docker ps && df -h && free -h

# Tüm logs
docker logs $(docker ps | grep frontend | awk '{print $1}')
docker logs $(docker ps | grep backend | awk '{print $1}')

# Restart
docker restart $(docker ps | grep frontend | awk '{print $1}')
docker restart $(docker ps | grep backend | awk '{print $1}')

# Temizlik
docker system prune -a
```

---

**Hazır mısın?** SSH'la bağlan ve başlayalım! 🔥
