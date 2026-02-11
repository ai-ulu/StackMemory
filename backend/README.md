# Memory System Backend

Gelişmiş bellek yönetim sistemi - H(x,ψ) puanlama, graf görselleştirme, çelişki çözümleme ve A/B testing.

## Genel Bakış

Bu backend, çok katmanlı bir bellek sistemi sağlar:

- **Short-Term Memory**: Geçici, hızlı erişim
- **Episodic Memory**: Uzun süreli, yapılandırılmış
- **Vector Store**: Semantic search için embedding
- **Memory Graph**: Bellekler arası ilişki görselleştirme
- **Conflict Resolver**: Çelişki tespiti ve çözümleme
- **A/B Testing**: Deney yönetimi ve optimizasyon
- **H(x,ψ) Scoring**: Çok boyutlu bellek puanlama

## Kurulum

### Gereksinimler

- Python 3.11+
- pip

### Bağımlılıklar

```bash
pip install -r requirements.txt
```

**Ana Paketler:**
- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `numpy`: Numerik hesaplamalar
- `scipy`: İstatistiksel analiz
- `cryptography`: Şifreleme
- `pytest`: Test framework
- `hypothesis`: Property-based testing

### Çalıştırma

```bash
# Development server
python server.py

# Production
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Hızlı Başlangıç

### 1. Bellek Oluşturma

```python
from lib.memory_orchestrator import MemoryOrchestrator

orchestrator = MemoryOrchestrator()

# Bellek kaydet
memory_id = orchestrator.store_memory({
    'type': 'conversation',
    'content': 'User asked about authentication system',
    'importance': 0.8,
    'tags': ['auth', 'security']
})
```

### 2. Arama

```python
# Semantic search
results = orchestrator.search(
    query='authentication',
    memory_type='conversation',
    limit=10
)

for result in results:
    print(f"{result['id']}: {result['content']}")
    print(f"  H(x,ψ) Score: {result['h_score']['total']:.3f}")
```

### 3. Graf Görselleştirme

```python
from lib.memory_graph import MemoryGraph

graph = MemoryGraph()
graph_data = graph.build_graph(results)

# Cluster detection
clusters = graph.detect_clusters(algorithm='louvain')

print(f"Found {len(clusters)} clusters")
```

### 4. Çelişki Çözümleme

```python
from lib.conflict_resolver import ConflictResolver

resolver = ConflictResolver()

# Çelişkileri tespit et
conflicts = resolver.detect_all_conflicts(
    orchestrator.get_all_memories()
)

# Otomatik çözümle
for conflict in conflicts:
    resolution = resolver.auto_resolve(conflict)
    print(f"Resolved: {resolution.strategy}")
```

### 5. A/B Testing

```python
from lib.ab_testing import ABTestingFramework

ab_test = ABTestingFramework()

# Deney oluştur
experiment = ab_test.create_experiment(
    name='h_score_optimization',
    variants={
        'control': {'alpha': 0.4, 'beta': 0.2, 'gamma': 0.3, 'delta': 0.1},
        'variant_a': {'alpha': 0.5, 'beta': 0.15, 'gamma': 0.25, 'delta': 0.1}
    }
)

# Varyant ata
variant = ab_test.assign_variant(experiment['id'], 'user-123')

# Metrik kaydet
ab_test.record_metric(experiment['id'], variant, 'relevance_score', 0.85)

# Analiz et
analysis = ab_test.analyze_experiment(experiment['id'], 'relevance_score', 'control')
```

## Özellikler

### H(x,ψ) Puanlama Sistemi

Bellekleri çok boyutlu olarak puanlar:

```
H(x,ψ) = α·(1-S(x,q)) + β·D(x) + γ·I(x) + δ·F(x)
```

- **S(x,q)**: Similarity (benzerlik)
- **D(x)**: Decay (zaman azalması)
- **I(x)**: Importance (önem)
- **F(x)**: Frequency (sıklık)

**Düşük puan = Daha alakalı bellek**

[Detaylı Dokümantasyon →](docs/H_SCORE.md)

### Memory Graph

Bellekler arası ilişkileri görselleştirme:

- Düğüm boyutu: H(x,ψ) puanı
- Kenar oluşturma: Benzerlik > 0.7
- Cluster detection: Louvain, Label Propagation, Greedy
- React/D3.js entegrasyonu

[Detaylı Dokümantasyon →](docs/MEMORY_GRAPH.md)

### Conflict Resolver

Çelişki tespiti ve çözümleme:

- **4 Çelişki Türü**: Contradiction, Duplicate, Outdated, Ambiguous
- **4 Çözüm Stratejisi**: Keep1, Keep2, Merge, Ignore
- Otomatik çözüm kuralları
- Güven puanı sistemi

[Detaylı Dokümantasyon →](docs/CONFLICT_RESOLVER.md)

### A/B Testing Framework

Deney yönetimi ve optimizasyon:

- Çoklu varyant desteği
- Consistent hashing ile deterministik atama
- İstatistiksel analiz (t-test)
- Otomatik kazanan deployment

[Detaylı Dokümantasyon →](docs/AB_TESTING.md)

## API Endpoints

### Memory Operations

```http
POST /api/memory/store
GET /api/memory/search?query=auth&type=conversation
GET /api/memory/{id}
PUT /api/memory/{id}
DELETE /api/memory/{id}
```

### Graph Operations

```http
GET /api/memory/graph?type=conversation&limit=100
GET /api/memory/clusters?algorithm=louvain&min_similarity=0.8
```

### Conflict Operations

```http
GET /api/memory/conflicts
POST /api/memory/conflicts/resolve
GET /api/memory/conflicts/history
```

### A/B Testing Operations

```http
POST /api/experiments
GET /api/experiments/{id}
POST /api/experiments/{id}/assign?user_id=user-123
POST /api/experiments/{id}/metrics
GET /api/experiments/{id}/results
POST /api/experiments/{id}/deploy
```

## Dizin Yapısı

```
backend/
├── lib/
│   ├── memory_orchestrator.py    # Ana orchestrator
│   ├── memory_scorer.py           # H(x,ψ) puanlama
│   ├── memory_graph.py            # Graf görselleştirme
│   ├── conflict_resolver.py       # Çelişki çözümleme
│   ├── ab_testing.py              # A/B testing framework
│   ├── short_term_memory.py       # Kısa süreli bellek
│   ├── episodic_memory.py         # Uzun süreli bellek
│   ├── vector_store.py            # Vector storage
│   └── encryption.py              # Şifreleme
├── tests/
│   ├── test_memory_system.py
│   ├── test_memory_scorer.py
│   ├── test_memory_graph.py
│   ├── test_conflict_resolver.py
│   ├── test_integration_*.py
│   └── ...
├── docs/
│   ├── H_SCORE.md                 # H(x,ψ) dokümantasyonu
│   ├── MEMORY_GRAPH.md            # Graf dokümantasyonu
│   ├── CONFLICT_RESOLVER.md       # Çelişki dokümantasyonu
│   └── AB_TESTING.md              # A/B test dokümantasyonu
├── data/                          # Veri depolama
├── server.py                      # FastAPI server
├── requirements.txt               # Python bağımlılıkları
└── README.md                      # Bu dosya
```

## Test

### Tüm Testleri Çalıştır

```bash
pytest
```

### Belirli Test Dosyası

```bash
pytest tests/test_memory_scorer.py
```

### Coverage Raporu

```bash
pytest --cov=lib --cov-report=html
```

### Property-Based Testing

```bash
pytest tests/test_integration_hscore.py -v
```

## Konfigürasyon

### H(x,ψ) Ağırlıkları

```python
from lib.memory_scorer import HScoreWeights

# Varsayılan
weights = HScoreWeights(
    alpha=0.4,  # Similarity
    beta=0.2,   # Decay
    gamma=0.3,  # Importance
    delta=0.1   # Frequency
)

# Özel senaryo
weights = HScoreWeights(
    alpha=0.6,  # Daha fazla similarity
    beta=0.1,
    gamma=0.2,
    delta=0.1
)
```

### Decay Halflife

```python
from lib.memory_scorer import MemoryScorer

# Varsayılan: 30 gün
scorer = MemoryScorer(decay_halflife_days=30)

# Daha hızlı decay: 15 gün
scorer = MemoryScorer(decay_halflife_days=15)

# Daha yavaş decay: 60 gün
scorer = MemoryScorer(decay_halflife_days=60)
```

### Cluster Algoritması

```python
from lib.memory_graph import MemoryGraph

graph = MemoryGraph()

# Louvain (önerilen)
clusters = graph.detect_clusters(algorithm='louvain')

# Label Propagation (hızlı)
clusters = graph.detect_clusters(algorithm='label_propagation')

# Greedy (basit)
clusters = graph.detect_clusters(algorithm='greedy')
```

## Performans

### Benchmark Sonuçları

| İşlem | Süre | Bellek |
|-------|------|--------|
| Store Memory | ~5ms | ~1KB |
| Search (100 memories) | ~50ms | ~10KB |
| H(x,ψ) Calculation | ~1ms | ~100B |
| Graph Build (1000 nodes) | ~500ms | ~5MB |
| Cluster Detection | ~200ms | ~2MB |
| Conflict Detection | ~100ms | ~1MB |

### Optimizasyon İpuçları

1. **Vektör Önbellekleme**: Query vektörlerini cache'le
2. **Batch Processing**: Çok sayıda belleği toplu işle
3. **Early Stopping**: İlk N sonucu bul ve dur
4. **Index Kullanımı**: Büyük veri setleri için index oluştur

## Güvenlik

### Şifreleme

Tüm hassas veriler AES-256-GCM ile şifrelenir:

```python
from lib.encryption import EncryptionManager

encryption = EncryptionManager()

# Şifrele
encrypted = encryption.encrypt_data({'secret': 'value'})

# Şifre çöz
decrypted = encryption.decrypt_data(encrypted)
```

### API Güvenliği

- CORS yapılandırması
- Rate limiting
- Input validation
- SQL injection koruması

## Deployment

### Docker

```bash
# Build
docker build -t memory-system-backend .

# Run
docker run -p 8000:8000 memory-system-backend
```

### Environment Variables

```bash
# .env dosyası
ENCRYPTION_KEY=your-secret-key
DATA_DIR=./data
LOG_LEVEL=INFO
```

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

MIT License

## İletişim

- GitHub: [emergent-ai-ulu](https://github.com/emergent-ai-ulu)
- Email: info@emergent-ai-ulu.com

## Kaynaklar

- [H(x,ψ) Dokümantasyonu](docs/H_SCORE.md)
- [Memory Graph Dokümantasyonu](docs/MEMORY_GRAPH.md)
- [Conflict Resolver Dokümantasyonu](docs/CONFLICT_RESOLVER.md)
- [A/B Testing Dokümantasyonu](docs/AB_TESTING.md)
- [API Referansı](docs/API.md)

## Changelog

### v1.0.0 (2024-01-01)

**Yeni Özellikler:**
- ✨ H(x,ψ) puanlama sistemi
- ✨ Memory Graph görselleştirme
- ✨ Conflict Resolver
- ✨ A/B Testing Framework
- ✨ Cluster detection (Louvain, Label Propagation, Greedy)
- ✨ Property-based testing

**İyileştirmeler:**
- 🚀 Performans optimizasyonları
- 📝 Kapsamlı dokümantasyon
- 🧪 263 test ile %95+ coverage
- 🔒 AES-256-GCM şifreleme

**Düzeltmeler:**
- 🐛 Memory leak düzeltmeleri
- 🐛 Edge case handling
- 🐛 Type safety iyileştirmeleri

## Roadmap

### v1.1.0 (Planlanan)

- [ ] GraphQL API
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Multi-user support
- [ ] Cloud storage integration

### v2.0.0 (Gelecek)

- [ ] Distributed memory system
- [ ] Machine learning integration
- [ ] Auto-scaling
- [ ] Multi-language support
- [ ] Mobile SDK

## Teşekkürler

Bu proje aşağıdaki açık kaynak projelerden ilham almıştır:

- [LangChain](https://github.com/langchain-ai/langchain)
- [Chroma](https://github.com/chroma-core/chroma)
- [NetworkX](https://github.com/networkx/networkx)
- [FastAPI](https://github.com/tiangolo/fastapi)
