# 🔑 Supabase Keys Nasıl Alınır?

## Adım 1: Supabase Dashboard'a Git

1. https://supabase.com → Login
2. Projenizi seçin (veya yeni proje oluşturun)

---

## Adım 2: API Keys Sayfasına Git

Sol menüden:
```
Settings → API
```

---

## Adım 3: Key'leri Kopyala

### 1. Project URL
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```

**Coolify'da kullanım:**
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

### 2. Anon Key (Public)
```
anon public
```

Bu key'i kopyala (uzun bir JWT token)

**Coolify'da kullanım:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg4ODg4ODgsImV4cCI6MjAwNDQ2NDg4OH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Service Role Key (Secret)
```
service_role secret
```

⚠️ **DİKKAT**: Bu key'i GİZLİ tut! Admin yetkisi var!

**Coolify'da kullanım:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4ODg4ODg4OCwiZXhwIjoyMDA0NDY0ODg4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📋 Özet: Coolify'da Eklenecek 4 Key

```env
# 1. Project URL
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# 2. Project URL (Public - Frontend için)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# 3. Anon Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. Service Role Key (Secret - Backend için)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔒 Güvenlik Notları

### ✅ Public (Güvenli)
- `NEXT_PUBLIC_SUPABASE_URL` - Frontend'de görünür
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Frontend'de görünür
- Row Level Security (RLS) ile korunur

### ⚠️ Secret (GİZLİ TUT!)
- `SUPABASE_SERVICE_ROLE_KEY` - ASLA frontend'de kullanma!
- Admin yetkisi var - tüm verilere erişebilir
- Sadece backend'de kullan

---

## 🧪 Test Et

Supabase key'lerini test etmek için:

```bash
# Anon key ile test (public)
curl https://xxxxxxxxxxxxx.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Cevap: {"message":"Welcome to PostgREST"}
```

---

## 🚨 Sorun Giderme

### Hata: "Invalid API key"
- Key'i doğru kopyaladın mı?
- Başında/sonunda boşluk var mı?
- Tüm key'i kopyaladın mı? (çok uzun olabilir)

### Hata: "Project not found"
- Project URL doğru mu?
- `https://` var mı?
- `.supabase.co` ile bitiyor mu?

### Hata: "Unauthorized"
- Anon key mi kullanıyorsun? (Service role değil)
- RLS aktif mi? (Supabase → Authentication → Policies)

---

## 📸 Screenshot Rehberi

1. **Supabase Dashboard** → Sol menü → **Settings**
2. **Settings** → **API** sekmesi
3. **Project URL** → Kopyala
4. **Project API keys** → `anon` `public` → Kopyala
5. **Project API keys** → `service_role` `secret` → Kopyala (GİZLİ!)

---

## ✅ Checklist

- [ ] Supabase dashboard'a giriş yaptım
- [ ] Settings → API sayfasına gittim
- [ ] Project URL'i kopyaladım
- [ ] Anon key'i kopyaladım
- [ ] Service role key'i kopyaladım (GİZLİ!)
- [ ] Coolify'da environment variables'a ekledim
- [ ] Test ettim (curl veya browser)

---

**Hazır mısın?** Key'leri aldıktan sonra Coolify'da deployment'a geçebiliriz! 🚀
