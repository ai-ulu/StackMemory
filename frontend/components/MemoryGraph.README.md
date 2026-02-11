# MemoryGraph Component

React-Force-Graph-2D ile oluşturulmuş interactive bellek graf görselleştirme bileşeni.

## Özellikler

### 🎨 Görselleştirme
- **Force-directed layout**: Otomatik düğüm yerleşimi
- **H(x,ψ) puanına göre boyutlandırma**: 5-15px arası dinamik boyut
- **Bellek türüne göre renklendirme**: 7 farklı renk paleti
- **Bağlantı animasyonu**: Directional particles

### 🖱️ Etkileşim
- **Zoom**: Mouse wheel ile yakınlaştır/uzaklaştır
- **Pan**: Sürükle ile hareket ettir
- **Drag**: Düğümleri sürükle
- **Hover**: Tooltip ile detaylar
- **Click**: Düğüm seçimi

### 🎛️ Kontroller
- **Zoom In/Out**: Yakınlaştır/Uzaklaştır butonları
- **Zoom to Fit**: Tüm grafı göster
- **Export**: JSON olarak indir

### 📊 Bilgi Panelleri
- **Legend**: Bellek türleri ve renkleri
- **Tooltip**: Hover ile anlık bilgi
- **Detail Panel**: Seçili düğüm detayları
- **Statistics**: Toplam sayılar ve ortalamalar

## Kullanım

### Temel Kullanım

\`\`\`tsx
import MemoryGraph, { MemoryData } from '@/components/MemoryGraph';

const memories: MemoryData[] = [
  {
    id: 'mem-1',
    type: 'CONVERSATION',
    content: { text: 'Konuşma içeriği' },
    metadata: {
      timestamp: Date.now(),
      tags: ['chat', 'user'],
      score: 0.85
    },
    connections: ['mem-2']
  }
];

function MyPage() {
  return (
    <MemoryGraph
      memories={memories}
      onNodeClick={(node) => console.log(node)}
      width={800}
      height={600}
    />
  );
}
\`\`\`

### Props

| Prop | Tür | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| `memories` | `MemoryData[]` | **required** | Bellek verileri |
| `onNodeClick` | `(node: GraphNode) => void` | `undefined` | Düğüm tıklama handler |
| `width` | `number` | `800` | Graf genişliği (px) |
| `height` | `number` | `600` | Graf yüksekliği (px) |

### Types

\`\`\`typescript
interface MemoryData {
  id: string;
  type: string;
  content: any;
  metadata: {
    timestamp: number;
    tags?: string[];
    score?: number;
    [key: string]: any;
  };
  connections?: string[];
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  score: number;
  color: string;
  size: number;
  metadata: any;
}
\`\`\`

## Bellek Türleri

| Tür | Renk | Açıklama |
|-----|------|----------|
| `CONVERSATION` | 🔵 Mavi | Konuşma kayıtları |
| `KNOWLEDGE` | 🟢 Yeşil | Bilgi tabanı |
| `COMMAND` | 🟡 Amber | Komut geçmişi |
| `PREFERENCE` | 🟣 Mor | Kullanıcı tercihleri |
| `FEEDBACK` | 🔴 Pembe | Geri bildirimler |
| `PATTERN` | 🔷 Cyan | Tespit edilen desenler |
| `SOLUTION` | 🟦 Teal | Çözüm kayıtları |

## API Endpoint

### GET /api/memory/graph

Bellek verilerini ve ilişkilerini döndürür.

**Response:**
\`\`\`json
{
  "success": true,
  "memories": [...],
  "count": 30,
  "timestamp": 1739235754000
}
\`\`\`

## Örnek Sayfa

\`/memory-graph\` sayfasında tam özellikli örnek:

- Graf görselleştirme
- Detay paneli
- İstatistik kartları
- Demo data fallback

## Teknik Detaylar

### Dynamic Import

SSR hatalarını önlemek için ForceGraph2D dinamik import edilir:

\`\`\`tsx
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});
\`\`\`

### Custom Node Rendering

\`\`\`tsx
nodeCanvasObject={(node, ctx, globalScale) => {
  // Custom circle + label rendering
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillText(node.name, node.x, node.y);
}}
\`\`\`

### Tooltip Positioning

\`\`\`tsx
<div
  style={{
    left: tooltipPos.x + 10,
    top: tooltipPos.y + 10,
    pointerEvents: 'none', // Mouse event'leri engelleme
  }}
>
  {/* Tooltip content */}
</div>
\`\`\`

## Performance

- **Cooldown ticks**: 100 (hızlı stabilizasyon)
- **Auto zoom-to-fit**: Engine stop'ta otomatik
- **Particle animation**: 2 particle per link
- **Responsive**: Container'a göre boyutlandırma

## Gelecek Geliştirmeler

- [ ] Real-time WebSocket güncellemeleri
- [ ] Graf filtreleme (tür, tarih, puan)
- [ ] 3D görselleştirme (react-force-graph-3d)
- [ ] Graf analiz metrikleri (centrality, clustering)
- [ ] Snapshot kaydetme/yükleme
- [ ] Bellek birleştirme/silme UI
- [ ] Timeline view (zaman bazlı)
- [ ] Search/highlight nodes

## Dependencies

- `react-force-graph-2d@1.29.0`
- `next@14.2.18`
- `lucide-react@0.507.0`
- `tailwindcss@3.4.17`

## License

MIT
