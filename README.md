"# 🧠 AI-ULU

**Hafıza Öncelikli Yapay Zeka Asistanı**

AI-ULU, quantum-inspired heuristic algoritması ile çalışan, sizi gerçekten hatırlayan bir yapay zeka sohbet platformudur.

![AI-ULU Landing](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

---

## ✨ Özellikler

### 🧠 Akıllı Hafıza Sistemi
- **Quantum-Inspired Scoring**: Hafıza seçimi 4 faktörü birleştirir
  ```
  H(x,ψ) = α(1-similarity) + β*decay + γ*importance + δ*frequency
  ```
- **Soft Decay**: Kullanılmayan hafızalar solar ama silinmez
- **Tip Bazlı Önem**: Kimlik > Tercih > Bilgi

### 🔒 Güvenlik & Gizlilik
- **Safe Mode**: Hassas bilgi filtreleme
- **Privacy Mode**: Hafıza yazımını tamamen devre dışı bırak
- **RLS**: Supabase Row Level Security ile veri izolasyonu

### 💬 Gelişmiş Sohbet
- Gerçek zamanlı streaming yanıtlar
- Markdown & kod desteği
- Hafıza göstergesi (memory badge)
- Konuşma paylaşma & dışa aktarma

### 🎨 Modern UI/UX
- Karanlık mod varsayılan
- Türkçe arayüz
- PWA desteği
- Responsive tasarım

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- Supabase hesabı
- OpenAI API key (veya Emergent LLM Key)

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd ai-ulu/frontend
```

### 2. Bağımlılıkları yükleyin
```bash
yarn install
```

### 3. Environment değişkenlerini ayarlayın
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 4. Supabase veritabanını hazırlayın

**Temel kurulum** (sadece chat):
```bash
# Supabase SQL Editor'da çalıştırın:
supabase/minimal-schema.sql
```

**Tam kurulum** (tüm özellikler):
```bash
# Supabase SQL Editor'da çalıştırın:
supabase/schema.sql
```

### 5. Uygulamayı başlatın
```bash
# Development
yarn dev

# Production
yarn build
yarn start
```

---

## 📁 Proje Yapısı

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/          # Ana chat API (streaming)
│   │   ├── conversations/ # Sohbet CRUD
│   │   ├── memories/      # Hafıza yönetimi
│   │   ├── memory-settings/
│   │   └── share/         # Paylaşım linkleri
│   ├── chat/              # Sohbet sayfası
│   ├── settings/          # Ayarlar sayfası
│   ├── login/             # Giriş
│   └── signup/            # Kayıt
├── components/ui/         # shadcn/ui bileşenleri
├── lib/
│   ├── supabase/          # Supabase client
│   ├── models.js          # AI model konfigürasyonu
│   └── utils.js           # Yardımcı fonksiyonlar
└── supabase/
    ├── minimal-schema.sql # Temel tablolar
    └── schema.sql         # Tam şema
```

---

## 🎯 Klavye Kısayolları

| Kısayol | Aksiyon |
|---------|---------|
| `⌘/Ctrl + Enter` | Mesaj gönder |
| `⌘/Ctrl + K` | Yeni sohbet |

---

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Mesaj gönder (streaming)

### Conversations
- `GET /api/conversations` - Sohbetleri listele
- `POST /api/conversations` - Yeni sohbet
- `GET /api/conversations/:id` - Sohbet detayı
- `PUT /api/conversations/:id` - Güncelle
- `DELETE /api/conversations/:id` - Sil

### Memories
- `GET /api/memories` - Hafızaları listele
- `DELETE /api/memories/:id` - Sil
- `GET /api/memories/:id/versions` - Versiyon geçmişi
- `POST /api/memories/:id/versions` - Versiyon geri yükle

### Settings
- `GET /api/memory-settings` - Ayarları al
- `PUT /api/memory-settings` - Ayarları güncelle

---

## 🧪 Test

```bash
# Health check
curl http://localhost:3000/api/health

# Beklenen yanıt:
{\"status\":\"healthy\",\"database\":\"connected\"}
```

---

## 📝 Hafıza Çıkarım Kuralları

Sistem şu kalıpları otomatik hafızaya alır:

| Tip | Türkçe Kalıplar | İngilizce Kalıplar |
|-----|-----------------|-------------------|
| Kimlik | \"benim adım\", \"olarak çalışıyorum\" | \"my name is\", \"I work as\" |
| Tercih | \"severim\", \"tercih ederim\" | \"I like\", \"I prefer\" |
| Bilgi | \"unutma\", \"hatırla\" | \"remember\", \"don't forget\" |

---

## 🛡️ Güvenlik Modları

### Safe Mode
- Hassas bilgileri filtreler
- Sadece okuma izni

### Privacy Mode (Stealth)
- Okuma yok
- Yazma yok
- Rezonans yok

---

## 📄 Lisans

MIT License

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'feat: amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın

---

**AI-ULU** - Sizi gerçekten hatırlayan yapay zeka 🧠
"# Here are your Instructions
