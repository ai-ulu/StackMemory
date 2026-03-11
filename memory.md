# Workspace Memory

## User Preferences
- Kullanici teknik olarak zayif oldugunu, yazilim bilmedigini ve AI ajanlarla birlikte calistigini belirtti.
- Bu workspace'te teknik isi istemeden ilerletmem, uygun sirayla calismam ve kritik risk olmadikca fazla yonlendirme istemem tercih ediliyor.
- Kisa ve net iletisim tercih ediliyor; gereksiz detay ve uzun form doldurma istemiyor.

## Project Facts
- `StackMemory` bu workspace'in ana urunu: AI coding tools ve AI-native workflow'ler icin ortak hafiza katmani.
- GitHub repo adi `StackMemory` olarak guncellendi: `https://github.com/ai-ulu/StackMemory`
- Kullanici tarafinda onemli proje portfoyu: `qa`, `godfather`, `emergent ai-ulu` (StackMemory olarak yeniden adlandirilmak isteniyor), `ulucore`.

## Decisions
- 2026-03-11: Urun developer'lar ve yogun AI kullananlar icin ortak hafiza katmani olarak konumlandi.
- 2026-03-11: Yerel MCP entegrasyonu Codex, VS Code, Kiro ve Antigravity icin kuruldu; MiniMax Agent tarafinda uygulama ici custom MCP ekleme yolu kullaniliyor.
- 2026-03-11: VPS hattindan vazgecildi; ana calisma ortami lokal StackMemory runtime olarak tutuluyor.

## Active Constraints
- Makineye ozel config dosyalari ve `.env` benzeri gizli/yerel ayarlar repoya pushlanmiyor.
- Teknik kararlar kullanicidan ayrintili teknik girdi beklemeden alinmali; ancak kritik risklerde net olarak haber verilmeli.

## Next Steps
- Repo adi ve kalan teknik isimlerin `StackMemory` yonune migration plani ayri bir turda ele alinabilir.
- MCP bagli istemcilerde ortak hafizayi degerli kilmak icin kalici proje kurallari, tercihleri ve karar gecmisi duzenli kaydedilmeli.
