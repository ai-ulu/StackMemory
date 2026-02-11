# 🚀 EN BASİT DEPLOYMENT - TEK KOMUT

Karmaşık şeyler yok, sadece 3 adım!

---

## Adım 1: Key'leri Hazırla (5 dakika)

### Supabase Keys
1. https://supabase.com → Login
2. Projen → Settings → API
3. Kopyala:
   - Project URL
   - anon public key
   - service_role secret key

### OpenAI Key
1. https://platform.openai.com/api-keys
2. Create new secret key
3. Kopyala

---

## Adım 2: SSH Bağlan

```bash
ssh root@187.77.64.91
```

---

## Adım 3: TEK KOMUT - ÇALIŞTIR!

```bash
curl -s https://raw.githubusercontent.com/ai-ulu/emergent-ai-ulu.com/main/ONE_COMMAND_DEPLOY.sh | bash
```

Script sana soracak:
- Supabase URL
- Supabase Anon Key
- Supabase Service Role Key
- OpenAI API Key
- Domain (187.77.64.91)
- Redis URL (ENTER bas, gerek yok)

**HEPSI BU!** 🎉

---

## Sonuç

5 dakika sonra:
```
http://187.77.64.91
```

Açılıyor! ✅

---

## Sorun Olursa

Logs:
```bash
docker logs -f $(docker ps | grep frontend | awk '{print $1}')
```

Restart:
```bash
docker restart $(docker ps | grep frontend | awk '{print $1}')
```

Temizle ve tekrar:
```bash
docker compose down
curl -s https://raw.githubusercontent.com/ai-ulu/emergent-ai-ulu.com/main/ONE_COMMAND_DEPLOY.sh | bash
```

---

## Alternatif: Manuel (Coolify Kullanmadan)

Eğer Coolify'ı hiç kullanmak istemiyorsan:

```bash
# SSH bağlan
ssh root@187.77.64.91

# Repo clone
cd /tmp
git clone https://github.com/ai-ulu/emergent-ai-ulu.com.git
cd emergent-ai-ulu.com

# .env oluştur
nano .env
# Key'leri yapıştır (yukarıdaki format)

# Deploy
docker compose -f docker-compose.coolify-no-redis.yml up -d --build

# Test
curl http://localhost:3000/api/health
```

**HEPSI BU!** 🔥

---

## Özet

1. Key'leri hazırla (5 dk)
2. SSH bağlan
3. Tek komut çalıştır
4. Bitti! 🎉

Daha basit olamaz! 💪
