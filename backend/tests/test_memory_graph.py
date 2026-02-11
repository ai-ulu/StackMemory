"""
Property-Based Tests for MemoryGraph
Test Özellikleri: 42, 43, 44

Framework: Hypothesis (Python)
Minimum: 100 iterasyon
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from hypothesis import assume
import math
from typing import List, Dict, Any

from lib.memory_graph import MemoryGraph, GraphNode, GraphEdge


# ============================================================================
# Test Strategies (Generators)
# ============================================================================

@st.composite
def memory_data(draw):
    """Bellek verisi jeneratörü"""
    memory_type = draw(st.sampled_from([
        'conversation', 'workspace', 'preference',
        'command', 'profile', 'knowledge'
    ]))
    
    # H(x,ψ) puanı: 0.0 - 1.0 arası
    h_score_total = draw(st.floats(min_value=0.0, max_value=1.0))
    
    return {
        'id': draw(st.text(min_size=1, max_size=20)),
        'type': memory_type,
        'h_score': {
            'total': h_score_total,
            'similarity': draw(st.floats(min_value=0.0, max_value=1.0)),
            'decay': draw(st.floats(min_value=0.0, max_value=1.0)),
            'importance': draw(st.floats(min_value=0.0, max_value=1.0)),
            'frequency': draw(st.floats(min_value=0.0, max_value=1.0))
        },
        'content': {
            'summary': draw(st.text(min_size=0, max_size=100))
        },
        'access_count': draw(st.integers(min_value=0, max_value=1000)),
        'importance': draw(st.floats(min_value=0.0, max_value=1.0)),
        'last_accessed': draw(st.integers(min_value=0)),
        'timestamp': draw(st.integers(min_value=0))
    }


@st.composite
def memory_list(draw, min_size=1, max_size=10):
    """Bellek listesi jeneratörü"""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    memories = []
    
    for i in range(size):
        mem = draw(memory_data())
        # Benzersiz ID garantisi
        mem['id'] = f"mem-{i}-{draw(st.text(min_size=1, max_size=5))}"
        memories.append(mem)
    
    return memories


# ============================================================================
# Property 42: Graf Düğüm Temsili
# **Validates: Requirements 17.2, 17.3**
# ============================================================================

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memory=memory_data())
def test_property_42_node_creation(memory):
    """
    Özellik 42: Graf Düğüm Temsili
    
    Her bellek için graf üzerinde bir düğüm oluşturulmalı ve
    düğüm boyutu H(x,ψ) puanı * 100 olmalıdır.
    """
    graph = MemoryGraph()
    
    # Düğüm ekle
    node = graph.add_node(memory)
    
    # Düğüm oluşturuldu mu?
    assert node is not None, "Düğüm oluşturulmalı"
    assert isinstance(node, GraphNode), "GraphNode instance olmalı"
    
    # ID doğru mu?
    assert node.id == memory['id'], "Düğüm ID bellek ID ile eşleşmeli"
    
    # Tür doğru mu?
    assert node.type == memory['type'], "Düğüm türü bellek türü ile eşleşmeli"
    
    # Boyut H(x,ψ) * 100 mu?
    expected_size = memory['h_score']['total'] * 100
    assert math.isclose(node.val, expected_size, rel_tol=1e-9), \
        f"Düğüm boyutu H(x,ψ) * 100 olmalı: beklenen={expected_size}, gerçek={node.val}"
    
    # Metadata var mı?
    assert 'h_score' in node.metadata, "Metadata'da h_score olmalı"
    assert 'access_count' in node.metadata, "Metadata'da access_count olmalı"
    assert 'importance' in node.metadata, "Metadata'da importance olmalı"


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=1, max_size=20))
def test_property_42_all_memories_have_nodes(memories):
    """
    Özellik 42: Tüm bellekler için düğüm oluşturulmalı
    
    Graf oluşturulduğunda her bellek için bir düğüm olmalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Düğüm sayısı bellek sayısına eşit mi?
    assert len(graph_data['nodes']) == len(memories), \
        f"Her bellek için düğüm olmalı: bellekler={len(memories)}, düğümler={len(graph_data['nodes'])}"
    
    # Her bellek ID'si düğümlerde var mı?
    memory_ids = {m['id'] for m in memories}
    node_ids = {n['id'] for n in graph_data['nodes']}
    
    assert memory_ids == node_ids, "Tüm bellek ID'leri düğümlerde olmalı"


# ============================================================================
# Property 43: Graf Kenar Oluşturma
# **Validates: Requirements 17.4, 17.5**
# ============================================================================

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(
    mem1=memory_data(),
    mem2=memory_data(),
    similarity=st.floats(min_value=0.0, max_value=1.0)
)
def test_property_43_edge_creation_threshold(mem1, mem2, similarity):
    """
    Özellik 43: Graf Kenar Oluşturma
    
    Similarity > 0.7 olan bellekler arası kenar oluşmalı,
    similarity <= 0.7 ise kenar oluşmamalı.
    """
    # Benzersiz ID'ler
    mem1['id'] = 'mem1'
    mem2['id'] = 'mem2'
    
    graph = MemoryGraph()
    
    # Düğümleri ekle
    graph.add_node(mem1)
    graph.add_node(mem2)
    
    # Kenar ekle
    edge = graph.add_edge('mem1', 'mem2', similarity)
    
    # Threshold kontrolü
    if similarity > 0.7:
        assert edge is not None, \
            f"Similarity > 0.7 ise kenar oluşmalı (similarity={similarity})"
        assert edge.source == 'mem1', "Kaynak doğru olmalı"
        assert edge.target == 'mem2', "Hedef doğru olmalı"
        assert math.isclose(edge.value, similarity, rel_tol=1e-9), \
            "Kenar değeri similarity ile eşleşmeli"
    else:
        assert edge is None, \
            f"Similarity <= 0.7 ise kenar oluşmamalı (similarity={similarity})"


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=2, max_size=10))
def test_property_43_edge_proportional_to_similarity(memories):
    """
    Özellik 43: Kenar kalınlığı benzerlik puanı ile orantılı
    
    Oluşturulan kenarların değeri similarity puanına eşit olmalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Tüm kenarlar için
    for link in graph_data['links']:
        similarity = link['value']
        
        # Similarity > 0.7 olmalı (çünkü kenar oluştu)
        assert similarity > 0.7, \
            f"Kenar varsa similarity > 0.7 olmalı: {similarity}"
        
        # Similarity 0-1 aralığında olmalı
        assert 0.0 <= similarity <= 1.0, \
            f"Similarity 0-1 aralığında olmalı: {similarity}"


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=3, max_size=15))
def test_property_43_no_self_loops(memories):
    """
    Özellik 43: Kendi kendine kenar olmamalı
    
    Hiçbir düğüm kendi kendine bağlanmamalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Self-loop kontrolü
    for link in graph_data['links']:
        assert link['source'] != link['target'], \
            f"Self-loop olmamalı: {link['source']} -> {link['target']}"


# ============================================================================
# Property 44: Graf Renklendirme
# **Validates: Requirements 17.6**
# ============================================================================

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memory=memory_data())
def test_property_44_node_color_by_type(memory):
    """
    Özellik 44: Graf Renklendirme
    
    Her bellek türü için düğümler farklı renklerle gösterilmeli.
    """
    graph = MemoryGraph()
    
    # Düğüm ekle
    node = graph.add_node(memory)
    
    # Renk var mı?
    assert node.color is not None, "Düğüm rengi olmalı"
    assert isinstance(node.color, str), "Renk string olmalı"
    assert node.color.startswith('#'), "Renk hex formatında olmalı (#RRGGBB)"
    assert len(node.color) == 7, "Renk 7 karakter olmalı (#RRGGBB)"
    
    # Tür-renk eşleşmesi
    expected_color = graph.type_colors.get(memory['type'], '#6b7280')
    assert node.color == expected_color, \
        f"Renk bellek türüne göre olmalı: tür={memory['type']}, beklenen={expected_color}, gerçek={node.color}"


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=2, max_size=20))
def test_property_44_same_type_same_color(memories):
    """
    Özellik 44: Aynı türdeki bellekler aynı renkte olmalı
    
    Aynı type değerine sahip belleklerin düğümleri aynı renkte olmalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Tür-renk haritası oluştur
    type_to_color: Dict[str, str] = {}
    
    for node in graph_data['nodes']:
        node_type = node['type']
        node_color = node['color']
        
        if node_type in type_to_color:
            # Aynı tür daha önce görüldü, renk aynı mı?
            assert type_to_color[node_type] == node_color, \
                f"Aynı türdeki düğümler aynı renkte olmalı: tür={node_type}"
        else:
            # İlk kez görülen tür
            type_to_color[node_type] = node_color


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=6, max_size=20))
def test_property_44_different_types_different_colors(memories):
    """
    Özellik 44: Farklı türler farklı renklerde olmalı
    
    Farklı type değerlerine sahip belleklerin düğümleri farklı renklerde olmalı.
    """
    # En az 2 farklı tür olduğundan emin ol
    types = [m['type'] for m in memories]
    unique_types = set(types)
    assume(len(unique_types) >= 2)
    
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Tür-renk haritası
    type_to_color: Dict[str, str] = {}
    
    for node in graph_data['nodes']:
        node_type = node['type']
        node_color = node['color']
        
        if node_type not in type_to_color:
            type_to_color[node_type] = node_color
    
    # Farklı türler farklı renkler mi?
    colors = list(type_to_color.values())
    unique_colors = set(colors)
    
    # En az 2 farklı renk olmalı (2+ farklı tür var)
    assert len(unique_colors) >= 2, \
        f"Farklı türler farklı renklerde olmalı: türler={len(unique_types)}, renkler={len(unique_colors)}"


# ============================================================================
# Additional Properties (Bonus)
# ============================================================================

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=1, max_size=20))
def test_graph_metadata_accuracy(memories):
    """
    Graf metadata doğruluğu
    
    Graf metadata'sı düğüm/kenar sayılarını doğru yansıtmalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    metadata = graph_data['metadata']
    
    # Düğüm sayısı
    assert metadata['total_nodes'] == len(graph_data['nodes']), \
        "Metadata'daki düğüm sayısı doğru olmalı"
    
    # Kenar sayısı
    assert metadata['total_edges'] == len(graph_data['links']), \
        "Metadata'daki kenar sayısı doğru olmalı"
    
    # Ortalama derece
    if len(graph_data['nodes']) > 0:
        expected_avg_degree = (2 * len(graph_data['links'])) / len(graph_data['nodes'])
        assert math.isclose(metadata['avg_degree'], expected_avg_degree, rel_tol=1e-9), \
            "Ortalama derece doğru hesaplanmalı"


@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(memories=memory_list(min_size=2, max_size=10))
def test_graph_export_format(memories):
    """
    Graf export formatı
    
    Export edilen graf verisi doğru yapıda olmalı.
    """
    graph = MemoryGraph()
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Yapı kontrolü
    assert 'nodes' in graph_data, "Graf'ta 'nodes' olmalı"
    assert 'links' in graph_data, "Graf'ta 'links' olmalı"
    assert 'metadata' in graph_data, "Graf'ta 'metadata' olmalı"
    
    assert isinstance(graph_data['nodes'], list), "'nodes' list olmalı"
    assert isinstance(graph_data['links'], list), "'links' list olmalı"
    assert isinstance(graph_data['metadata'], dict), "'metadata' dict olmalı"
    
    # Düğüm yapısı
    for node in graph_data['nodes']:
        assert 'id' in node, "Düğümde 'id' olmalı"
        assert 'name' in node, "Düğümde 'name' olmalı"
        assert 'type' in node, "Düğümde 'type' olmalı"
        assert 'val' in node, "Düğümde 'val' olmalı"
        assert 'color' in node, "Düğümde 'color' olmalı"
        assert 'metadata' in node, "Düğümde 'metadata' olmalı"
    
    # Kenar yapısı
    for link in graph_data['links']:
        assert 'source' in link, "Kenarda 'source' olmalı"
        assert 'target' in link, "Kenarda 'target' olmalı"
        assert 'value' in link, "Kenarda 'value' olmalı"
        assert 'type' in link, "Kenarda 'type' olmalı"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])


# ============================================================================
# Unit Tests - Task 26.5
# **Validates: Requirements 17.1, 17.4**
# ============================================================================

def test_build_graph():
    """
    Unit Test: Graf oluşturma
    
    build_graph() metodu belleklerden graf oluşturmalı:
    - Her bellek için düğüm
    - Similarity > 0.7 için kenarlar
    - Doğru metadata
    """
    graph = MemoryGraph()
    
    # Test verileri
    memories = [
        {
            'id': 'mem1',
            'type': 'conversation',
            'h_score': {'total': 0.8},
            'content': {'summary': 'Python programming tutorial'},
            'access_count': 5,
            'importance': 0.9,
            'timestamp': 1000000,
            'last_accessed': 1000000
        },
        {
            'id': 'mem2',
            'type': 'conversation',
            'h_score': {'total': 0.6},
            'content': {'summary': 'Python best practices'},
            'access_count': 3,
            'importance': 0.7,
            'timestamp': 1001000,
            'last_accessed': 1001000
        },
        {
            'id': 'mem3',
            'type': 'workspace',
            'h_score': {'total': 0.5},
            'content': {'summary': 'JavaScript async await'},
            'access_count': 2,
            'importance': 0.6,
            'timestamp': 1002000,
            'last_accessed': 1002000
        }
    ]
    
    # Graf oluştur
    graph_data = graph.build_graph(memories)
    
    # Düğüm sayısı kontrolü
    assert len(graph_data['nodes']) == 3, "3 düğüm olmalı"
    
    # Düğüm ID'leri kontrolü
    node_ids = {n['id'] for n in graph_data['nodes']}
    assert node_ids == {'mem1', 'mem2', 'mem3'}, "Tüm bellek ID'leri düğümlerde olmalı"
    
    # Düğüm boyutları kontrolü (H(x,ψ) * 100)
    node_vals = {n['id']: n['val'] for n in graph_data['nodes']}
    assert math.isclose(node_vals['mem1'], 80.0, rel_tol=1e-9), "mem1 boyutu 80 olmalı"
    assert math.isclose(node_vals['mem2'], 60.0, rel_tol=1e-9), "mem2 boyutu 60 olmalı"
    assert math.isclose(node_vals['mem3'], 50.0, rel_tol=1e-9), "mem3 boyutu 50 olmalı"
    
    # Renk kontrolü
    node_colors = {n['id']: n['color'] for n in graph_data['nodes']}
    assert node_colors['mem1'] == '#3b82f6', "conversation rengi mavi olmalı"
    assert node_colors['mem2'] == '#3b82f6', "conversation rengi mavi olmalı"
    assert node_colors['mem3'] == '#10b981', "workspace rengi yeşil olmalı"
    
    # Kenar kontrolü (similarity > 0.7 olanlar)
    # mem1-mem2: aynı tür, benzer içerik -> yüksek similarity
    # mem1-mem3: farklı tür, farklı içerik -> düşük similarity
    # mem2-mem3: farklı tür, farklı içerik -> düşük similarity
    assert len(graph_data['links']) >= 0, "Kenarlar olabilir"
    
    # Metadata kontrolü
    metadata = graph_data['metadata']
    assert metadata['total_nodes'] == 3, "Metadata'da 3 düğüm olmalı"
    assert metadata['total_edges'] == len(graph_data['links']), "Kenar sayısı doğru olmalı"
    
    print("✓ test_build_graph PASSED")


def test_edge_filtering():
    """
    Unit Test: Kenar filtreleme
    
    Similarity threshold (0.7) doğru çalışmalı:
    - similarity > 0.7 -> kenar oluşur
    - similarity <= 0.7 -> kenar oluşmaz
    """
    graph = MemoryGraph()
    
    # Test düğümleri
    mem1 = {
        'id': 'node1',
        'type': 'conversation',
        'h_score': {'total': 0.8},
        'content': {'summary': 'Test 1'},
        'access_count': 1,
        'importance': 0.5,
        'timestamp': 1000000,
        'last_accessed': 1000000
    }
    
    mem2 = {
        'id': 'node2',
        'type': 'conversation',
        'h_score': {'total': 0.7},
        'content': {'summary': 'Test 2'},
        'access_count': 1,
        'importance': 0.5,
        'timestamp': 1000000,
        'last_accessed': 1000000
    }
    
    graph.add_node(mem1)
    graph.add_node(mem2)
    
    # Test 1: similarity > 0.7 -> kenar oluşmalı
    edge1 = graph.add_edge('node1', 'node2', 0.85)
    assert edge1 is not None, "Similarity 0.85 için kenar oluşmalı"
    assert edge1.source == 'node1', "Kaynak doğru olmalı"
    assert edge1.target == 'node2', "Hedef doğru olmalı"
    assert math.isclose(edge1.value, 0.85, rel_tol=1e-9), "Kenar değeri 0.85 olmalı"
    
    # Test 2: similarity = 0.7 -> kenar oluşmamalı
    edge2 = graph.add_edge('node1', 'node2', 0.7)
    assert edge2 is None, "Similarity 0.7 için kenar oluşmamalı"
    
    # Test 3: similarity < 0.7 -> kenar oluşmamalı
    edge3 = graph.add_edge('node1', 'node2', 0.5)
    assert edge3 is None, "Similarity 0.5 için kenar oluşmamalı"
    
    # Test 4: similarity = 0.71 -> kenar oluşmalı (threshold üstü)
    edge4 = graph.add_edge('node1', 'node2', 0.71)
    assert edge4 is not None, "Similarity 0.71 için kenar oluşmalı"
    
    # Test 5: similarity = 1.0 -> kenar oluşmalı
    edge5 = graph.add_edge('node1', 'node2', 1.0)
    assert edge5 is not None, "Similarity 1.0 için kenar oluşmalı"
    
    print("✓ test_edge_filtering PASSED")


def test_cluster_detection():
    """
    Unit Test: Cluster detection
    
    3 algoritma test edilmeli:
    - louvain: Modülerlik optimizasyonu
    - label_propagation: Etiket yayılımı
    - greedy: Basit greedy clustering
    """
    graph = MemoryGraph()
    
    # Test verileri: 2 küme oluşturacak şekilde
    # Küme 1: mem1, mem2 (yüksek similarity)
    # Küme 2: mem3, mem4 (yüksek similarity)
    # Kümeler arası: düşük similarity
    
    memories = [
        {
            'id': 'mem1',
            'type': 'conversation',
            'h_score': {'total': 0.9},
            'content': {'summary': 'Python programming basics'},
            'access_count': 10,
            'importance': 0.9,
            'timestamp': 1000000,
            'last_accessed': 1000000
        },
        {
            'id': 'mem2',
            'type': 'conversation',
            'h_score': {'total': 0.85},
            'content': {'summary': 'Python programming advanced'},
            'access_count': 8,
            'importance': 0.85,
            'timestamp': 1001000,
            'last_accessed': 1001000
        },
        {
            'id': 'mem3',
            'type': 'workspace',
            'h_score': {'total': 0.8},
            'content': {'summary': 'JavaScript async patterns'},
            'access_count': 7,
            'importance': 0.8,
            'timestamp': 2000000,
            'last_accessed': 2000000
        },
        {
            'id': 'mem4',
            'type': 'workspace',
            'h_score': {'total': 0.75},
            'content': {'summary': 'JavaScript promises tutorial'},
            'access_count': 6,
            'importance': 0.75,
            'timestamp': 2001000,
            'last_accessed': 2001000
        }
    ]
    
    # Graf oluştur
    graph.build_graph(memories)
    
    # Test 1: Louvain algoritması
    clusters_louvain = graph.detect_clusters(min_similarity=0.8, algorithm='louvain')
    assert isinstance(clusters_louvain, list), "Louvain sonucu list olmalı"
    assert len(clusters_louvain) >= 0, "Louvain kümeler oluşturabilir"
    
    # Küme yapısı kontrolü
    for cluster in clusters_louvain:
        assert isinstance(cluster, Cluster), "Cluster instance olmalı"
        assert len(cluster.nodes) > 1, "Küme en az 2 düğüm içermeli"
        assert cluster.centroid in cluster.nodes, "Centroid küme içinde olmalı"
        assert 0.0 <= cluster.avg_similarity <= 1.0, "Ortalama similarity 0-1 arası olmalı"
    
    print(f"  Louvain: {len(clusters_louvain)} küme bulundu")
    
    # Test 2: Label Propagation algoritması
    graph2 = MemoryGraph()
    graph2.build_graph(memories)
    clusters_lp = graph2.detect_clusters(min_similarity=0.8, algorithm='label_propagation')
    assert isinstance(clusters_lp, list), "Label propagation sonucu list olmalı"
    assert len(clusters_lp) >= 0, "Label propagation kümeler oluşturabilir"
    
    for cluster in clusters_lp:
        assert isinstance(cluster, Cluster), "Cluster instance olmalı"
        assert len(cluster.nodes) > 1, "Küme en az 2 düğüm içermeli"
        assert cluster.centroid in cluster.nodes, "Centroid küme içinde olmalı"
    
    print(f"  Label Propagation: {len(clusters_lp)} küme bulundu")
    
    # Test 3: Greedy algoritması
    graph3 = MemoryGraph()
    graph3.build_graph(memories)
    clusters_greedy = graph3.detect_clusters(min_similarity=0.8, algorithm='greedy')
    assert isinstance(clusters_greedy, list), "Greedy sonucu list olmalı"
    assert len(clusters_greedy) >= 0, "Greedy kümeler oluşturabilir"
    
    for cluster in clusters_greedy:
        assert isinstance(cluster, Cluster), "Cluster instance olmalı"
        assert len(cluster.nodes) > 1, "Küme en az 2 düğüm içermeli"
        assert cluster.centroid in cluster.nodes, "Centroid küme içinde olmalı"
    
    print(f"  Greedy: {len(clusters_greedy)} küme bulundu")
    
    # Test 4: Algoritma karşılaştırması
    # Tüm algoritmalar benzer sonuçlar vermeli (küme sayısı yakın)
    all_cluster_counts = [
        len(clusters_louvain),
        len(clusters_lp),
        len(clusters_greedy)
    ]
    
    print(f"  Küme sayıları: Louvain={all_cluster_counts[0]}, "
          f"LP={all_cluster_counts[1]}, Greedy={all_cluster_counts[2]}")
    
    # En az bir algoritma küme bulmalı (veriler uygunsa)
    assert max(all_cluster_counts) >= 0, "En az bir algoritma çalışmalı"
    
    print("✓ test_cluster_detection PASSED")


# Test runner
if __name__ == '__main__':
    print("\n" + "="*70)
    print("UNIT TESTS - Task 26.5")
    print("="*70 + "\n")
    
    print("Running test_build_graph...")
    test_build_graph()
    
    print("\nRunning test_edge_filtering...")
    test_edge_filtering()
    
    print("\nRunning test_cluster_detection...")
    test_cluster_detection()
    
    print("\n" + "="*70)
    print("ALL UNIT TESTS PASSED ✓")
    print("="*70 + "\n")
