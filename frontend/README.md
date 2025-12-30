# AI-ULU - Kalıcı Hafızalı AI Chat Platformu

AI-ULU, geçmiş konuşmalarınızı semantik olarak hatırlayan ve bağlamı hiç kaybetmeyen bir yapay zeka chat platformudur.

## 🚀 Özellikler

- **🧠 Kalıcı Hafıza**: pgvector ile semantik benzerlik araması
- **🔄 Çoklu Model**: GPT-4o, Claude Sonnet, Gemini arasında geçiş
- **💬 Akıllı Sohbet**: Streaming yanıtlar ve markdown desteği
- **🌙 Koyu/Açık Tema**: Otomatik tema desteği
- **🔐 Güvenli Auth**: Supabase Auth ile email doğrulama

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL + pgvector
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o, Emergent LLM API

## 📝 Kurulum

### 1. Supabase Projesi Oluşturun

1. [supabase.com](https://supabase.com) adresinden yeni proje oluşturun
2. Project Settings > API bölümünden:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### 2. Database Schema

`supabase/schema.sql` dosyasını Supabase SQL Editor'da çalıştırın.

### 3. Environment Variables

`.env.local` dosyasını düzenleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API
OPENAI_API_KEY=your-openai-or-emergent-key
OPENAI_BASE_URL=https://api.emergentmethods.ai/v1  # veya https://api.openai.com/v1

# Opsiyonel: Custom Model Endpoint
# CUSTOM_MODEL_ENDPOINT=https://your-server.com/v1/chat/completions
# CUSTOM_MODEL_API_KEY=your-key
```

### 4. Bağımlılıkları Yükleyin

```bash
yarn install
```

### 5. Geliştirme Sunucusu

```bash
yarn dev
```

## 📁 Proje Yapısı

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/route.js         # Chat API + streaming
│   │   ├── conversations/        # CRUD işlemleri
│   │   ├── embed/route.js        # Embedding API
│   │   └── health/route.js       # Health check
│   ├── chat/page.js              # Ana chat arayüzü
│   ├── login/page.js             # Giriş sayfası
│   ├── signup/page.js            # Kayıt sayfası
│   ├── settings/page.js          # Ayarlar sayfası
│   ├── layout.js                 # Root layout
│   └── page.js                   # Landing page
├── components/ui/                # shadcn/ui bileşenleri
├── lib/
│   ├── supabase/                 # Supabase client'lar
│   ├── models.js                 # Model konfigürasyonu
│   └── utils.js                  # Yardımcı fonksiyonlar
└── supabase/
    └── schema.sql                # Database schema
```

## 🧠 Hafıza Sistemi Nasıl Çalışır?

1. **Mesaj Gönderilir**: Kullanıcı yeni mesaj gönderir
2. **Embedding Oluşturulur**: text-embedding-3-small ile vektör oluşturulur
3. **Benzer Mesajlar Bulunur**: pgvector ile semantik arama yapılır
4. **Context Oluşturulur**: En benzer 3 mesaj + son 15 mesaj
5. **AI Yanıt Verir**: Tüm bağlam ile yanıt üretilir

## 🚀 Deployment

### Vercel

```bash
vercel --prod
```

Environment variables'ları Vercel dashboard'dan ekleyin.

## 📄 Lisans

MIT License

## 💜 Katkıda Bulunun

Pull request'ler ve öneriler memnuniyetle karşılanır!