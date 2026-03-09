# ⚡ Hızlı Deployment Rehberi - 15 Dakika

Redis sorununu atlayıp hızlıca deploy edelim!

## 🎯 Strateji

1. **Redis'siz deploy** (ilk çalışan versiyon)
2. **Sonra Redis ekle** (Upstash ile)

---

## 📋 Adım 1: Minimum Environment Variables (5 dakika)

Coolify dashboard → Environment Variables → Aşağıdakileri ekle:

### Supabase (3 key)
```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nereden alınır?**
- Supabase dashboard → Settings → API
- URL: Project URL
- Anon key: `anon` `public`
- Service role key: `service_role` `secret`

### OpenAI (1 key)
```env
OPENAI_API_KEY=sk-proj-...
```

**Nereden alınır?**
- https://platform.openai.com/api-keys
- **Create new secret key** tıkla

### App URL (3 değişken)
```env
APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
DOMAIN=your-domain.com
```

**Nereden alınır?**
- Coolify'dan alacağın domain
- Veya Coolify'ın verdiği subdomain
- Örnek: `stackmemory.coolify.io`

### Node ENV (2 değişken)
```env
NODE_ENV=production
ENVIRONMENT=production
```

**TOPLAM: 9 environment variable** ✅

---

## 🚀 Adım 2: Docker Compose Dosyasını Değiştir (2 dakika)

Coolify dashboard → Settings → Docker Compose File:

```
docker-compose.coolify-no-redis.yml
```

Bu dosya Redis'siz çalışır!

---

## 🔧 Adım 3: Deploy Et (5 dakika)

1. Coolify dashboard → **Deploy** tıkla
2. Build loglarını izle
3. Hata varsa bana söyle!

---

## ✅ Adım 4: Test Et (2 dakika)

```bash
# Health check
curl https://your-domain.com/api/health

# Browser'da aç
https://your-domain.com
```

---

## 🎉 Çalıştı mı?

### ✅ EVET - Çalıştı!
Tebrikler! Şimdi Redis ekleyelim:

1. **Upstash Redis Kurulumu** → `UPSTASH_REDIS_SETUP.md` oku
2. Upstash'ten connection string al
3. Coolify'da environment variable ekle:
   ```env
   REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   ```
4. Docker Compose'u değiştir: `docker-compose.coolify.yml`
5. **Redeploy** tıkla

### ❌ HAYIR - Hata Aldım!
Bana şunları söyle:
1. **Hata mesajı** (tam metin)
2. **Build logs** (Coolify'dan kopyala)
3. **Hangi adımda hata aldın?**

Beraber çözeriz! 💪

---

## 🔍 Sık Karşılaşılan Hatalar

### Hata 1: "SUPABASE_URL is not defined"
**Çözüm**: Environment variables'ı kontrol et, `NEXT_PUBLIC_` prefix'i unutma!

### Hata 2: "Build failed: npm install"
**Çözüm**: GitHub'da `package.json` var mı kontrol et

### Hata 3: "Port 3000 already in use"
**Çözüm**: Coolify'da başka container çalışıyor mu kontrol et

### Hata 4: "Cannot connect to Supabase"
**Çözüm**: Supabase URL'i doğru mu? `https://` var mı?

---

## 📊 Deployment Checklist

- [ ] Supabase keys eklendi (3 key)
- [ ] OpenAI key eklendi (1 key)
- [ ] App URL eklendi (3 değişken)
- [ ] Node ENV eklendi (2 değişken)
- [ ] Docker Compose dosyası: `docker-compose.coolify-no-redis.yml`
- [ ] Deploy tıklandı
- [ ] Build başarılı
- [ ] Health check çalışıyor
- [ ] Browser'da açılıyor

---

## 🚨 Acil Durum

Eğer hiçbir şey çalışmazsa:

1. **Coolify logs** → Bana gönder
2. **GitHub repo** → Public mi? Coolify erişebiliyor mu?
3. **Environment variables** → Screenshot at, bana gönder (key'leri gizle!)

---

## 📞 Yardım

Herhangi bir adımda takılırsan:
1. Hata mesajını kopyala
2. Hangi adımda olduğunu söyle
3. Bana gönder

Hemen çözeriz! 🔧

---

**Hedef: 15 dakikada çalışan bir deployment! ⚡**
