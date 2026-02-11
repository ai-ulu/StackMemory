# 🚀 Upstash Redis Kurulumu (Ücretsiz)

Coolify'da Redis sorun çıkarıyorsa, Upstash kullan - tamamen ücretsiz!

## Adım 1: Upstash Hesabı Oluştur

1. https://upstash.com adresine git
2. **Sign Up** (GitHub ile giriş yapabilirsin)
3. Ücretsiz - kredi kartı gerektirmez

## Adım 2: Redis Database Oluştur

1. Dashboard'da **Create Database** tıkla
2. Ayarlar:
   ```
   Name: ai-ulu-redis
   Type: Regional
   Region: Europe (en yakın)
   TLS: Enabled
   Eviction: No eviction
   ```
3. **Create** tıkla

## Adım 3: Connection String Al

Database oluşturulduktan sonra:

1. **Details** sekmesine git
2. **REST API** sekmesinde:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxx...
   ```
3. **Redis CLI** sekmesinde:
   ```
   redis://default:xxx@xxx.upstash.io:6379
   ```

## Adım 4: Coolify'da Environment Variables Ekle

Coolify dashboard → Environment Variables:

```env
# Upstash Redis
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379

# Veya REST API kullan (daha güvenli)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...
```

## Adım 5: Deploy Et

Artık Redis hazır! Coolify'da **Deploy** tıkla.

## Test Et

```bash
# Upstash dashboard'da "CLI" sekmesine git
# Veya local'de test et:

redis-cli -u redis://default:PASSWORD@HOST.upstash.io:6379

# Test
PING
# Cevap: PONG

SET test "hello"
GET test
# Cevap: "hello"
```

## Avantajları

✅ Ücretsiz (10,000 komut/gün)
✅ Kurulum yok - hemen çalışır
✅ TLS/SSL güvenli
✅ Global replication
✅ Otomatik backup
✅ Dashboard ile monitoring

## Ücretsiz Limitler

- **10,000 komut/gün**
- **256 MB storage**
- **1 GB bandwidth**

AI-ULU için yeterli! 🎉

## Alternatif: Redis Cloud

Eğer Upstash'i sevmezsen:

1. https://redis.com/try-free
2. **Free tier**: 30 MB, 30 connections
3. Connection string al
4. Coolify'da environment variable olarak ekle

---

**Tavsiye**: Upstash kullan - en kolay ve güvenilir! 💪
