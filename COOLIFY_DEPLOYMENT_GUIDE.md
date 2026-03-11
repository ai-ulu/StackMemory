# 🚀 Coolify Deployment Guide - Hostinger

Bu rehber, StackMemory'i Hostinger üzerinde Coolify ile deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

### 1. Hostinger VPS
- ✅ VPS aktif ve çalışıyor
- ✅ Coolify kurulu
- ✅ Domain bağlı (opsiyonel)

### 2. Gerekli Bilgiler
- Coolify dashboard URL'i
- GitHub repository erişimi
- Environment variables

---

## 🔧 Adım 1: Coolify'da Yeni Proje Oluştur

### 1.1 Coolify Dashboard'a Giriş
```
https://your-coolify-instance.com
```

### 1.2 Yeni Resource Ekle
1. **"+ New Resource"** butonuna tıkla
2. **"Docker Compose"** seç
3. **"From Git Repository"** seç

### 1.3 Repository Ayarları
```
Repository: https://github.com/ai-ulu/StackMemory
Branch: main
Docker Compose File: docker-compose.coolify.yml
```

---

## 🔐 Adım 2: Environment Variables Ayarla

Coolify dashboard'da **"Environment Variables"** sekmesine git ve aşağıdaki değişkenleri ekle:

### Supabase (ZORUNLU)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### OpenAI (ZORUNLU)
```env
OPENAI_API_KEY=sk-...
```

### Stripe (Billing için)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_...
```

### Redis (Cache için)
```env
REDIS_PASSWORD=your-secure-password
```

### App Configuration
```env
APP_URL=https://your-domain.com
DOMAIN=your-domain.com
NODE_ENV=production
```

### Opsiyonel
```env
BRAVE_API_KEY=your-brave-key
GITHUB_TOKEN=ghp_...
```

---

## 🌐 Adım 3: Domain Ayarları

### 3.1 Coolify'da Domain Ekle
1. **"Domains"** sekmesine git
2. **"Add Domain"** tıkla
3. Domain adını gir: `your-domain.com`
4. **"Generate SSL Certificate"** seç (Let's Encrypt)

### 3.2 DNS Ayarları (Hostinger)
Hostinger DNS panelinde:

```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_VPS_IP
TTL: 3600
```

---

## 🚀 Adım 4: Deploy Et

### 4.1 İlk Deploy
1. Coolify dashboard'da **"Deploy"** butonuna tıkla
2. Build loglarını izle
3. Deployment tamamlanana kadar bekle (~5-10 dakika)

### 4.2 Deployment Durumunu Kontrol Et
```bash
# Coolify terminal'de
docker ps

# Logları kontrol et
docker logs stackmemory-frontend
docker logs stackmemory-backend
docker logs stackmemory-redis
```

---

## ✅ Adım 5: Doğrulama

### 5.1 Health Check
```bash
# Frontend
curl https://your-domain.com/api/health

# Backend
curl https://your-domain.com/api/backend/health
```

### 5.2 Browser'da Test
1. `https://your-domain.com` aç
2. Login sayfasını kontrol et
3. Signup yapıp test et
4. Memory oluştur ve test et

---

## 🔄 Adım 6: Otomatik Deployment (CI/CD)

### 6.1 GitHub Webhook Ekle
Coolify otomatik olarak webhook oluşturur:

1. **"Settings"** → **"Webhooks"** git
2. Webhook URL'ini kopyala
3. GitHub repository → **Settings** → **Webhooks**
4. **"Add webhook"** tıkla
5. Payload URL'e Coolify webhook'u yapıştır
6. Content type: `application/json`
7. Events: **"Just the push event"**

### 6.2 Otomatik Deploy Test
```bash
# Local'de değişiklik yap
git add .
git commit -m "test: coolify auto-deploy"
git push origin main

# Coolify dashboard'da deployment'ı izle
```

---

## 📊 Adım 7: Monitoring

### 7.1 Coolify Metrics
Coolify dashboard'da:
- CPU kullanımı
- Memory kullanımı
- Network trafiği
- Container durumu

### 7.2 Application Logs
```bash
# Frontend logs
docker logs -f stackmemory-frontend

# Backend logs
docker logs -f stackmemory-backend

# Nginx logs
docker logs -f stackmemory-nginx
```

---

## 🔧 Troubleshooting

### Problem 1: Build Hatası
```bash
# Logs kontrol et
docker logs stackmemory-frontend

# Container'ı yeniden başlat
docker restart stackmemory-frontend
```

### Problem 2: Environment Variables Yüklenmedi
1. Coolify dashboard → **"Environment Variables"**
2. Değişkenleri kontrol et
3. **"Redeploy"** tıkla

### Problem 3: SSL Certificate Hatası
```bash
# Coolify'da SSL yenile
# Settings → Domains → Regenerate Certificate
```

### Problem 4: Database Connection Hatası
```bash
# Supabase URL'i kontrol et
echo $SUPABASE_URL

# Network connectivity test
curl https://your-project.supabase.co
```

---

## 🔐 Güvenlik Kontrol Listesi

- [ ] Environment variables güvenli
- [ ] SSL certificate aktif
- [ ] Firewall kuralları ayarlı
- [ ] Redis password güçlü
- [ ] Supabase RLS aktif
- [ ] Rate limiting aktif (nginx)
- [ ] CORS ayarları doğru

---

## 📈 Performance Optimizasyonu

### 1. Redis Cache
```env
# Redis memory limit
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

### 2. Nginx Caching
```nginx
# Static files cache (1 year)
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Next.js Optimization
```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}
```

---

## 🔄 Backup Stratejisi

### 1. Database Backup (Supabase)
Supabase otomatik backup yapar, ama manuel backup için:
```bash
# Supabase dashboard → Database → Backups
```

### 2. Redis Backup
```bash
# Redis AOF persistence aktif
docker exec stackmemory-redis redis-cli BGSAVE
```

### 3. Environment Variables Backup
```bash
# Coolify dashboard → Export Configuration
```

---

## 📞 Destek

### Coolify Dokümantasyon
- https://coolify.io/docs

### StackMemory Dokümantasyon
- Product docs and guides in this repository

### GitHub Issues
- https://github.com/ai-ulu/StackMemory/issues

---

## 🎉 Deployment Tamamlandı!

Artık StackMemory production'da çalışıyor:
- ✅ Frontend: `https://your-domain.com`
- ✅ Backend API: `https://your-domain.com/api/backend`
- ✅ SSL aktif
- ✅ Auto-deploy aktif
- ✅ Monitoring aktif

**Tebrikler! 🚀**

---

## 📋 Hızlı Komutlar

```bash
# Container durumu
docker ps

# Logs
docker logs -f stackmemory-frontend

# Restart
docker restart stackmemory-frontend

# Environment variables
docker exec stackmemory-frontend env

# Redis CLI
docker exec -it stackmemory-redis redis-cli

# Nginx reload
docker exec stackmemory-nginx nginx -s reload

# Disk kullanımı
df -h

# Memory kullanımı
free -h
```

---

**Made with ❤️ by Kiro Autonomous Agent**
