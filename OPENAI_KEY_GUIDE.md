# 🤖 OpenAI API Key Nasıl Alınır?

## Adım 1: OpenAI Platform'a Git

1. https://platform.openai.com → Login
2. Hesabın yoksa **Sign Up** (ücretsiz)

---

## Adım 2: API Keys Sayfasına Git

Sol menüden:
```
API keys
```

Veya direkt: https://platform.openai.com/api-keys

---

## Adım 3: Yeni Key Oluştur

1. **Create new secret key** butonuna tıkla
2. Key'e isim ver (örn: "AI-ULU Production")
3. **Create secret key** tıkla
4. ⚠️ **ÖNEMLİ**: Key'i hemen kopyala! Bir daha göremezsin!

```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Adım 4: Coolify'da Kullan

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💰 Maliyet

### Ücretsiz Trial
- **$5 ücretsiz kredi** (yeni hesaplar)
- 3 ay geçerli
- GPT-3.5 ve GPT-4 kullanabilirsin

### Ücretli Kullanım
- **Pay-as-you-go** (kullandığın kadar öde)
- GPT-3.5-turbo: ~$0.002 / 1K token
- GPT-4: ~$0.03 / 1K token
- Minimum ödeme yok

### Limit Ayarla (Tavsiye)
1. Settings → Billing → Usage limits
2. **Hard limit** ayarla (örn: $10/ay)
3. Kredi kartı ekle (gerekli)

---

## 🧪 Test Et

Key'i test etmek için:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

Cevap:
```json
{
  "choices": [
    {
      "message": {
        "content": "Hello! How can I help you today?"
      }
    }
  ]
}
```

---

## 🔒 Güvenlik

### ✅ Yapılması Gerekenler
- Key'i environment variable olarak sakla
- Coolify'da gizli tut (frontend'de kullanma!)
- Usage limit ayarla
- Key'i GitHub'a commit etme!

### ❌ Yapılmaması Gerekenler
- Key'i frontend kodunda kullanma
- Key'i public repo'ya koyma
- Key'i başkalarıyla paylaşma
- Limit ayarlamadan kullanma

---

## 🚨 Sorun Giderme

### Hata: "Invalid API key"
- Key'i doğru kopyaladın mı?
- `sk-proj-` ile başlıyor mu?
- Başında/sonunda boşluk var mı?

### Hata: "Insufficient quota"
- Ücretsiz kredin bitti mi?
- Kredi kartı ekledin mi?
- Usage limit'e ulaştın mı?

### Hata: "Rate limit exceeded"
- Çok fazla istek atıyorsun
- Biraz bekle (1 dakika)
- Veya plan upgrade et

---

## 💡 Alternatif: Gemini API (Ücretsiz)

Eğer OpenAI pahalı geliyorsa, Google Gemini kullanabilirsin:

1. https://makersuite.google.com/app/apikey
2. **Create API key** tıkla
3. Ücretsiz! (60 request/dakika)

**Coolify'da kullanım:**
```env
# OpenAI yerine Gemini
OPENAI_API_KEY=AIzaSyCKuQ7jJME_0XieCQu5lRiv8gUS48xc6C4
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

---

## 📊 Kullanım Takibi

OpenAI dashboard → Usage:
- Günlük kullanım
- Maliyet
- Token sayısı
- Model bazında breakdown

---

## ✅ Checklist

- [ ] OpenAI hesabı oluşturdum
- [ ] API key oluşturdum
- [ ] Key'i güvenli bir yere kopyaladım
- [ ] Usage limit ayarladım
- [ ] Kredi kartı ekledim (opsiyonel)
- [ ] Coolify'da environment variable olarak ekledim
- [ ] Test ettim (curl veya Postman)

---

## 🎯 Özet

```env
# Coolify'da eklenecek tek satır:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Hazır!** OpenAI key'ini aldıktan sonra deployment'a geçebiliriz! 🚀
