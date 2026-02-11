"""
Property-Based Tests: ConflictResolver

Test edilen özellikler:
- Özellik 45: Çelişki Tespiti
- Özellik 46: Çelişki Sıralaması
- Özellik 47: Çelişki Birleştirme
- Özellik 48: Çelişki Geçmişi

Framework: Hypothesis
Minimum: 100 iterasyon
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from datetime import datetime
import sys
import os

# Backend lib'i import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib.conflict_resolver import (
    ConflictResolver,
    MemoryData,
    Conflict,
    ConflictHistory,
    ConflictType,
    ConflictResolution
)


# ============================================================================
# Strategies (Test Data Generators)
# ============================================================================

@st.composite
def memory_data_strategy(draw, with_conflict=False, base_timestamp=None):
    """
    MemoryData generator
    
    Args:
        with_conflict: True ise çelişkili içerik üret
        base_timestamp: Sabit timestamp (flaky test önleme)
    """
    memory_id = draw(st.text(min_size=8, max_size=16, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))))
    memory_type = draw(st.sampled_from(['conversation', 'knowledge', 'command', 'preference']))
    scope = draw(st.sampled_from(['global', 'workspace', 'session']))
    
    # Timestamp (sabit base kullan)
    if base_timestamp is None:
        base_timestamp = 1700000000000  # Sabit base timestamp
    
    ninety_days = 90 * 24 * 60 * 60 * 1000
    timestamp = draw(st.integers(min_value=base_timestamp - ninety_days, max_value=base_timestamp))
    last_accessed = draw(st.integers(min_value=timestamp, max_value=base_timestamp))
    
    # Metadata
    metadata = {
        'source': draw(st.sampled_from(['user', 'system', 'agent'])),
        'tags': draw(st.lists(st.text(min_size=3, max_size=10), min_size=0, max_size=3))
    }
    
    # Content (çelişkili veya normal)
    if with_conflict:
        # Çelişkili içerik üret
        base_words = draw(st.lists(st.text(min_size=3, max_size=10), min_size=5, max_size=10))
        sentiment = draw(st.sampled_from(['positive', 'negative']))
        
        if sentiment == 'positive':
            content = ' '.join(base_words + ['success', 'correct', 'valid', 'enabled'])
        else:
            content = ' '.join(base_words + ['failure', 'incorrect', 'invalid', 'disabled'])
    else:
        content = draw(st.text(min_size=10, max_size=100))
    
    access_count = draw(st.integers(min_value=0, max_value=100))
    importance = draw(st.floats(min_value=0.0, max_value=1.0))
    
    return MemoryData(
        id=memory_id,
        type=memory_type,
        scope=scope,
        timestamp=timestamp,
        lastAccessed=last_accessed,
        metadata=metadata,
        content=content,
        accessCount=access_count,
        importance=importance
    )


@st.composite
def conflicting_memory_pair_strategy(draw):
    """
    Çelişkili bellek çifti üret
    
    Özellikler:
    - Benzer içerik (similarity > 0.8)
    - Farklı anlam (semantik fark)
    """
    # Sabit base timestamp
    base_timestamp = 1700000000000
    
    # Ortak kelimeler (yüksek similarity için - her biri unique)
    common_words = []
    for i in range(10):
        word = draw(st.text(min_size=4, max_size=8, alphabet=st.characters(whitelist_categories=('Ll',))))
        common_words.append(f"{word}{i}")  # Unique yap
    
    # Zıt kelime çiftleri (ConflictResolver'da tanımlı olanlar)
    opposites = [
        ('success', 'failure'),
        ('correct', 'incorrect'),
        ('valid', 'invalid'),
        ('enabled', 'disabled'),
        ('true', 'false'),
        ('yes', 'no'),
        ('active', 'inactive')
    ]
    
    # Rastgele bir zıt çift seç
    positive, negative = draw(st.sampled_from(opposites))
    
    # Base content: ortak kelimeler + positive
    base_content = ' '.join(common_words + [positive])
    
    # Conflicting content: ortak kelimeler + negative
    conflicting_content = ' '.join(common_words + [negative])
    
    # Base memory
    base_id = draw(st.text(min_size=8, max_size=16, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))))
    base_type = draw(st.sampled_from(['conversation', 'knowledge', 'command']))
    base_scope = draw(st.sampled_from(['global', 'workspace']))
    
    ninety_days = 90 * 24 * 60 * 60 * 1000
    base_timestamp_val = draw(st.integers(min_value=base_timestamp - ninety_days, max_value=base_timestamp))
    
    base = MemoryData(
        id=base_id,
        type=base_type,
        scope=base_scope,
        timestamp=base_timestamp_val,
        lastAccessed=draw(st.integers(min_value=base_timestamp_val, max_value=base_timestamp)),
        metadata={'source': draw(st.sampled_from(['user', 'system'])), 'tags': []},
        content=base_content,
        accessCount=draw(st.integers(min_value=0, max_value=100)),
        importance=draw(st.floats(min_value=0.0, max_value=1.0))
    )
    
    # Conflicting memory
    conflicting = MemoryData(
        id=draw(st.text(min_size=8, max_size=16, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')))),
        type=base.type,
        scope=base.scope,
        timestamp=draw(st.integers(min_value=base_timestamp_val - 1000000, max_value=base_timestamp_val + 1000000)),
        lastAccessed=draw(st.integers(min_value=base_timestamp_val, max_value=base_timestamp)),
        metadata=base.metadata.copy(),
        content=conflicting_content,
        accessCount=draw(st.integers(min_value=0, max_value=100)),
        importance=draw(st.floats(min_value=0.0, max_value=1.0))
    )
    
    return (base, conflicting)


# ============================================================================
# Özellik 45: Çelişki Tespiti
# **Validates: Requirements 18.1, 18.2**
# ============================================================================

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(pair=conflicting_memory_pair_strategy())
@pytest.mark.asyncio
async def test_property_45_conflict_detection(pair):
    """
    Özellik 45: Çelişki Tespiti
    
    *Her* iki çelişkili bellek için (benzer içerik ama farklı anlam),
    sistem bunları çelişki olarak işaretlemelidir.
    
    **Validates: Requirements 18.1, 18.2**
    
    Özellik:
    - Benzer içerik (similarity > 0.8)
    - Farklı anlam (semantik fark)
    - Çelişki olarak tespit edilmeli
    """
    resolver = ConflictResolver()
    m1, m2 = pair
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts([m1, m2])
    
    # Özellik: Çelişki tespit edilmeli
    assert len(conflicts) > 0, "Çelişkili bellekler tespit edilmedi"
    
    # Çelişki verisi doğru mu
    conflict = conflicts[0]
    assert conflict.memory1.id in [m1.id, m2.id], "Çelişki memory1 ID'si yanlış"
    assert conflict.memory2.id in [m1.id, m2.id], "Çelişki memory2 ID'si yanlış"
    assert conflict.similarity > 0.0, "Benzerlik skoru hesaplanmadı"
    assert conflict.type in ['contradiction', 'duplicate', 'outdated', 'ambiguous'], "Çelişki türü geçersiz"


@settings(max_examples=100)
@given(memories=st.lists(memory_data_strategy(), min_size=2, max_size=5))
@pytest.mark.asyncio
async def test_property_45_no_false_positives(memories):
    """
    Özellik 45: Çelişki Tespiti - False Positive Kontrolü
    
    *Her* benzer olmayan bellek çifti için,
    çelişki olarak işaretlenmemelidir.
    
    **Validates: Requirements 18.1, 18.2**
    """
    resolver = ConflictResolver()
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts(memories)
    
    # Her çelişki için similarity > 0.8 olmalı
    for conflict in conflicts:
        assert conflict.similarity > 0.8, f"False positive: similarity={conflict.similarity}"


# ============================================================================
# Özellik 46: Çelişki Sıralaması
# **Validates: Requirements 18.3**
# ============================================================================

@settings(max_examples=100)
@given(
    pairs=st.lists(conflicting_memory_pair_strategy(), min_size=2, max_size=5)
)
@pytest.mark.asyncio
async def test_property_46_conflict_sorting(pairs):
    """
    Özellik 46: Çelişki Sıralaması
    
    *Her* çelişki listesi için,
    çelişkiler H(x,ψ) puanına göre sıralanmalıdır.
    
    **Validates: Requirements 18.3**
    
    Özellik:
    - Çelişkiler H(x,ψ) puanına göre azalan sırada
    - max(score1, score2) kullanılır
    """
    resolver = ConflictResolver()
    
    # Tüm bellekleri topla
    all_memories = []
    for m1, m2 in pairs:
        all_memories.extend([m1, m2])
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts(all_memories)
    
    if len(conflicts) < 2:
        # En az 2 çelişki gerekli
        return
    
    # Özellik: H(x,ψ) puanına göre azalan sırada
    for i in range(len(conflicts) - 1):
        current_max_score = max(conflicts[i].score1, conflicts[i].score2)
        next_max_score = max(conflicts[i + 1].score1, conflicts[i + 1].score2)
        
        assert current_max_score >= next_max_score, \
            f"Çelişkiler sıralı değil: {current_max_score} < {next_max_score}"


@settings(max_examples=100)
@given(pair=conflicting_memory_pair_strategy())
@pytest.mark.asyncio
async def test_property_46_h_score_calculation(pair):
    """
    Özellik 46: H(x,ψ) Puanı Hesaplama
    
    *Her* çelişki için,
    H(x,ψ) puanı doğru hesaplanmalıdır.
    
    **Validates: Requirements 18.3**
    
    Özellik:
    - H(x,ψ) ∈ [0, 1]
    - score1 ve score2 hesaplanmış
    """
    resolver = ConflictResolver()
    m1, m2 = pair
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) == 0:
        return
    
    conflict = conflicts[0]
    
    # Özellik: H(x,ψ) ∈ [0, 1]
    assert 0.0 <= conflict.score1 <= 1.0, f"score1 aralık dışı: {conflict.score1}"
    assert 0.0 <= conflict.score2 <= 1.0, f"score2 aralık dışı: {conflict.score2}"


# ============================================================================
# Özellik 47: Çelişki Birleştirme
# **Validates: Requirements 18.6, 18.7**
# ============================================================================

@settings(max_examples=100)
@given(pair=conflicting_memory_pair_strategy())
@pytest.mark.asyncio
async def test_property_47_conflict_merge(pair):
    """
    Özellik 47: Çelişki Birleştirme
    
    *Her* birleştirme işlemi için,
    sonuç bellek her iki kaynağın bilgilerini içermeli ve
    kaynak ID'leri ile işaretlenmelidir.
    
    **Validates: Requirements 18.6, 18.7**
    
    Özellik:
    - Merged memory her iki kaynağı içerir
    - sourceIds metadata'da kayıtlı
    - İçerik birleştirilmiş
    """
    resolver = ConflictResolver()
    m1, m2 = pair
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) == 0:
        return
    
    conflict = conflicts[0]
    
    # Birleştir
    merged = await resolver.resolveConflict(conflict, 'merge')
    
    # Özellik 1: Kaynak ID'leri metadata'da
    assert 'sourceIds' in merged.metadata, "sourceIds metadata'da yok"
    assert m1.id in merged.metadata['sourceIds'], f"m1.id ({m1.id}) sourceIds'de yok"
    assert m2.id in merged.metadata['sourceIds'], f"m2.id ({m2.id}) sourceIds'de yok"
    
    # Özellik 2: İçerik birleştirilmiş
    assert isinstance(merged.content, dict), "Merged content dict olmalı"
    assert 'source1' in merged.content, "source1 içerikte yok"
    assert 'source2' in merged.content, "source2 içerikte yok"
    assert merged.content['merged'] is True, "merged flag yok"
    
    # Özellik 3: Timestamp en yeni
    assert merged.timestamp == max(m1.timestamp, m2.timestamp), "Timestamp en yeni değil"
    
    # Özellik 4: AccessCount toplamı
    assert merged.accessCount == m1.accessCount + m2.accessCount, "AccessCount toplamı yanlış"
    
    # Özellik 5: Importance maksimum
    assert merged.importance == max(m1.importance, m2.importance), "Importance maksimum değil"


@settings(max_examples=100)
@given(
    pair=conflicting_memory_pair_strategy(),
    resolution=st.sampled_from(['keep1', 'keep2', 'merge', 'ignore'])
)
@pytest.mark.asyncio
async def test_property_47_resolution_strategies(pair, resolution):
    """
    Özellik 47: Çözüm Stratejileri
    
    *Her* çözüm stratejisi için,
    doğru bellek döndürülmelidir.
    
    **Validates: Requirements 18.6, 18.7**
    """
    resolver = ConflictResolver()
    m1, m2 = pair
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) == 0:
        return
    
    conflict = conflicts[0]
    
    # Çözümle
    result = await resolver.resolveConflict(conflict, resolution)
    
    # Özellik: Doğru strateji uygulandı
    if resolution == 'keep1':
        assert result.id == conflict.memory1.id, "keep1 stratejisi yanlış"
    elif resolution == 'keep2':
        assert result.id == conflict.memory2.id, "keep2 stratejisi yanlış"
    elif resolution == 'merge':
        assert 'sourceIds' in result.metadata, "merge stratejisi yanlış"
    elif resolution == 'ignore':
        assert result.id == conflict.memory1.id, "ignore stratejisi yanlış"


# ============================================================================
# Özellik 48: Çelişki Geçmişi
# **Validates: Requirements 18.8, 18.9**
# ============================================================================

@settings(max_examples=100)
@given(
    pairs=st.lists(conflicting_memory_pair_strategy(), min_size=1, max_size=3),
    resolutions=st.lists(st.sampled_from(['keep1', 'keep2', 'merge', 'ignore']), min_size=1, max_size=3)
)
@pytest.mark.asyncio
async def test_property_48_conflict_history(pairs, resolutions):
    """
    Özellik 48: Çelişki Geçmişi
    
    *Her* çözülen çelişki için,
    çözüm kararı geçmişe kaydedilmelidir.
    
    **Validates: Requirements 18.8, 18.9**
    
    Özellik:
    - Her çözüm history'ye eklenir
    - conflictId, resolution, resolvedAt, resolvedBy kayıtlı
    """
    resolver = ConflictResolver()
    
    # Her çifti çöz
    resolved_count = 0
    for i, (m1, m2) in enumerate(pairs):
        if i >= len(resolutions):
            break
        
        # Çelişki tespit et
        conflicts = await resolver.detectConflicts([m1, m2])
        
        if len(conflicts) == 0:
            continue
        
        conflict = conflicts[0]
        resolution = resolutions[i]
        
        # Çözümle
        await resolver.resolveConflict(conflict, resolution)
        resolved_count += 1
    
    # Özellik: Geçmiş kaydedildi
    history = resolver.getConflictHistory()
    assert len(history) == resolved_count, f"History count yanlış: {len(history)} != {resolved_count}"
    
    # Her history entry doğru mu
    for entry in history:
        assert entry.conflictId is not None, "conflictId yok"
        assert entry.resolution in ['keep1', 'keep2', 'merge', 'ignore'], "resolution geçersiz"
        assert entry.resolvedAt > 0, "resolvedAt yok"
        assert entry.resolvedBy in ['user', 'auto'], "resolvedBy geçersiz"


@settings(max_examples=100)
@given(pair=conflicting_memory_pair_strategy())
@pytest.mark.asyncio
async def test_property_48_history_persistence(pair):
    """
    Özellik 48: Geçmiş Kalıcılığı
    
    *Her* çözüm sonrası,
    geçmiş verisi erişilebilir olmalıdır.
    
    **Validates: Requirements 18.8, 18.9**
    """
    resolver = ConflictResolver()
    m1, m2 = pair
    
    # Çelişki tespit et
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) == 0:
        return
    
    conflict = conflicts[0]
    
    # Çözümle
    await resolver.resolveConflict(conflict, 'merge')
    
    # Özellik: Geçmiş erişilebilir
    history = resolver.getConflictHistory()
    assert len(history) > 0, "History boş"
    
    # Son entry doğru mu
    last_entry = history[-1]
    assert last_entry.conflictId == conflict.id, "conflictId eşleşmiyor"
    assert last_entry.resolution == 'merge', "resolution eşleşmiyor"


# ============================================================================
# Edge Cases & Integration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_empty_memory_list():
    """Edge case: Boş bellek listesi"""
    resolver = ConflictResolver()
    conflicts = await resolver.detectConflicts([])
    assert len(conflicts) == 0, "Boş liste için çelişki bulunmamalı"


@pytest.mark.asyncio
async def test_single_memory():
    """Edge case: Tek bellek"""
    resolver = ConflictResolver()
    memory = MemoryData(
        id='test1',
        type='conversation',
        scope='global',
        timestamp=int(datetime.now().timestamp() * 1000),
        lastAccessed=int(datetime.now().timestamp() * 1000),
        metadata={},
        content='test content'
    )
    conflicts = await resolver.detectConflicts([memory])
    assert len(conflicts) == 0, "Tek bellek için çelişki bulunmamalı"


@pytest.mark.asyncio
async def test_identical_memories():
    """Edge case: Aynı bellekler (duplicate)"""
    resolver = ConflictResolver()
    
    now = int(datetime.now().timestamp() * 1000)
    m1 = MemoryData(
        id='test1',
        type='conversation',
        scope='global',
        timestamp=now,
        lastAccessed=now,
        metadata={},
        content='identical content for testing'
    )
    
    m2 = MemoryData(
        id='test2',
        type='conversation',
        scope='global',
        timestamp=now,
        lastAccessed=now,
        metadata={},
        content='identical content for testing'
    )
    
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) > 0:
        # Duplicate olarak tespit edilmeli
        assert conflicts[0].type == 'duplicate', "Aynı içerik duplicate olmalı"


@pytest.mark.asyncio
async def test_conflict_status_update():
    """Integration: Çelişki durumu güncelleme"""
    resolver = ConflictResolver()
    
    now = int(datetime.now().timestamp() * 1000)
    m1 = MemoryData(
        id='test1',
        type='conversation',
        scope='global',
        timestamp=now,
        lastAccessed=now,
        metadata={},
        content='authentication is enabled and working correctly'
    )
    
    m2 = MemoryData(
        id='test2',
        type='conversation',
        scope='global',
        timestamp=now,
        lastAccessed=now,
        metadata={},
        content='authentication is disabled and not working correctly'
    )
    
    conflicts = await resolver.detectConflicts([m1, m2])
    
    if len(conflicts) > 0:
        conflict = conflicts[0]
        assert conflict.status == 'pending', "İlk durum pending olmalı"
        
        # Çözümle
        await resolver.resolveConflict(conflict, 'merge')
        assert conflict.status == 'resolved', "Çözüm sonrası resolved olmalı"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
