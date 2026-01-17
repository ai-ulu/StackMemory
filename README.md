# 🧠 AI-ULU

**Kişisel AI İşletim Sistemi - Evrensel Hafıza Platformu**

AI-ULU, yapay zekanın "unutma" sorununu çözen, patentlenebilir H(x,ψ,E) algoritması ile çalışan, sizi gerçekten hatırlayan bir AI platformudur.

![Version](https://img.shields.io/badge/Version-2.3-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![MCP](https://img.shields.io/badge/MCP-Compatible-orange)

---

## 🌟 Neden AI-ULU?

| Özellik | Rakipler (ChatGPT, Claude) | AI-ULU |
|---------|---------------------------|--------|
| **Hafıza Kalitesi** | Basit vektör arama | H(x,ψ,E) algoritması |
| **Gizlilik** | Sunucuda saklanır | Zero-Knowledge prensibi |
| **Ölçeklenebilirlik** | Sunucu maliyeti | Client-side compute |
| **Entegrasyon** | Sadece kendi uygulaması | MCP ile her yerde |

---

## ✨ Özellikler

### 🧠 Akıllı Hafıza Sistemi (v2.1)

```
H(x,ψ,E) = α·S + β·D + γ·I + δ·F + ε·E

S = Similarity (Benzerlik)      α = 0.35
D = Decay (Zaman Solması)       β = 0.15
I = Importance (Önem)           γ = 0.25
F = Frequency (Kullanım)        δ = 0.10
E = Emotional (Duygusal)        ε = 0.15
```

- **Emotional Resonance**: Ruh halinize göre hafıza önceliklendirme (happy, stressed, focused, curious, nostalgic)
- **Soft Decay**: Kullanılmayan hafızalar solar ama silinmez
- **Tip Bazlı Önem**: Kimlik (1.0) > Tercih (0.7) > Bilgi (0.4)

### 🔐 Zero-Knowledge Güvenlik

- **Client-Side Encryption**: AES-256-GCM şifreleme
- **Local-First Storage**: Hassas veriler cihazda kalır
- **Sync Engine**: PostgreSQL ↔ SQLite senkronizasyonu

### 🌐 MCP Server (Model Context Protocol)

Claude Desktop, Cursor, Windsurf ve tüm MCP-uyumlu AI'larla entegrasyon:

```json
{
  "mcpServers": {
    "ai-ulu": {
      "command": "npx",
      "args": ["@ai-ulu/mcp-server"],
      "env": {
        "AI_ULU_API_URL": "https://your-instance.com",
        "AI_ULU_API_KEY": "your-key"
      }
    }
  }
}
```

**MCP Tools:** search, store, update, delete, query, list, graph  
**MCP Resources:** memories://all, identity, preferences, facts, graph  
**MCP Prompts:** remember_context, memory_aware_response, summarize_memories

### 🌐 Chrome Extension

- Tek tıkla web'den hafızaya kaydet
- Sağ tık menüsü ve klavye kısayolu (`Ctrl+Shift+M`)
- Floating capture button
- Auto-classification (identity/preference/fact)

### 📊 Analytics Dashboard

- Memory health score (A+ to F)
- Kullanım istatistikleri ve grafikler
- Günlük aktivite takibi
- Source distribution (chat, extension, MCP)

### 👥 Team Memories

- Kurumsal hafıza paylaşımı
- Admin/member/viewer roller
- Team invitations with tokens
- Shared team memories

### 🛒 Memory Marketplace

- Hazır hafıza paketleri
- 8 kategori: productivity, development, language, business, health, finance, creative, education
- Rating ve download sistemi

### 🎤 Voice Memory

- Türkçe/İngilizce ses tanıma
- Voice commands: "Kaydet:", "Ara:", "Hatırla:"
- Text-to-Speech playback

### 📋 Memory Templates

7 hazır şablon:
- 💼 Profesyonel Profil
- ❤️ Kişisel Tercihler
- 💻 Yazılımcı Profili
- 📚 Öğrenme Hedefleri
- 🏥 Sağlık Bilgileri
- 💬 İletişim Tercihleri
- 🚀 Proje Bağlamı

### ⏰ Smart Reminders

- Time reference detection
- Pattern-based suggestions
- Memory review reminders
- Low confidence alerts

### 📈 Memory Insights

- Memory health scoring algorithm
- Usage pattern detection
- Topic extraction
- Personalized improvement tips

### 🌍 Çoklu Dil Desteği

- 🇹🇷 Türkçe, 🇺🇸 English, 🇩🇪 Deutsch
- 🇫🇷 Français, 🇪🇸 Español, 🇸🇦 العربية (RTL)

### 🔗 Webhooks

- Event hooks: memory.created, memory.updated, memory.deleted, conflict.detected
- HMAC signature verification
- Failure tracking

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- Supabase hesabı
- API Key (LiteLLM, OpenRouter veya EmergentMethods)

### 1. Projeyi klonlayın
```bash
git clone https://github.com/agiulucom42-del/emergent-ai-ulu.com.git
cd emergent-ai-ulu.com/frontend
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Environment değişkenlerini ayarlayın
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (birini seçin)
# Option 1: LiteLLM (Önerilen)
LITELLM_API_URL=https://your-litellm-instance.com
LITELLM_API_KEY=your_key

# Option 2: OpenRouter
OPENROUTER_API_KEY=your_key

# Option 3: EmergentMethods (Varsayılan)
OPENAI_API_KEY=your_emergent_key
OPENAI_BASE_URL=https://api.emergentmethods.ai/v1
```

### 4. Uygulamayı başlatın
```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Production server
```

---

## 📁 Proje Yapısı

```
ai-ulu/
├── chrome-extension/          # 🌐 Browser Extension
│   ├── manifest.json
│   ├── popup/                 # Popup UI
│   ├── content/               # Content script
│   └── background/            # Service worker
│
├── mcp-server/                # 🔌 MCP Server
│   ├── src/index.ts           # Main implementation
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── analytics/         # 📊 Dashboard
│   │   ├── chat/              # 💬 Ana sohbet
│   │   ├── settings/          # ⚙️ Ayarlar
│   │   └── api/
│   │       ├── chat/          # Streaming chat
│   │       ├── memories/      # CRUD + search + query + graph + conflicts
│   │       ├── teams/         # Team management
│   │       ├── marketplace/   # Memory packages
│   │       ├── webhooks/      # Event hooks
│   │       └── extension/     # Chrome ext API
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   └── memory/            # MemoryGraph, ConflictDialog
│   │
│   └── lib/
│       ├── memory/            # Core memory system
│       │   ├── local-store.ts
│       │   ├── sync-engine.ts
│       │   ├── encryption.ts
│       │   └── client-embedding.ts
│       ├── ab-testing.js      # A/B test framework
│       ├── voice-memory.js    # Speech recognition
│       ├── memory-templates.js
│       ├── smart-reminders.js
│       ├── memory-insights.js
│       ├── i18n.js            # Multi-language
│       └── models.js          # AI provider config
│
└── backend/                   # Python backend (opsiyonel)
```

---

## 🔧 API Endpoints

### Core APIs
| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/chat` | POST | Streaming chat with memory |
| `/api/memories` | GET/POST | Hafıza CRUD |
| `/api/memories/search` | GET | Semantic search with H(x,ψ) |
| `/api/memories/query` | POST | Natural language query |
| `/api/memories/graph` | GET | Memory relationship graph |
| `/api/memories/conflicts` | GET/POST | Conflict resolution |

### Team APIs
| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/teams` | GET/POST/DELETE | Team CRUD |
| `/api/teams/:id/members` | GET/POST/PATCH/DELETE | Member management |
| `/api/teams/:id/memories` | GET/POST/DELETE | Team memories |

### Integration APIs
| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/webhooks` | GET/POST/PATCH/DELETE | Event webhooks |
| `/api/extension/capture` | GET/POST | Chrome extension |
| `/api/marketplace` | GET/POST | Memory packages |

---

## ⌨️ Klavye Kısayolları

| Kısayol | Aksiyon |
|---------|---------|
| `⌘/Ctrl + Enter` | Mesaj gönder |
| `⌘/Ctrl + Shift + M` | Seçili metni kaydet (Extension) |

---

## 🔌 API Provider Desteği

| Provider | Env Variable | Modeller |
|----------|--------------|----------|
| **LiteLLM** | `LITELLM_API_URL` | Tüm modeller (önerilen) |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ model |
| **EmergentMethods** | `OPENAI_API_KEY` | GPT-4o, Claude, Gemini |
| **Custom** | `CUSTOM_MODEL_ENDPOINT` | Ollama, vLLM, etc. |

---

## 📊 A/B Testing

Aktif deneyler:
| Experiment | Traffic | Açıklama |
|------------|---------|----------|
| `identity-boost` | 20% | Kimlik hafızaları öncelikli |
| `emotional-heavy` | 10% | Duygusal rezonans artırılmış |
| `recency-boost` | 10% | Güncel hafızalar öncelikli |
| `control` | 60% | Varsayılan ağırlıklar |

---

## 🛡️ Güvenlik Modları

| Mod | Okuma | Yazma | Açıklama |
|-----|-------|-------|----------|
| **Normal** | ✅ | ✅ | Tam fonksiyon |
| **Safe** | ✅ | ❌ | Sadece okuma |
| **Privacy** | ❌ | ❌ | Tam gizlilik |
| **Zero-Knowledge** | ✅ | ✅ | Şifreli yerel depolama |

---

## 🧪 Test

```bash
# Health check
curl http://localhost:3000/api/health

# Memory search
curl "http://localhost:3000/api/memories/search?q=python" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Natural language query
curl -X POST http://localhost:3000/api/memories/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Mesleğim ne?"}'

# Capture from extension
curl -X POST http://localhost:3000/api/extension/capture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Important info", "url": "https://example.com"}'
```

---

## 🚀 Deployment

### Vercel
```bash
vercel --prod
```

### Docker
```bash
docker build -t ai-ulu .
docker run -p 3000:3000 ai-ulu
```

### Chrome Extension
1. `chrome://extensions` açın
2. "Geliştirici modu" aktif edin
3. "Paketlenmemiş öğe yükle" → `chrome-extension/` klasörünü seçin

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

## 🔗 Linkler

- **GitHub**: https://github.com/agiulucom42-del/emergent-ai-ulu.com
- **MCP Server**: `mcp-server/` klasörü
- **Chrome Extension**: `chrome-extension/` klasörü

---

<p align="center">
  <strong>🧠 AI-ULU</strong> - Yapay Zekanın Yeni İşletim Sistemi
  <br><br>
  <em>Sizi gerçekten hatırlayan, her yerde yanınızda olan AI</em>
  <br><br>
  🦄 <strong>Unicorn Potansiyeli: DOĞRULANDI</strong> 🦄
</p>
