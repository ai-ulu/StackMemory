# A/B Testing Framework - Deney Yönetim Sistemi

## Genel Bakış

A/B Testing Framework, bellek sistemi üzerinde deneyler yapmanızı sağlar. Farklı H(x,ψ) ağırlıkları, algoritma varyantları ve konfigürasyonları test edebilir, istatistiksel analiz ile kazanan varyantı belirleyebilirsiniz.

## Temel Özellikler

- **Deney Yönetimi**: Çoklu deney oluşturma ve yönetme
- **Varyant Atama**: Consistent hashing ile deterministik atama
- **Metrik Toplama**: Otomatik performans metrikleri
- **İstatistiksel Analiz**: T-test ile anlamlılık testi
- **Kazanan Deployment**: Otomatik kazanan varyant dağıtımı
- **Veri Saklama**: JSON tabanlı kalıcı depolama

## API Referansı

### ABTestingFramework Sınıfı

```python
from lib.ab_testing import ABTestingFramework

# Framework oluştur
ab_test = ABTestingFramework(data_dir='./data/ab_tests')
```

### Deney Oluşturma

```python
# Yeni deney oluştur
experiment = ab_test.create_experiment(
    name='h_score_weights_test',
    description='Test different H(x,ψ) weight configurations',
    variants={
        'control': {
            'alpha': 0.4,  # Similarity
            'beta': 0.2,   # Decay
            'gamma': 0.3,  # Importance
            'delta': 0.1   # Frequency
        },
        'variant_a': {
            'alpha': 0.5,  # Daha fazla similarity ağırlığı
            'beta': 0.15,
            'gamma': 0.25,
            'delta': 0.1
        },
        'variant_b': {
            'alpha': 0.3,  # Daha fazla importance ağırlığı
            'beta': 0.2,
            'gamma': 0.4,
            'delta': 0.1
        }
    }
)

print(f"Experiment ID: {experiment['id']}")
print(f"Status: {experiment['status']}")
```

### Varyant Atama

```python
# Kullanıcıya varyant ata (consistent hashing)
user_id = 'user-123'
variant = ab_test.assign_variant(experiment['id'], user_id)

print(f"User {user_id} → Variant: {variant}")
# → "control", "variant_a" veya "variant_b"

# Aynı kullanıcı her zaman aynı varyantı alır
variant2 = ab_test.assign_variant(experiment['id'], user_id)
assert variant == variant2  # ✓ Deterministik
```

### Metrik Kaydetme

```python
# Metrik kaydet
ab_test.record_metric(
    experiment_id=experiment['id'],
    variant=variant,
    metric_name='search_latency',
    value=0.125  # 125ms
)

ab_test.record_metric(
    experiment_id=experiment['id'],
    variant=variant,
    metric_name='relevance_score',
    value=0.85
)

ab_test.record_metric(
    experiment_id=experiment['id'],
    variant=variant,
    metric_name='user_satisfaction',
    value=4.5  # 5 üzerinden
)
```

### Sonuçları Analiz Etme

```python
# Deney sonuçlarını al
results = ab_test.get_results(experiment['id'])

print(f"Experiment: {results['name']}")
print(f"Status: {results['status']}")
print(f"Duration: {results['duration_days']:.1f} days")

# Varyant başına sonuçlar
for variant_name, stats in results['variants'].items():
    print(f"\n{variant_name}:")
    print(f"  Sample size: {stats['sample_size']}")
    
    for metric, values in stats['metrics'].items():
        print(f"  {metric}:")
        print(f"    Mean: {values['mean']:.3f}")
        print(f"    Std: {values['std']:.3f}")
        print(f"    Min: {values['min']:.3f}")
        print(f"    Max: {values['max']:.3f}")
```

### İstatistiksel Analiz

```python
# T-test ile anlamlılık testi
analysis = ab_test.analyze_experiment(
    experiment_id=experiment['id'],
    metric_name='relevance_score',
    baseline_variant='control'
)

print(f"Metric: {analysis['metric']}")
print(f"Baseline: {analysis['baseline']}")

for comparison in analysis['comparisons']:
    print(f"\n{comparison['variant']} vs {analysis['baseline']}:")
    print(f"  Mean difference: {comparison['mean_difference']:.3f}")
    print(f"  P-value: {comparison['p_value']:.4f}")
    print(f"  Significant: {comparison['significant']}")
    print(f"  Winner: {comparison['winner']}")
```

**İstatistiksel Anlamlılık:**
- p-value < 0.05: İstatistiksel olarak anlamlı fark var
- p-value ≥ 0.05: Anlamlı fark yok

### Kazanan Varyantı Dağıtma

```python
# Kazanan varyantı belirle ve dağıt
deployment = ab_test.deploy_winner(
    experiment_id=experiment['id'],
    metric_name='relevance_score',
    min_sample_size=100  # Minimum 100 örnek gerekli
)

if deployment['deployed']:
    print(f"Winner: {deployment['winner']}")
    print(f"Config: {deployment['config']}")
    print(f"Improvement: {deployment['improvement']:.2%}")
else:
    print(f"Deployment failed: {deployment['reason']}")
```

## Kullanım Örnekleri

### Örnek 1: H(x,ψ) Ağırlık Optimizasyonu

```python
from lib.ab_testing import ABTestingFramework
from lib.memory_scorer import MemoryScorer, HScoreWeights
from lib.memory_orchestrator import MemoryOrchestrator

# Framework başlat
ab_test = ABTestingFramework()

# Deney oluştur
experiment = ab_test.create_experiment(
    name='hscore_optimization',
    description='Optimize H(x,ψ) weights for better relevance',
    variants={
        'control': {'alpha': 0.4, 'beta': 0.2, 'gamma': 0.3, 'delta': 0.1},
        'similarity_focused': {'alpha': 0.6, 'beta': 0.1, 'gamma': 0.2, 'delta': 0.1},
        'importance_focused': {'alpha': 0.3, 'beta': 0.1, 'gamma': 0.5, 'delta': 0.1}
    }
)

# Orchestrator başlat
orchestrator = MemoryOrchestrator()

# Test sorguları
test_queries = [
    'authentication system',
    'database optimization',
    'user interface design',
    'API documentation'
]

# Her kullanıcı için test
for user_id in range(100):
    # Varyant ata
    variant = ab_test.assign_variant(experiment['id'], f'user-{user_id}')
    
    # Varyant konfigürasyonunu al
    config = experiment['variants'][variant]
    
    # MemoryScorer'ı konfigüre et
    weights = HScoreWeights(**config)
    scorer = MemoryScorer(weights=weights)
    
    # Test sorgularını çalıştır
    for query in test_queries:
        # Arama yap
        start_time = time.time()
        results = orchestrator.search(query, limit=10)
        latency = time.time() - start_time
        
        # Metrikleri kaydet
        ab_test.record_metric(
            experiment['id'],
            variant,
            'search_latency',
            latency
        )
        
        # Relevance score hesapla (ilk sonucun H(x,ψ) puanı)
        if results:
            relevance = 1 - results[0].get('h_score', {}).get('total', 0.5)
            ab_test.record_metric(
                experiment['id'],
                variant,
                'relevance_score',
                relevance
            )

# Sonuçları analiz et
analysis = ab_test.analyze_experiment(
    experiment['id'],
    'relevance_score',
    'control'
)

print("Analysis Results:")
for comp in analysis['comparisons']:
    if comp['significant']:
        print(f"{comp['variant']}: {comp['mean_difference']:+.3f} (p={comp['p_value']:.4f}) ✓")

# Kazananı dağıt
deployment = ab_test.deploy_winner(
    experiment['id'],
    'relevance_score',
    min_sample_size=50
)

if deployment['deployed']:
    # Yeni ağırlıkları uygula
    new_weights = HScoreWeights(**deployment['config'])
    orchestrator.scorer.update_weights(new_weights)
    print(f"Deployed winner: {deployment['winner']}")
```

### Örnek 2: Cluster Algoritması Karşılaştırma

```python
# Cluster algoritmaları test et
experiment = ab_test.create_experiment(
    name='cluster_algorithm_test',
    description='Compare clustering algorithms',
    variants={
        'louvain': {'algorithm': 'louvain'},
        'label_propagation': {'algorithm': 'label_propagation'},
        'greedy': {'algorithm': 'greedy'}
    }
)

from lib.memory_graph import MemoryGraph

# Test verileri
memories = orchestrator.get_all_memories()

# Her varyant için test
for variant_name, config in experiment['variants'].items():
    # Graf oluştur
    graph = MemoryGraph()
    graph.build_graph(memories)
    
    # Cluster detection
    start_time = time.time()
    clusters = graph.detect_clusters(
        algorithm=config['algorithm'],
        min_similarity=0.8
    )
    duration = time.time() - start_time
    
    # Metrikleri kaydet
    ab_test.record_metric(
        experiment['id'],
        variant_name,
        'clustering_time',
        duration
    )
    
    ab_test.record_metric(
        experiment['id'],
        variant_name,
        'num_clusters',
        len(clusters)
    )
    
    # Cluster kalitesi (ortalama similarity)
    avg_similarity = sum(c.avg_similarity for c in clusters) / len(clusters)
    ab_test.record_metric(
        experiment['id'],
        variant_name,
        'cluster_quality',
        avg_similarity
    )

# Analiz
analysis = ab_test.analyze_experiment(
    experiment['id'],
    'cluster_quality',
    'louvain'
)

print("Cluster Algorithm Comparison:")
for comp in analysis['comparisons']:
    print(f"{comp['variant']}: quality={comp['mean_difference']:+.3f}")
```

### Örnek 3: Decay Halflife Optimizasyonu

```python
# Decay halflife test et
experiment = ab_test.create_experiment(
    name='decay_halflife_test',
    description='Optimize decay halflife parameter',
    variants={
        'short': {'decay_halflife_days': 15},
        'medium': {'decay_halflife_days': 30},
        'long': {'decay_halflife_days': 60}
    }
)

# Her varyant için scorer oluştur
for user_id in range(100):
    variant = ab_test.assign_variant(experiment['id'], f'user-{user_id}')
    config = experiment['variants'][variant]
    
    # Scorer konfigüre et
    scorer = MemoryScorer(decay_halflife_days=config['decay_halflife_days'])
    
    # Test sorguları
    for query in test_queries:
        results = orchestrator.search(query, limit=10)
        
        # Eski belleklerin sıralamasını kontrol et
        old_memories = [r for r in results if r.get('age_days', 0) > 30]
        
        if old_memories:
            # Eski belleklerin ortalama sırası
            avg_rank = sum(results.index(m) for m in old_memories) / len(old_memories)
            
            ab_test.record_metric(
                experiment['id'],
                variant,
                'old_memory_rank',
                avg_rank
            )

# Analiz
analysis = ab_test.analyze_experiment(
    experiment['id'],
    'old_memory_rank',
    'medium'
)
```

### Örnek 4: Çoklu Metrik Optimizasyonu

```python
# Çoklu metrik ile deney
experiment = ab_test.create_experiment(
    name='multi_metric_optimization',
    description='Optimize for multiple metrics',
    variants={
        'balanced': {'alpha': 0.4, 'beta': 0.2, 'gamma': 0.3, 'delta': 0.1},
        'speed': {'alpha': 0.5, 'beta': 0.3, 'gamma': 0.1, 'delta': 0.1},
        'quality': {'alpha': 0.3, 'beta': 0.1, 'gamma': 0.5, 'delta': 0.1}
    }
)

# Metrikleri topla
metrics_to_track = [
    'search_latency',
    'relevance_score',
    'user_satisfaction',
    'memory_usage'
]

# Test çalıştır
# ... (metrik toplama kodu)

# Her metrik için analiz
for metric in metrics_to_track:
    analysis = ab_test.analyze_experiment(
        experiment['id'],
        metric,
        'balanced'
    )
    
    print(f"\nMetric: {metric}")
    for comp in analysis['comparisons']:
        if comp['significant']:
            symbol = '↑' if comp['mean_difference'] > 0 else '↓'
            print(f"  {comp['variant']}: {symbol} {abs(comp['mean_difference']):.3f}")

# Composite score hesapla
def calculate_composite_score(variant_stats):
    """Çoklu metrik için composite score"""
    # Normalize edilmiş skorlar
    latency_score = 1 - (variant_stats['search_latency']['mean'] / 1.0)
    relevance_score = variant_stats['relevance_score']['mean']
    satisfaction_score = variant_stats['user_satisfaction']['mean'] / 5.0
    
    # Ağırlıklı ortalama
    composite = (
        0.3 * latency_score +
        0.4 * relevance_score +
        0.3 * satisfaction_score
    )
    
    return composite

# En iyi varyantı bul
results = ab_test.get_results(experiment['id'])
best_variant = max(
    results['variants'].items(),
    key=lambda x: calculate_composite_score(x[1])
)

print(f"\nBest variant (composite): {best_variant[0]}")
```

## Varyant Atama Algoritması

Consistent hashing kullanılır:

```python
def assign_variant(self, experiment_id: str, user_id: str) -> str:
    """
    Consistent hashing ile varyant ata
    
    Özellikler:
    - Deterministik (aynı user_id → aynı variant)
    - Uniform distribution (eşit dağılım)
    - Stable (deney değişmediği sürece aynı atama)
    """
    # Hash hesapla
    hash_input = f"{experiment_id}:{user_id}"
    hash_value = hashlib.md5(hash_input.encode()).hexdigest()
    hash_int = int(hash_value, 16)
    
    # Varyant sayısına göre modulo
    variant_index = hash_int % len(variants)
    
    return variant_names[variant_index]
```

## İstatistiksel Analiz

T-test kullanılır:

```python
from scipy import stats

# İki varyant karşılaştır
control_values = [0.85, 0.82, 0.88, ...]
variant_values = [0.90, 0.87, 0.92, ...]

# Independent t-test
t_statistic, p_value = stats.ttest_ind(control_values, variant_values)

# Anlamlılık kontrolü
significant = p_value < 0.05

# Kazanan belirleme
if significant:
    if mean(variant_values) > mean(control_values):
        winner = 'variant'
    else:
        winner = 'control'
else:
    winner = 'no_difference'
```

## Deney Durumları

```python
class ExperimentStatus:
    DRAFT = 'draft'          # Oluşturuldu, henüz başlamadı
    RUNNING = 'running'      # Aktif olarak veri topluyor
    PAUSED = 'paused'        # Duraklatıldı
    COMPLETED = 'completed'  # Tamamlandı
    DEPLOYED = 'deployed'    # Kazanan dağıtıldı
```

## Veri Yapısı

### Experiment

```json
{
  "id": "exp-123",
  "name": "h_score_weights_test",
  "description": "Test different H(x,ψ) configurations",
  "status": "running",
  "created_at": 1704067200.0,
  "started_at": 1704067200.0,
  "ended_at": null,
  "variants": {
    "control": {"alpha": 0.4, "beta": 0.2, "gamma": 0.3, "delta": 0.1},
    "variant_a": {"alpha": 0.5, "beta": 0.15, "gamma": 0.25, "delta": 0.1}
  },
  "assignments": {
    "user-1": "control",
    "user-2": "variant_a"
  },
  "metrics": {
    "control": {
      "search_latency": [0.125, 0.130, 0.128],
      "relevance_score": [0.85, 0.82, 0.88]
    },
    "variant_a": {
      "search_latency": [0.115, 0.120, 0.118],
      "relevance_score": [0.90, 0.87, 0.92]
    }
  }
}
```

## Best Practices

### 1. Yeterli Örnek Boyutu

```python
# Minimum 100 örnek bekle
if len(metrics) < 100:
    print("Not enough samples, continue collecting data")
    return

# Analiz yap
analysis = ab_test.analyze_experiment(...)
```

### 2. Çoklu Test Düzeltmesi

```python
# Bonferroni correction
num_comparisons = len(variants) - 1
adjusted_alpha = 0.05 / num_comparisons

# Düzeltilmiş p-value kontrolü
significant = p_value < adjusted_alpha
```

### 3. Deney Süresi

```python
# En az 7 gün çalıştır
min_duration_days = 7
duration = (time.time() - experiment['started_at']) / (24 * 3600)

if duration < min_duration_days:
    print(f"Experiment needs {min_duration_days - duration:.1f} more days")
    return
```

### 4. Metrik Seçimi

```python
# Primary metric: Ana karar metriği
primary_metric = 'relevance_score'

# Secondary metrics: Ek kontrol metrikleri
secondary_metrics = ['search_latency', 'user_satisfaction']

# Guardrail metrics: Kötüleşmemesi gereken metrikler
guardrail_metrics = ['error_rate', 'memory_usage']
```

## Test Örnekleri

```python
# Test: Varyant atama
def test_variant_assignment():
    ab_test = ABTestingFramework()
    experiment = ab_test.create_experiment(
        name='test',
        variants={'control': {}, 'variant_a': {}}
    )
    
    # Aynı kullanıcı aynı varyantı almalı
    variant1 = ab_test.assign_variant(experiment['id'], 'user-1')
    variant2 = ab_test.assign_variant(experiment['id'], 'user-1')
    
    assert variant1 == variant2

# Test: İstatistiksel analiz
def test_statistical_analysis():
    ab_test = ABTestingFramework()
    experiment = ab_test.create_experiment(
        name='test',
        variants={'control': {}, 'variant_a': {}}
    )
    
    # Metrikler ekle
    for i in range(100):
        ab_test.record_metric(experiment['id'], 'control', 'score', 0.8 + random.random() * 0.1)
        ab_test.record_metric(experiment['id'], 'variant_a', 'score', 0.85 + random.random() * 0.1)
    
    # Analiz
    analysis = ab_test.analyze_experiment(experiment['id'], 'score', 'control')
    
    assert len(analysis['comparisons']) == 1
    assert 'p_value' in analysis['comparisons'][0]
```

## Sorun Giderme

### Anlamlı Fark Bulunamıyor

**Sebep**: Örnek boyutu yetersiz veya varyantlar arası fark çok küçük

**Çözüm**: Daha fazla veri topla veya varyant farklarını artır

### Tutarsız Sonuçlar

**Sebep**: Rastgele varyasyon veya dış faktörler

**Çözüm**: Deney süresini uzat, daha fazla örnek topla

### Deployment Başarısız

**Sebep**: Minimum örnek boyutu veya anlamlılık kriteri sağlanmadı

**Çözüm**: Kriterleri kontrol et, gerekirse ayarla

## Kaynaklar

- [A/B Testing Best Practices](https://en.wikipedia.org/wiki/A/B_testing)
- [Statistical Significance](https://en.wikipedia.org/wiki/Statistical_significance)
- [T-test](https://en.wikipedia.org/wiki/Student%27s_t-test)
- [Consistent Hashing](https://en.wikipedia.org/wiki/Consistent_hashing)
