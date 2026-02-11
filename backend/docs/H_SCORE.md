# H(x,ψ) Puanlama Algoritması

## Genel Bakış

H(x,ψ) (H-Score), bellekleri çok boyutlu olarak puanlayan gelişmiş bir algoritmadır. Benzerlik, zaman azalması, önem ve sıklık faktörlerini birleştirerek her belleğe bir puan atar.

**Düşük puan = Daha alakalı bellek**

## Formül

```
H(x,ψ) = α·(1-S(x,q)) + β·D(x) + γ·I(x) + δ·F(x)
```

### Bileşenler

| Sembol | Bileşen | Açıklama | Aralık |
|--------|---------|----------|--------|
| α | Alpha | Benzerlik ağırlığı | 0-1 |
| β | Beta | Zaman azalması ağırlığı | 0-1 |
| γ | Gamma | Önem ağırlığı | 0-1 |
| δ | Delta | Sıklık ağırlığı | 0-1 |
| S(x,q) | Similarity | Sorgu benzerliği | 0-1 |
| D(x) | Decay | Zaman azalması | 0-1 |
| I(x) | Importance | Bellek önemi | 0-1 |
| F(x) | Frequency | Erişim sıklığı | 0-1 |

**Kısıt**: α + β + γ + δ = 1.0 (normalize edilmiş)

## API Referansı

### MemoryScorer Sınıfı

```python
from lib.memory_scorer import MemoryScorer, HScoreWeights

# Varsayılan ağırlıklarla scorer oluştur
scorer = MemoryScorer()

# Özel ağırlıklarla
weights = HScoreWeights(
    alpha=0.5,  # Benzerlik
    beta=0.15,  # Zaman azalması
    gamma=0.25, # Önem
    delta=0.1   # Sıklık
)
scorer = MemoryScorer(weights=weights)
```

### Puan Hesaplama

```python
# Bellek için H(x,ψ) hesapla
memory = {
    'id': 'mem-123',
    'type': 'conversation',
    'text': 'User asked about authentication system',
    'vector': [0.1, 0.2, ...],  # Embedding vector (opsiyonel)
    'importance': 0.8,
    'access_count': 5,
    'last_accessed': 1704067200000,
    'timestamp': 1703980800000
}

query = 'auth system'
query_vector = [0.15, 0.18, ...]  # Opsiyonel

h_score = scorer.calculate_score(
    memory=memory,
    query=query,
    query_vector=query_vector,
    context={'current_time': time.time()}
)

print(f"Total Score: {h_score.total:.3f}")
print(f"  Similarity: {h_score.similarity:.3f}")
print(f"  Decay: {h_score.decay:.3f}")
print(f"  Importance: {h_score.importance:.3f}")
print(f"  Frequency: {h_score.frequency:.3f}")
```

### Bellekleri Sıralama

```python
# Bellekleri H(x,ψ) puanına göre sırala
memories = [
    {'id': 'mem-1', 'text': 'auth system', ...},
    {'id': 'mem-2', 'text': 'database query', ...},
    {'id': 'mem-3', 'text': 'user authentication', ...}
]

ranked = scorer.rank_memories(
    memories=memories,
    query='authentication',
    query_vector=None,
    context={'current_time': time.time()}
)

# En alakalı bellekler başta (düşük puan)
for item in ranked[:5]:
    memory = item['memory']
    score = item['total_score']
    print(f"{memory['id']}: {score:.3f}")
```

## Bileşen Detayları

### 1. Similarity - S(x,q)

Sorgu ile bellek arası benzerlik.

**Hesaplama Yöntemleri:**

#### Cosine Similarity (Vektör Varsa)

```python
def cosine_similarity(vec1, vec2):
    """
    Cosine similarity hesapla
    
    Returns: 0-1 arası (normalize edilmiş)
    """
    # Normalize
    v1 = vec1 / ||vec1||
    v2 = vec2 / ||vec2||
    
    # Dot product
    similarity = v1 · v2
    
    # -1,1 aralığından 0,1'e normalize et
    return (similarity + 1) / 2
```

**Örnek:**
```python
query_vector = [0.5, 0.3, 0.2]
memory_vector = [0.6, 0.25, 0.15]

similarity = cosine_similarity(query_vector, memory_vector)
# → 0.95 (çok benzer)
```

#### Jaccard Similarity (Vektör Yoksa)

```python
def jaccard_similarity(text1, text2):
    """
    Kelime bazlı Jaccard similarity
    
    Returns: 0-1 arası
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    intersection = len(words1 & words2)
    union = len(words1 | words2)
    
    return intersection / union if union > 0 else 0.0
```

**Örnek:**
```python
query = "authentication system"
memory_text = "user authentication and authorization system"

similarity = jaccard_similarity(query, memory_text)
# → 0.67 (2 ortak kelime / 3 toplam kelime)
```

### 2. Decay - D(x)

Zaman azalması (soft decay).

**Formül:**
```
D(x) = 1 - exp(-days_since / halflife)
```

**Özellikler:**
- Exponential decay
- Halflife: 30 gün (varsayılan)
- 0 = yeni bellek, 1 = çok eski bellek

**Hesaplama:**
```python
def calculate_decay(last_accessed, current_time, halflife=30):
    """
    Zaman azalması hesapla
    
    Args:
        last_accessed: Son erişim zamanı (timestamp)
        current_time: Şu anki zaman (timestamp)
        halflife: Yarı ömür (gün)
    
    Returns: 0-1 arası (0=yeni, 1=eski)
    """
    # Gün cinsinden fark
    days_since = (current_time - last_accessed) / (24 * 3600)
    
    # Exponential decay
    decay = math.exp(-days_since / halflife)
    
    # 1 - decay (0=yeni, 1=eski)
    return 1 - decay
```

**Örnek:**
```python
# 15 gün önce erişilmiş
days_since = 15
halflife = 30

decay = 1 - exp(-15/30)
# → 0.39 (orta yaşlı)

# 60 gün önce erişilmiş
days_since = 60
decay = 1 - exp(-60/30)
# → 0.86 (çok eski)

# Bugün erişilmiş
days_since = 0
decay = 1 - exp(0)
# → 0.0 (yeni)
```

**Decay Eğrisi:**
```
1.0 |                    ___________
    |                 ___/
0.5 |            ____/
    |       ____/
0.0 |______/
    +----+----+----+----+----+----+
    0   15   30   45   60   75   90 (gün)
```

### 3. Importance - I(x)

Bellek önemi (manuel veya otomatik).

**Aralık:** 0-1
- 0.0-0.3: Düşük önem
- 0.3-0.7: Orta önem
- 0.7-1.0: Yüksek önem

**Belirleme Yöntemleri:**

#### Manuel
```python
memory = {
    'importance': 0.9  # Kullanıcı tarafından belirlendi
}
```

#### Otomatik (Heuristics)
```python
def calculate_importance(memory):
    """Otomatik önem hesaplama"""
    importance = 0.5  # Başlangıç
    
    # Bellek türüne göre
    if memory['type'] == 'preference':
        importance += 0.2
    elif memory['type'] == 'conversation':
        importance += 0.1
    
    # İçerik uzunluğuna göre
    content_length = len(memory.get('text', ''))
    if content_length > 500:
        importance += 0.1
    
    # Etiketlere göre
    if 'critical' in memory.get('tags', []):
        importance += 0.2
    
    return min(1.0, importance)
```

**Örnek:**
```python
# Yüksek önem
memory = {
    'type': 'preference',
    'text': 'User prefers Python for backend development',
    'tags': ['critical', 'preference'],
    'importance': 0.9
}

# Düşük önem
memory = {
    'type': 'conversation',
    'text': 'Hello',
    'importance': 0.2
}
```

### 4. Frequency - F(x)

Erişim sıklığı (logaritmik).

**Formül:**
```
F(x) = log(access_count + 1) / log(max_count + 1)
```

**Özellikler:**
- Logaritmik scale (diminishing returns)
- max_count: 1000 (varsayılan)
- 0 = hiç erişilmemiş, 1 = çok sık erişilmiş

**Hesaplama:**
```python
def calculate_frequency(access_count, max_count=1000):
    """
    Erişim sıklığı hesapla
    
    Args:
        access_count: Erişim sayısı
        max_count: Maksimum erişim sayısı (normalizasyon için)
    
    Returns: 0-1 arası
    """
    if access_count <= 0:
        return 0.0
    
    # Logaritmik scale
    freq = math.log(access_count + 1) / math.log(max_count + 1)
    
    return min(1.0, freq)
```

**Örnek:**
```python
# Hiç erişilmemiş
access_count = 0
frequency = 0.0

# 10 kez erişilmiş
access_count = 10
frequency = log(11) / log(1001) ≈ 0.35

# 100 kez erişilmiş
access_count = 100
frequency = log(101) / log(1001) ≈ 0.67

# 1000 kez erişilmiş
access_count = 1000
frequency = log(1001) / log(1001) = 1.0
```

**Frequency Eğrisi:**
```
1.0 |                    ___________
    |                ___/
0.5 |          _____/
    |     ____/
0.0 |____/
    +----+----+----+----+----+----+
    0   10  100  500  1000 (erişim)
```

## Ağırlık Konfigürasyonu

### Varsayılan Ağırlıklar

```python
# Dengeli konfigürasyon
weights = HScoreWeights(
    alpha=0.4,  # Benzerlik (en önemli)
    beta=0.2,   # Zaman azalması
    gamma=0.3,  # Önem
    delta=0.1   # Sıklık (en az önemli)
)
```

### Özel Senaryolar

#### Similarity-Focused (Arama Odaklı)

```python
# Arama kalitesi için
weights = HScoreWeights(
    alpha=0.6,  # Benzerlik çok önemli
    beta=0.1,   # Zaman önemli değil
    gamma=0.2,  # Önem orta
    delta=0.1   # Sıklık az
)
```

**Kullanım:** Semantic search, Q&A sistemleri

#### Recency-Focused (Güncellik Odaklı)

```python
# Güncel bilgi için
weights = HScoreWeights(
    alpha=0.3,  # Benzerlik orta
    beta=0.4,   # Zaman çok önemli
    gamma=0.2,  # Önem orta
    delta=0.1   # Sıklık az
)
```

**Kullanım:** Haber, trend analizi, real-time sistemler

#### Importance-Focused (Önem Odaklı)

```python
# Kritik bilgi için
weights = HScoreWeights(
    alpha=0.3,  # Benzerlik orta
    beta=0.1,   # Zaman az
    gamma=0.5,  # Önem çok önemli
    delta=0.1   # Sıklık az
)
```

**Kullanım:** Preference management, kritik bilgi saklama

#### Frequency-Focused (Popülerlik Odaklı)

```python
# Popüler içerik için
weights = HScoreWeights(
    alpha=0.3,  # Benzerlik orta
    beta=0.2,   # Zaman orta
    gamma=0.2,  # Önem orta
    delta=0.3   # Sıklık önemli
)
```

**Kullanım:** Recommendation systems, trending content

### Ağırlık Güncelleme

```python
# Runtime'da ağırlık değiştir
scorer = MemoryScorer()

# Yeni ağırlıklar
new_weights = HScoreWeights(alpha=0.5, beta=0.15, gamma=0.25, delta=0.1)
scorer.update_weights(new_weights)

# Mevcut ağırlıkları al
current_weights = scorer.get_weights()
print(current_weights.to_dict())
```

## Kullanım Örnekleri

### Örnek 1: Temel Arama

```python
from lib.memory_scorer import MemoryScorer
from lib.memory_orchestrator import MemoryOrchestrator

# Orchestrator ve scorer
orchestrator = MemoryOrchestrator()
scorer = MemoryScorer()

# Arama yap
query = "authentication system"
memories = orchestrator.get_all_memories()

# Puanla ve sırala
ranked = scorer.rank_memories(
    memories=memories,
    query=query,
    context={'current_time': time.time()}
)

# En alakalı 5 bellek
for item in ranked[:5]:
    memory = item['memory']
    h_score = item['h_score']
    
    print(f"\nMemory: {memory['id']}")
    print(f"  Content: {memory['text'][:50]}...")
    print(f"  Total Score: {h_score['total']:.3f}")
    print(f"    Similarity: {h_score['similarity']:.3f}")
    print(f"    Decay: {h_score['decay']:.3f}")
    print(f"    Importance: {h_score['importance']:.3f}")
    print(f"    Frequency: {h_score['frequency']:.3f}")
```

### Örnek 2: Ağırlık Optimizasyonu

```python
# Farklı ağırlıkları test et
test_weights = [
    HScoreWeights(alpha=0.4, beta=0.2, gamma=0.3, delta=0.1),  # Balanced
    HScoreWeights(alpha=0.6, beta=0.1, gamma=0.2, delta=0.1),  # Similarity
    HScoreWeights(alpha=0.3, beta=0.4, gamma=0.2, delta=0.1),  # Recency
]

query = "user authentication"
memories = orchestrator.get_all_memories()

for weights in test_weights:
    scorer = MemoryScorer(weights=weights)
    ranked = scorer.rank_memories(memories, query)
    
    print(f"\nWeights: α={weights.alpha}, β={weights.beta}, γ={weights.gamma}, δ={weights.delta}")
    print(f"Top result: {ranked[0]['memory']['id']}")
    print(f"  Score: {ranked[0]['total_score']:.3f}")
```

### Örnek 3: Bileşen Analizi

```python
# Her bileşenin katkısını analiz et
memory = orchestrator.get_memory('mem-123')
query = "auth system"

h_score = scorer.calculate_score(memory, query)

# Bileşen katkıları
contributions = {
    'similarity': scorer.weights.alpha * (1 - h_score.similarity),
    'decay': scorer.weights.beta * h_score.decay,
    'importance': scorer.weights.gamma * h_score.importance,
    'frequency': scorer.weights.delta * h_score.frequency
}

print("Component Contributions:")
for component, value in contributions.items():
    percentage = (value / h_score.total) * 100
    print(f"  {component}: {value:.3f} ({percentage:.1f}%)")
```

### Örnek 4: Zaman Serisi Analizi

```python
# Belleğin zamanla puanının değişimini göster
memory = orchestrator.get_memory('mem-123')
query = "authentication"

# Farklı zaman noktaları
time_points = [
    memory['timestamp'],  # Oluşturulduğunda
    memory['timestamp'] + 15 * 24 * 3600 * 1000,  # 15 gün sonra
    memory['timestamp'] + 30 * 24 * 3600 * 1000,  # 30 gün sonra
    memory['timestamp'] + 60 * 24 * 3600 * 1000,  # 60 gün sonra
]

print("Score over time:")
for t in time_points:
    h_score = scorer.calculate_score(
        memory,
        query,
        context={'current_time': t / 1000}  # ms to seconds
    )
    
    days = (t - memory['timestamp']) / (24 * 3600 * 1000)
    print(f"  Day {days:.0f}: {h_score.total:.3f} (decay={h_score.decay:.3f})")
```

## Optimizasyon Stratejileri

### 1. Vektör Önbellekleme

```python
# Vektörleri önbellekle
vector_cache = {}

def get_query_vector(query):
    if query not in vector_cache:
        vector_cache[query] = embed_text(query)
    return vector_cache[query]

# Kullanım
query_vector = get_query_vector(query)
h_score = scorer.calculate_score(memory, query, query_vector)
```

### 2. Batch Scoring

```python
# Çok sayıda belleği toplu puanla
def batch_score(memories, query, batch_size=100):
    results = []
    
    for i in range(0, len(memories), batch_size):
        batch = memories[i:i+batch_size]
        batch_results = scorer.rank_memories(batch, query)
        results.extend(batch_results)
    
    # Tüm sonuçları sırala
    results.sort(key=lambda x: x['total_score'])
    return results
```

### 3. Early Stopping

```python
# İlk N sonucu bul ve dur
def top_k_memories(memories, query, k=10, threshold=0.3):
    results = []
    
    for memory in memories:
        h_score = scorer.calculate_score(memory, query)
        
        if h_score.total < threshold:
            results.append((memory, h_score.total))
            
            if len(results) >= k:
                break
    
    return sorted(results, key=lambda x: x[1])
```

## Test Örnekleri

```python
# Test: Puan hesaplama
def test_calculate_score():
    scorer = MemoryScorer()
    
    memory = {
        'id': 'mem-1',
        'text': 'authentication system',
        'importance': 0.8,
        'access_count': 10,
        'last_accessed': time.time() - 15 * 24 * 3600,  # 15 gün önce
        'timestamp': time.time() - 30 * 24 * 3600  # 30 gün önce
    }
    
    h_score = scorer.calculate_score(memory, 'auth system')
    
    assert 0 <= h_score.total <= 1
    assert 0 <= h_score.similarity <= 1
    assert 0 <= h_score.decay <= 1

# Test: Sıralama
def test_rank_memories():
    scorer = MemoryScorer()
    
    memories = [
        {'id': '1', 'text': 'auth system', 'importance': 0.8, 'access_count': 10},
        {'id': '2', 'text': 'database query', 'importance': 0.5, 'access_count': 5},
        {'id': '3', 'text': 'user authentication', 'importance': 0.9, 'access_count': 15}
    ]
    
    ranked = scorer.rank_memories(memories, 'authentication')
    
    # En alakalı başta (düşük puan)
    assert ranked[0]['total_score'] < ranked[-1]['total_score']
```

## Sorun Giderme

### Beklenmeyen Sıralama

**Sebep**: Ağırlıklar senaryoya uygun değil

**Çözüm**: Ağırlıkları ayarla veya A/B test yap

```python
# Debug: Bileşenleri incele
h_score = scorer.calculate_score(memory, query)
print(f"Similarity: {h_score.similarity:.3f}")
print(f"Decay: {h_score.decay:.3f}")
print(f"Importance: {h_score.importance:.3f}")
print(f"Frequency: {h_score.frequency:.3f}")
```

### Eski Bellekler Üstte

**Sebep**: Decay ağırlığı çok düşük

**Çözüm**: Beta'yı artır

```python
weights = HScoreWeights(alpha=0.3, beta=0.4, gamma=0.2, delta=0.1)
```

### Düşük Önemli Bellekler Üstte

**Sebep**: Importance ağırlığı çok düşük

**Çözüm**: Gamma'yı artır

```python
weights = HScoreWeights(alpha=0.3, beta=0.2, gamma=0.4, delta=0.1)
```

## Kaynaklar

- [Information Retrieval](https://en.wikipedia.org/wiki/Information_retrieval)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Exponential Decay](https://en.wikipedia.org/wiki/Exponential_decay)
- [Jaccard Index](https://en.wikipedia.org/wiki/Jaccard_index)
