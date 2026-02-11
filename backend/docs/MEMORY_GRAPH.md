# Memory Graph - Bellek Grafiği Sistemi

## Genel Bakış

Memory Graph, bellekler arası ilişkileri görselleştiren ve yöneten bir sistemdir. H(x,ψ) puanlama sistemi ile entegre çalışarak bellekleri graf yapısında organize eder.

## Temel Özellikler

- **Düğüm Boyutlandırma**: H(x,ψ) puanına göre otomatik boyutlandırma
- **Kenar Oluşturma**: Benzerlik > 0.7 olan bellekler arası bağlantı
- **Renklendirme**: Bellek türüne göre otomatik renk atama
- **Cluster Detection**: 3 farklı algoritma ile küme tespiti
- **JSON Export**: React/D3.js entegrasyonu için hazır format

## API Referansı

### MemoryGraph Sınıfı

```python
from lib.memory_graph import MemoryGraph

# Graf oluştur
graph = MemoryGraph()
```

### Düğüm Ekleme

```python
# Bellek için düğüm ekle
memory = {
    'id': 'mem-123',
    'type': 'conversation',
    'content': 'Kullanıcı auth sistemi hakkında sordu',
    'h_score': {
        'total': 0.75,
        'similarity': 0.8,
        'decay': 0.2,
        'importance': 0.9,
        'frequency': 0.5
    },
    'access_count': 5,
    'importance': 0.9,
    'timestamp': 1704067200000
}

node = graph.add_node(memory)
# → GraphNode(id='mem-123', name='Kullanıcı auth sistemi...', val=75.0, color='#3b82f6')
```

**Düğüm Özellikleri:**
- `id`: Bellek ID
- `name`: Görünen isim (content'ten alınır, max 30 karakter)
- `type`: Bellek türü (conversation, workspace, preference, vb.)
- `val`: Düğüm boyutu (H(x,ψ) × 100)
- `color`: Renk (tür bazlı)
- `metadata`: Ek bilgiler (h_score, access_count, vb.)

### Kenar Ekleme

```python
# İki düğüm arası kenar ekle
edge = graph.add_edge(
    source='mem-123',
    target='mem-456',
    similarity=0.85,
    edge_type='semantic'
)

# similarity <= 0.7 ise None döner
if edge:
    print(f"Kenar oluşturuldu: {edge.value}")
```

**Kenar Türleri:**
- `semantic`: Anlamsal benzerlik
- `temporal`: Zamansal yakınlık
- `contextual`: Bağlamsal ilişki

### Graf Oluşturma

```python
# Belleklerden otomatik graf oluştur
memories = [
    {'id': 'mem-1', 'type': 'conversation', 'content': 'Auth sistemi', ...},
    {'id': 'mem-2', 'type': 'workspace', 'content': 'Login sayfası', ...},
    {'id': 'mem-3', 'type': 'conversation', 'content': 'Şifre sıfırlama', ...}
]

graph_data = graph.build_graph(memories)
```

**Çıktı Formatı:**
```json
{
  "nodes": [
    {
      "id": "mem-1",
      "name": "Auth sistemi",
      "type": "conversation",
      "val": 75.0,
      "color": "#3b82f6",
      "metadata": {...}
    }
  ],
  "links": [
    {
      "source": "mem-1",
      "target": "mem-3",
      "value": 0.85,
      "type": "semantic"
    }
  ],
  "metadata": {
    "total_nodes": 3,
    "total_edges": 1,
    "avg_degree": 0.67,
    "clusters": 1
  }
}
```

## Cluster Detection (Küme Tespiti)

### Algoritmalar

#### 1. Louvain (Önerilen)

Modülerlik optimizasyonu ile küme tespiti. En iyi sonuçları verir.

```python
clusters = graph.detect_clusters(
    min_similarity=0.8,
    algorithm='louvain'
)

for cluster in clusters:
    print(f"Cluster {cluster.id}:")
    print(f"  Nodes: {len(cluster.nodes)}")
    print(f"  Centroid: {cluster.centroid}")
    print(f"  Avg Similarity: {cluster.avg_similarity:.2f}")
    print(f"  Topic: {cluster.topic}")
```

**Özellikler:**
- Modülerlik optimizasyonu
- Hiyerarşik kümeleme
- Orta hızda (10 iterasyon)

#### 2. Label Propagation (Hızlı)

Komşuların çoğunluk etiketini alma prensibi.

```python
clusters = graph.detect_clusters(
    min_similarity=0.8,
    algorithm='label_propagation'
)
```

**Özellikler:**
- Çok hızlı
- Basit algoritma
- Rastgele başlangıç

#### 3. Greedy (Basit)

Basit greedy clustering.

```python
clusters = graph.detect_clusters(
    min_similarity=0.8,
    algorithm='greedy'
)
```

**Özellikler:**
- En basit
- Deterministik
- Hızlı

### Cluster Yapısı

```python
@dataclass
class Cluster:
    id: str                    # Cluster ID
    nodes: List[str]           # Düğüm ID'leri
    centroid: str              # Merkez düğüm (en yüksek H(x,ψ))
    avg_similarity: float      # Ortalama benzerlik
    topic: Optional[str]       # Konu (centroid'in türü)
```

## Benzerlik Hesaplama

Graf otomatik olarak bellekler arası benzerlik hesaplar:

```python
similarity = graph._calculate_similarity(mem1, mem2)
```

**Faktörler:**

1. **İçerik Benzerliği (50%)**: Jaccard similarity (kelime bazlı)
2. **Tür Benzerliği (30%)**: Aynı tür = 1.0, farklı = 0.3
3. **Zaman Yakınlığı (20%)**: Exponential decay (30 günlük yarı ömür)

**Formül:**
```
similarity = 0.5 × content_sim + 0.3 × type_sim + 0.2 × time_sim
```

## Renk Haritası

Bellek türlerine göre otomatik renk atama:

| Tür | Renk | Hex |
|-----|------|-----|
| conversation | Mavi | #3b82f6 |
| workspace | Yeşil | #10b981 |
| preference | Amber | #f59e0b |
| command | Mor | #8b5cf6 |
| profile | Pembe | #ec4899 |
| knowledge | Cyan | #06b6d4 |
| unknown | Gri | #6b7280 |

## React Entegrasyonu

### Force Graph Component

```typescript
import ForceGraph2D from 'react-force-graph-2d';

function MemoryGraphVisualization({ graphData }) {
  return (
    <ForceGraph2D
      graphData={graphData}
      nodeLabel="name"
      nodeVal="val"
      nodeColor="color"
      linkWidth={link => link.value * 5}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.005}
    />
  );
}
```

### D3.js Entegrasyonu

```javascript
import * as d3 from 'd3';

// Graf verisi al
const graphData = await fetch('/api/memory/graph').then(r => r.json());

// D3 force simulation
const simulation = d3.forceSimulation(graphData.nodes)
  .force('link', d3.forceLink(graphData.links).id(d => d.id))
  .force('charge', d3.forceManyBody().strength(-100))
  .force('center', d3.forceCenter(width / 2, height / 2));
```

## Kullanım Örnekleri

### Örnek 1: Konuşma Grafiği

```python
from lib.memory_graph import MemoryGraph
from lib.memory_orchestrator import MemoryOrchestrator

# Orchestrator'dan bellekleri al
orchestrator = MemoryOrchestrator()
memories = orchestrator.search(
    query="auth sistemi",
    memory_type="conversation",
    limit=50
)

# Graf oluştur
graph = MemoryGraph()
graph_data = graph.build_graph(memories)

# Cluster tespiti
clusters = graph.detect_clusters(algorithm='louvain')

print(f"Toplam {len(clusters)} küme bulundu")
for cluster in clusters:
    print(f"\nCluster: {cluster.topic}")
    print(f"  Bellekler: {len(cluster.nodes)}")
    print(f"  Benzerlik: {cluster.avg_similarity:.2f}")
```

### Örnek 2: Workspace İlişkileri

```python
# Workspace belleklerini al
workspace_memories = orchestrator.search(
    memory_type="workspace",
    limit=100
)

# Graf oluştur
graph = MemoryGraph()
graph.build_graph(workspace_memories)

# Yüksek benzerlikli kenarları bul
strong_connections = [
    edge for edge in graph.edges
    if edge.value > 0.9
]

print(f"{len(strong_connections)} güçlü bağlantı bulundu")
```

### Örnek 3: Zaman Bazlı Analiz

```python
# Son 30 günün bellekleri
import time
thirty_days_ago = time.time() - (30 * 24 * 3600)

recent_memories = [
    m for m in orchestrator.get_all_memories()
    if m.get('timestamp', 0) > thirty_days_ago
]

# Graf oluştur
graph = MemoryGraph()
graph.build_graph(recent_memories)

# Temporal kenarları analiz et
temporal_edges = [
    edge for edge in graph.edges
    if edge.type == 'temporal'
]

print(f"Zamansal bağlantılar: {len(temporal_edges)}")
```

## Performans Optimizasyonu

### Büyük Graflar İçin

```python
# Sadece önemli bellekleri al
important_memories = [
    m for m in memories
    if m.get('importance', 0) > 0.7
]

# Graf oluştur
graph = MemoryGraph()
graph.build_graph(important_memories)

# Hızlı algoritma kullan
clusters = graph.detect_clusters(algorithm='label_propagation')
```

### Kenar Filtreleme

```python
# Yüksek threshold ile daha az kenar
graph = MemoryGraph()
for memory in memories:
    graph.add_node(memory)

# Sadece çok benzer bellekleri bağla
for i, mem1 in enumerate(memories):
    for mem2 in memories[i+1:]:
        similarity = graph._calculate_similarity(mem1, mem2)
        if similarity >= 0.85:  # Yüksek threshold
            graph.add_edge(mem1['id'], mem2['id'], similarity)
```

## Test Örnekleri

```python
# Test: Graf oluşturma
def test_build_graph():
    graph = MemoryGraph()
    memories = [
        {'id': '1', 'type': 'conversation', 'content': 'test', 'h_score': {'total': 0.8}},
        {'id': '2', 'type': 'conversation', 'content': 'test data', 'h_score': {'total': 0.7}}
    ]
    
    graph_data = graph.build_graph(memories)
    
    assert len(graph_data['nodes']) == 2
    assert graph_data['metadata']['total_nodes'] == 2

# Test: Cluster detection
def test_cluster_detection():
    graph = MemoryGraph()
    # ... düğüm ve kenar ekle
    
    clusters = graph.detect_clusters(algorithm='louvain')
    
    assert len(clusters) > 0
    assert all(len(c.nodes) > 1 for c in clusters)
```

## İleri Seviye Kullanım

### Custom Benzerlik Fonksiyonu

```python
class CustomMemoryGraph(MemoryGraph):
    def _calculate_similarity(self, mem1, mem2):
        # Özel benzerlik hesaplama
        # Örnek: Sadece başlık benzerliği
        title1 = mem1.get('title', '').lower()
        title2 = mem2.get('title', '').lower()
        
        if not title1 or not title2:
            return 0.0
        
        # Levenshtein distance
        from difflib import SequenceMatcher
        return SequenceMatcher(None, title1, title2).ratio()
```

### Dinamik Renklendirme

```python
# H(x,ψ) puanına göre renk gradyanı
def score_to_color(score):
    # 0.0 = kırmızı, 0.5 = sarı, 1.0 = yeşil
    if score < 0.5:
        r = 255
        g = int(255 * (score / 0.5))
    else:
        r = int(255 * (1 - (score - 0.5) / 0.5))
        g = 255
    return f"#{r:02x}{g:02x}00"

# Graf oluştururken uygula
for node in graph.nodes.values():
    h_score = node.metadata['h_score']['total']
    node.color = score_to_color(h_score)
```

## Sorun Giderme

### Kenar Oluşmuyor

**Sebep**: Benzerlik threshold'u çok yüksek (0.7)

**Çözüm**: Benzerlik hesaplama fonksiyonunu kontrol et veya threshold'u düşür

```python
# Düşük threshold ile test et
edge = graph.add_edge('mem-1', 'mem-2', similarity=0.65)
# → None (threshold 0.7)
```

### Cluster Bulunamıyor

**Sebep**: Bellekler arası yeterli bağlantı yok

**Çözüm**: min_similarity'yi düşür

```python
clusters = graph.detect_clusters(min_similarity=0.7)  # 0.8 yerine
```

### Performans Sorunu

**Sebep**: Çok fazla bellek (N² karmaşıklık)

**Çözüm**: Bellekleri filtrele veya batch processing kullan

```python
# Sadece son 100 bellek
recent_memories = sorted(
    memories,
    key=lambda m: m.get('timestamp', 0),
    reverse=True
)[:100]

graph.build_graph(recent_memories)
```

## Kaynaklar

- [Force Graph Dokümantasyonu](https://github.com/vasturiano/react-force-graph)
- [D3.js Force Layout](https://d3js.org/d3-force)
- [Louvain Algorithm](https://en.wikipedia.org/wiki/Louvain_method)
- [Label Propagation](https://en.wikipedia.org/wiki/Label_propagation_algorithm)
