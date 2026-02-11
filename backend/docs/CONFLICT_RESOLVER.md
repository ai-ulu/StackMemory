# Conflict Resolver - Çelişki Çözümleme Sistemi

## Genel Bakış

Conflict Resolver, bellekler arası çelişkileri tespit eden ve otomatik/manuel çözüm stratejileri sunan bir sistemdir. Belleklerin tutarlılığını korur ve çelişkili bilgileri yönetir.

## Temel Özellikler

- **4 Çelişki Türü**: Contradiction, Duplicate, Outdated, Ambiguous
- **4 Çözüm Stratejisi**: Keep1, Keep2, Merge, Ignore
- **Otomatik Çözüm**: Kural bazlı otomatik çözümleme
- **Güven Puanı**: Her çelişki için güven skoru
- **Çözüm Geçmişi**: Tüm çözümler kaydedilir

## API Referansı

### ConflictResolver Sınıfı

```python
from lib.conflict_resolver import ConflictResolver

# Resolver oluştur
resolver = ConflictResolver()
```

### Çelişki Tespiti

```python
# İki bellek arası çelişki tespit et
memory1 = {
    'id': 'mem-1',
    'type': 'preference',
    'content': 'Kullanıcı Python tercih ediyor',
    'timestamp': 1704067200000,
    'importance': 0.8
}

memory2 = {
    'id': 'mem-2',
    'type': 'preference',
    'content': 'Kullanıcı JavaScript tercih ediyor',
    'timestamp': 1704153600000,
    'importance': 0.9
}

conflict = resolver.detect_conflict(memory1, memory2)

if conflict:
    print(f"Çelişki türü: {conflict.type}")
    print(f"Güven: {conflict.confidence:.2f}")
    print(f"Açıklama: {conflict.explanation}")
```

## Çelişki Türleri

### 1. Contradiction (Çelişki)

İki bellek birbirine zıt bilgi içeriyor.

**Tespit Kriterleri:**
- Aynı tür bellekler
- Zıt anahtar kelimeler (yes/no, true/false, prefer/avoid)
- Yüksek içerik benzerliği (> 0.5)

**Örnek:**
```python
mem1 = {'content': 'User prefers dark mode'}
mem2 = {'content': 'User prefers light mode'}
# → ConflictType.CONTRADICTION
```

### 2. Duplicate (Tekrar)

İki bellek neredeyse aynı bilgiyi içeriyor.

**Tespit Kriterleri:**
- Çok yüksek içerik benzerliği (> 0.9)
- Aynı tür bellekler

**Örnek:**
```python
mem1 = {'content': 'User likes Python programming'}
mem2 = {'content': 'User likes Python programming language'}
# → ConflictType.DUPLICATE
```

### 3. Outdated (Güncel Değil)

Bir bellek diğerinden çok daha eski.

**Tespit Kriterleri:**
- Zaman farkı > 90 gün
- Benzer içerik (> 0.5)
- Aynı tür bellekler

**Örnek:**
```python
mem1 = {'content': 'User uses Python 2.7', 'timestamp': old_time}
mem2 = {'content': 'User uses Python 3.11', 'timestamp': recent_time}
# → ConflictType.OUTDATED
```

### 4. Ambiguous (Belirsiz)

İki bellek benzer ama net çelişki yok.

**Tespit Kriterleri:**
- Orta seviye benzerlik (0.5 - 0.9)
- Aynı tür bellekler
- Diğer çelişki türlerine uymayan

**Örnek:**
```python
mem1 = {'content': 'User sometimes uses TypeScript'}
mem2 = {'content': 'User occasionally codes in TypeScript'}
# → ConflictType.AMBIGUOUS
```

## Çözüm Stratejileri

### 1. Keep1 (İlkini Tut)

İlk belleği tut, ikincisini sil.

**Ne Zaman Kullanılır:**
- İlk bellek daha önemli
- İlk bellek daha sık erişilmiş
- Duplicate durumunda ilk bellek daha detaylı

```python
resolution = resolver.resolve_conflict(
    conflict,
    strategy=ResolutionStrategy.KEEP1
)
```

### 2. Keep2 (İkincisini Tut)

İkinci belleği tut, ilkini sil.

**Ne Zaman Kullanılır:**
- İkinci bellek daha güncel
- İkinci bellek daha önemli
- Outdated durumunda ikinci bellek yeni

```python
resolution = resolver.resolve_conflict(
    conflict,
    strategy=ResolutionStrategy.KEEP2
)
```

### 3. Merge (Birleştir)

İki belleği birleştir, yeni bellek oluştur.

**Ne Zaman Kullanılır:**
- Her iki bellek de değerli bilgi içeriyor
- Ambiguous durumunda
- Bilgi kaybı istenmiyor

```python
resolution = resolver.resolve_conflict(
    conflict,
    strategy=ResolutionStrategy.MERGE
)

# Yeni bellek oluşturulur
merged_memory = resolution.result_memory
print(merged_memory['content'])
# → "User sometimes uses TypeScript; User occasionally codes in TypeScript"
```

### 4. Ignore (Yoksay)

Çelişkiyi çözme, her iki belleği de tut.

**Ne Zaman Kullanılır:**
- Düşük güven puanı (< 0.5)
- Manuel inceleme gerekiyor
- Çelişki önemli değil

```python
resolution = resolver.resolve_conflict(
    conflict,
    strategy=ResolutionStrategy.IGNORE
)
```

## Otomatik Çözüm

Resolver otomatik çözüm kuralları içerir:

```python
# Otomatik çözüm
resolution = resolver.auto_resolve(conflict)

print(f"Strateji: {resolution.strategy}")
print(f"Sebep: {resolution.reason}")
```

### Otomatik Çözüm Kuralları

1. **Duplicate + Yüksek Benzerlik (> 0.95)**
   - Strateji: KEEP1 (daha eski olan)
   - Sebep: "Exact duplicate, keeping older memory"

2. **Outdated + Zaman Farkı > 90 gün**
   - Strateji: KEEP2 (daha yeni olan)
   - Sebep: "Outdated memory, keeping newer one"

3. **Contradiction + Önem Farkı > 0.3**
   - Strateji: KEEP2 (daha önemli olan)
   - Sebep: "Significant importance difference"

4. **Ambiguous + Orta Benzerlik**
   - Strateji: MERGE
   - Sebep: "Ambiguous conflict, merging for safety"

5. **Düşük Güven (< 0.5)**
   - Strateji: IGNORE
   - Sebep: "Low confidence, manual review needed"

## Toplu Çelişki Tespiti

```python
# Tüm bellekleri tara
memories = orchestrator.get_all_memories()

conflicts = resolver.detect_all_conflicts(memories)

print(f"Toplam {len(conflicts)} çelişki bulundu")

# Türlere göre grupla
by_type = {}
for conflict in conflicts:
    conflict_type = conflict.type.value
    by_type[conflict_type] = by_type.get(conflict_type, 0) + 1

for ctype, count in by_type.items():
    print(f"  {ctype}: {count}")
```

## Çözüm Geçmişi

Tüm çözümler kaydedilir:

```python
# Çözüm geçmişini al
history = resolver.get_resolution_history()

for resolution in history:
    print(f"Conflict: {resolution.conflict_id}")
    print(f"  Strategy: {resolution.strategy}")
    print(f"  Timestamp: {resolution.timestamp}")
    print(f"  Reason: {resolution.reason}")
```

## Kullanım Örnekleri

### Örnek 1: Preference Çelişkileri

```python
from lib.conflict_resolver import ConflictResolver
from lib.memory_orchestrator import MemoryOrchestrator

orchestrator = MemoryOrchestrator()
resolver = ConflictResolver()

# Preference belleklerini al
preferences = orchestrator.search(memory_type="preference", limit=100)

# Çelişkileri tespit et
conflicts = resolver.detect_all_conflicts(preferences)

# Otomatik çözümle
for conflict in conflicts:
    resolution = resolver.auto_resolve(conflict)
    
    if resolution.strategy == ResolutionStrategy.KEEP2:
        # Eski belleği sil
        orchestrator.delete_memory(conflict.memory1_id)
    elif resolution.strategy == ResolutionStrategy.MERGE:
        # Yeni bellek oluştur
        orchestrator.store_memory(resolution.result_memory)
        # Eskileri sil
        orchestrator.delete_memory(conflict.memory1_id)
        orchestrator.delete_memory(conflict.memory2_id)

print(f"{len(conflicts)} çelişki çözüldü")
```

### Örnek 2: Duplicate Temizleme

```python
# Sadece duplicate'leri bul
duplicates = [
    c for c in conflicts
    if c.type == ConflictType.DUPLICATE
]

print(f"{len(duplicates)} duplicate bulundu")

# Hepsini otomatik çözümle
for dup in duplicates:
    resolution = resolver.auto_resolve(dup)
    
    # İlkini tut (genellikle daha detaylı)
    if resolution.strategy == ResolutionStrategy.KEEP1:
        orchestrator.delete_memory(dup.memory2_id)
        print(f"Silindi: {dup.memory2_id}")
```

### Örnek 3: Manuel İnceleme

```python
# Düşük güvenli çelişkileri bul
low_confidence = [
    c for c in conflicts
    if c.confidence < 0.6
]

print(f"{len(low_confidence)} düşük güvenli çelişki")

# Manuel inceleme için listele
for conflict in low_confidence:
    mem1 = orchestrator.get_memory(conflict.memory1_id)
    mem2 = orchestrator.get_memory(conflict.memory2_id)
    
    print(f"\nConflict: {conflict.type.value}")
    print(f"  Memory 1: {mem1['content'][:50]}")
    print(f"  Memory 2: {mem2['content'][:50]}")
    print(f"  Confidence: {conflict.confidence:.2f}")
    
    # Kullanıcıdan input al
    choice = input("Çözüm (1/2/merge/ignore): ")
    
    if choice == '1':
        strategy = ResolutionStrategy.KEEP1
    elif choice == '2':
        strategy = ResolutionStrategy.KEEP2
    elif choice == 'merge':
        strategy = ResolutionStrategy.MERGE
    else:
        strategy = ResolutionStrategy.IGNORE
    
    resolution = resolver.resolve_conflict(conflict, strategy)
    print(f"Çözüldü: {resolution.strategy.value}")
```

### Örnek 4: Periyodik Temizlik

```python
import schedule
import time

def cleanup_conflicts():
    """Günlük çelişki temizliği"""
    orchestrator = MemoryOrchestrator()
    resolver = ConflictResolver()
    
    # Tüm bellekleri al
    memories = orchestrator.get_all_memories()
    
    # Çelişkileri tespit et
    conflicts = resolver.detect_all_conflicts(memories)
    
    # Yüksek güvenli çelişkileri otomatik çözümle
    auto_resolved = 0
    for conflict in conflicts:
        if conflict.confidence > 0.8:
            resolution = resolver.auto_resolve(conflict)
            
            if resolution.strategy == ResolutionStrategy.KEEP2:
                orchestrator.delete_memory(conflict.memory1_id)
                auto_resolved += 1
            elif resolution.strategy == ResolutionStrategy.MERGE:
                orchestrator.store_memory(resolution.result_memory)
                orchestrator.delete_memory(conflict.memory1_id)
                orchestrator.delete_memory(conflict.memory2_id)
                auto_resolved += 1
    
    print(f"Günlük temizlik: {auto_resolved} çelişki çözüldü")

# Her gün 03:00'te çalıştır
schedule.every().day.at("03:00").do(cleanup_conflicts)

while True:
    schedule.run_pending()
    time.sleep(3600)
```

## Conflict Yapısı

```python
@dataclass
class Conflict:
    id: str                      # Çelişki ID
    memory1_id: str              # İlk bellek ID
    memory2_id: str              # İkinci bellek ID
    type: ConflictType           # Çelişki türü
    confidence: float            # Güven puanı (0-1)
    explanation: str             # Açıklama
    detected_at: float           # Tespit zamanı
    metadata: Dict[str, Any]     # Ek bilgiler
```

## Resolution Yapısı

```python
@dataclass
class Resolution:
    conflict_id: str             # Çelişki ID
    strategy: ResolutionStrategy # Çözüm stratejisi
    timestamp: float             # Çözüm zamanı
    reason: str                  # Sebep
    result_memory: Optional[Dict] # Sonuç bellek (merge için)
    metadata: Dict[str, Any]     # Ek bilgiler
```

## Test Örnekleri

```python
# Test: Contradiction detection
def test_contradiction():
    resolver = ConflictResolver()
    
    mem1 = {
        'id': '1',
        'type': 'preference',
        'content': 'User prefers dark mode',
        'timestamp': 1704067200000
    }
    
    mem2 = {
        'id': '2',
        'type': 'preference',
        'content': 'User prefers light mode',
        'timestamp': 1704153600000
    }
    
    conflict = resolver.detect_conflict(mem1, mem2)
    
    assert conflict is not None
    assert conflict.type == ConflictType.CONTRADICTION
    assert conflict.confidence > 0.5

# Test: Auto resolve
def test_auto_resolve():
    resolver = ConflictResolver()
    
    # Duplicate conflict
    conflict = Conflict(
        id='c1',
        memory1_id='m1',
        memory2_id='m2',
        type=ConflictType.DUPLICATE,
        confidence=0.95,
        explanation='Exact duplicate',
        detected_at=time.time(),
        metadata={}
    )
    
    resolution = resolver.auto_resolve(conflict)
    
    assert resolution.strategy == ResolutionStrategy.KEEP1
```

## İleri Seviye Kullanım

### Custom Çelişki Tespiti

```python
class CustomConflictResolver(ConflictResolver):
    def detect_conflict(self, mem1, mem2):
        # Önce standart tespiti çalıştır
        conflict = super().detect_conflict(mem1, mem2)
        
        # Özel kurallar ekle
        if self._is_version_conflict(mem1, mem2):
            return Conflict(
                id=f"{mem1['id']}-{mem2['id']}",
                memory1_id=mem1['id'],
                memory2_id=mem2['id'],
                type=ConflictType.OUTDATED,
                confidence=0.9,
                explanation="Version conflict detected",
                detected_at=time.time(),
                metadata={'custom': True}
            )
        
        return conflict
    
    def _is_version_conflict(self, mem1, mem2):
        # Versiyon numarası kontrolü
        import re
        v1 = re.search(r'v?(\d+\.\d+)', mem1.get('content', ''))
        v2 = re.search(r'v?(\d+\.\d+)', mem2.get('content', ''))
        return v1 and v2 and v1.group(1) != v2.group(1)
```

### Çelişki Raporlama

```python
def generate_conflict_report(conflicts):
    """Detaylı çelişki raporu oluştur"""
    report = {
        'total': len(conflicts),
        'by_type': {},
        'by_confidence': {
            'high': 0,    # > 0.8
            'medium': 0,  # 0.5 - 0.8
            'low': 0      # < 0.5
        },
        'recommendations': []
    }
    
    for conflict in conflicts:
        # Türe göre say
        ctype = conflict.type.value
        report['by_type'][ctype] = report['by_type'].get(ctype, 0) + 1
        
        # Güvene göre say
        if conflict.confidence > 0.8:
            report['by_confidence']['high'] += 1
        elif conflict.confidence > 0.5:
            report['by_confidence']['medium'] += 1
        else:
            report['by_confidence']['low'] += 1
        
        # Öneri ekle
        if conflict.confidence > 0.8:
            report['recommendations'].append({
                'conflict_id': conflict.id,
                'action': 'auto_resolve',
                'reason': 'High confidence'
            })
    
    return report
```

## Sorun Giderme

### Çok Fazla False Positive

**Sebep**: Benzerlik threshold'u çok düşük

**Çözüm**: Confidence threshold'u yükselt

```python
# Sadece yüksek güvenli çelişkileri işle
high_confidence = [c for c in conflicts if c.confidence > 0.8]
```

### Merge Sonucu Çok Uzun

**Sebep**: İçerikler birleştirilirken tekrar oluşuyor

**Çözüm**: Custom merge fonksiyonu yaz

```python
def smart_merge(mem1, mem2):
    """Akıllı birleştirme"""
    content1 = mem1['content']
    content2 = mem2['content']
    
    # Ortak kelimeleri çıkar
    words1 = set(content1.split())
    words2 = set(content2.split())
    
    common = words1 & words2
    unique1 = words1 - common
    unique2 = words2 - common
    
    # Yeni içerik oluştur
    merged = ' '.join(common | unique1 | unique2)
    
    return {
        **mem1,
        'content': merged,
        'merged_from': [mem1['id'], mem2['id']]
    }
```

## Kaynaklar

- [Conflict Resolution Strategies](https://en.wikipedia.org/wiki/Conflict_resolution)
- [Duplicate Detection Algorithms](https://en.wikipedia.org/wiki/Record_linkage)
- [Temporal Reasoning](https://en.wikipedia.org/wiki/Temporal_database)
