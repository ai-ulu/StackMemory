"""
Memory Graph - Bellekler arası ilişkileri görselleştirme
H(x,ψ) puanlama sistemi ile entegre graf yapısı
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import json
import math


@dataclass
class GraphNode:
    """Graf düğümü - bir belleği temsil eder"""
    id: str
    name: str
    type: str  # conversation, workspace, preference, vb.
    val: float  # H(x,ψ) puanı * 100 (düğüm boyutu)
    color: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    """Graf kenarı - iki bellek arası ilişki"""
    source: str
    target: str
    value: float  # Benzerlik puanı (0-1)
    type: str = 'semantic'  # semantic, temporal, contextual


@dataclass
class Cluster:
    """Bellek kümesi - benzer belleklerin grubu"""
    id: str
    nodes: List[str]
    centroid: str
    avg_similarity: float
    topic: Optional[str] = None


class MemoryGraph:
    """
    Bellek grafiği - bellekler arası ilişkileri yönetir
    
    Özellikler:
    - Düğüm boyutu H(x,ψ) puanına göre
    - Kenar oluşturma similarity > 0.7
    - Renklendirme bellek türüne göre
    - Cluster detection
    """
    
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.clusters: List[Cluster] = []
        
        # Bellek türü renk haritası
        self.type_colors = {
            'conversation': '#3b82f6',  # Blue
            'workspace': '#10b981',     # Green
            'preference': '#f59e0b',    # Amber
            'command': '#8b5cf6',       # Purple
            'profile': '#ec4899',       # Pink
            'knowledge': '#06b6d4'      # Cyan
        }
    
    def add_node(self, memory: Dict[str, Any]) -> GraphNode:
        """
        Bellek için graf düğümü ekle
        
        Args:
            memory: Bellek verisi (id, type, h_score, vb.)
        
        Returns:
            GraphNode: Oluşturulan düğüm
        """
        memory_id = memory.get('id', '')
        memory_type = memory.get('type', 'unknown')
        h_score = memory.get('h_score', {})
        
        # H(x,ψ) puanını al (varsayılan 0.5)
        total_score = h_score.get('total', 0.5)
        
        # Düğüm boyutu: H(x,ψ) * 100
        node_size = total_score * 100
        
        # Renk: bellek türüne göre
        color = self.type_colors.get(memory_type, '#6b7280')
        
        # Düğüm ismi: content'ten al (string veya dict olabilir)
        content = memory.get('content', '')
        if isinstance(content, dict):
            node_name = content.get('summary', memory_id[:20])
        elif isinstance(content, str):
            node_name = content[:30] if len(content) > 30 else content
        else:
            node_name = memory_id[:20]
        
        # Düğüm oluştur
        node = GraphNode(
            id=memory_id,
            name=node_name,
            type=memory_type,
            val=node_size,
            color=color,
            metadata={
                'h_score': h_score,
                'access_count': memory.get('access_count', 0),
                'importance': memory.get('importance', 0.5),
                'last_accessed': memory.get('last_accessed', 0),
                'timestamp': memory.get('timestamp', 0)
            }
        )
        
        self.nodes[memory_id] = node
        return node
    
    def add_edge(
        self, 
        source: str, 
        target: str, 
        similarity: float,
        edge_type: str = 'semantic'
    ) -> Optional[GraphEdge]:
        """
        İki düğüm arası kenar ekle
        
        Args:
            source: Kaynak düğüm ID
            target: Hedef düğüm ID
            similarity: Benzerlik puanı (0-1)
            edge_type: Kenar türü
        
        Returns:
            GraphEdge veya None (similarity <= 0.7 ise)
        """
        # Similarity threshold: 0.7 (exclusive)
        if similarity <= 0.7:
            return None
        
        # Düğümler var mı kontrol et
        if source not in self.nodes or target not in self.nodes:
            return None
        
        # Kenar oluştur
        edge = GraphEdge(
            source=source,
            target=target,
            value=similarity,
            type=edge_type
        )
        
        self.edges.append(edge)
        return edge
    
    def build_graph(self, memories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Belleklerden graf oluştur
        
        Args:
            memories: Bellek listesi
        
        Returns:
            Graf verisi (nodes, links, metadata)
        """
        # Düğümleri ekle
        for memory in memories:
            self.add_node(memory)
        
        # Kenarları oluştur (benzerlik hesapla)
        for i, mem1 in enumerate(memories):
            for mem2 in memories[i+1:]:
                similarity = self._calculate_similarity(mem1, mem2)
                if similarity >= 0.7:
                    self.add_edge(mem1['id'], mem2['id'], similarity)
        
        # Graf verisini döndür
        return self.export_graph()
    
    def _calculate_similarity(
        self, 
        mem1: Dict[str, Any], 
        mem2: Dict[str, Any]
    ) -> float:
        """
        İki bellek arası benzerlik hesapla
        
        Faktörler:
        - İçerik benzerliği (basit kelime eşleşmesi)
        - Tür benzerliği
        - Zaman yakınlığı
        
        Args:
            mem1, mem2: Bellek verileri
        
        Returns:
            Benzerlik puanı (0-1)
        """
        # İçerik benzerliği (basit)
        content1 = str(mem1.get('content', '')).lower()
        content2 = str(mem2.get('content', '')).lower()
        
        words1 = set(content1.split())
        words2 = set(content2.split())
        
        if not words1 or not words2:
            content_sim = 0.0
        else:
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            content_sim = intersection / union if union > 0 else 0.0
        
        # Tür benzerliği
        type_sim = 1.0 if mem1.get('type') == mem2.get('type') else 0.3
        
        # Zaman yakınlığı
        time1 = mem1.get('timestamp', 0)
        time2 = mem2.get('timestamp', 0)
        time_diff_days = abs(time1 - time2) / (24 * 3600 * 1000)  # ms to days
        time_sim = math.exp(-time_diff_days / 30)  # 30 günlük decay
        
        # Ağırlıklı ortalama
        similarity = (
            0.5 * content_sim +
            0.3 * type_sim +
            0.2 * time_sim
        )
        
        return similarity
    
    def detect_clusters(
        self, 
        min_similarity: float = 0.8,
        algorithm: str = 'louvain'
    ) -> List[Cluster]:
        """
        Graf üzerinde küme tespiti (gelişmiş algoritmalar)
        
        Algoritmalar:
        - louvain: Louvain community detection (modülerlik optimizasyonu)
        - label_propagation: Label propagation (hızlı, basit)
        - greedy: Basit greedy clustering
        
        Args:
            min_similarity: Minimum benzerlik eşiği
            algorithm: Kullanılacak algoritma
        
        Returns:
            Cluster listesi
        """
        if algorithm == 'louvain':
            return self._detect_clusters_louvain(min_similarity)
        elif algorithm == 'label_propagation':
            return self._detect_clusters_label_propagation(min_similarity)
        else:
            return self._detect_clusters_greedy(min_similarity)
    
    def _detect_clusters_louvain(self, min_similarity: float) -> List[Cluster]:
        """
        Louvain community detection algoritması
        Modülerlik optimizasyonu ile küme tespiti
        """
        # Adjacency list oluştur
        adjacency: Dict[str, List[Tuple[str, float]]] = {
            node_id: [] for node_id in self.nodes
        }
        
        for edge in self.edges:
            if edge.value >= min_similarity:
                adjacency[edge.source].append((edge.target, edge.value))
                adjacency[edge.target].append((edge.source, edge.value))
        
        # Her düğüm kendi kümesinde başlar
        communities = {node_id: node_id for node_id in self.nodes}
        
        # Modülerlik optimizasyonu (basitleştirilmiş)
        improved = True
        iterations = 0
        max_iterations = 10
        
        while improved and iterations < max_iterations:
            improved = False
            iterations += 1
            
            for node_id in self.nodes:
                # Komşu kümeleri bul
                neighbor_communities = {}
                for neighbor, weight in adjacency[node_id]:
                    comm = communities[neighbor]
                    neighbor_communities[comm] = (
                        neighbor_communities.get(comm, 0) + weight
                    )
                
                # En iyi kümeyi seç
                if neighbor_communities:
                    best_comm = max(
                        neighbor_communities.items(),
                        key=lambda x: x[1]
                    )[0]
                    
                    if communities[node_id] != best_comm:
                        communities[node_id] = best_comm
                        improved = True
        
        # Kümeleri oluştur
        return self._build_clusters_from_communities(communities)
    
    def _detect_clusters_label_propagation(
        self, 
        min_similarity: float
    ) -> List[Cluster]:
        """
        Label propagation algoritması
        Komşuların çoğunluk etiketini al
        """
        # Adjacency list
        adjacency: Dict[str, List[Tuple[str, float]]] = {
            node_id: [] for node_id in self.nodes
        }
        
        for edge in self.edges:
            if edge.value >= min_similarity:
                adjacency[edge.source].append((edge.target, edge.value))
                adjacency[edge.target].append((edge.source, edge.value))
        
        # Her düğüm kendi etiketini alır
        labels = {node_id: node_id for node_id in self.nodes}
        
        # Label propagation
        changed = True
        iterations = 0
        max_iterations = 10
        
        while changed and iterations < max_iterations:
            changed = False
            iterations += 1
            
            # Rastgele sırada işle
            import random
            node_order = list(self.nodes.keys())
            random.shuffle(node_order)
            
            for node_id in node_order:
                # Komşu etiketlerini say
                label_weights = {}
                for neighbor, weight in adjacency[node_id]:
                    label = labels[neighbor]
                    label_weights[label] = label_weights.get(label, 0) + weight
                
                # En yaygın etiketi seç
                if label_weights:
                    best_label = max(
                        label_weights.items(),
                        key=lambda x: x[1]
                    )[0]
                    
                    if labels[node_id] != best_label:
                        labels[node_id] = best_label
                        changed = True
        
        return self._build_clusters_from_communities(labels)
    
    def _detect_clusters_greedy(self, min_similarity: float) -> List[Cluster]:
        """Basit greedy clustering (orijinal algoritma)"""
        visited = set()
        clusters = []
        
        for node_id in self.nodes:
            if node_id in visited:
                continue
            
            cluster_nodes = [node_id]
            visited.add(node_id)
            
            for edge in self.edges:
                if edge.value >= min_similarity:
                    if edge.source == node_id and edge.target not in visited:
                        cluster_nodes.append(edge.target)
                        visited.add(edge.target)
                    elif edge.target == node_id and edge.source not in visited:
                        cluster_nodes.append(edge.source)
                        visited.add(edge.source)
            
            if len(cluster_nodes) > 1:
                centroid = max(
                    cluster_nodes,
                    key=lambda nid: self.nodes[nid].val
                )
                
                cluster_edges = [
                    e for e in self.edges
                    if e.source in cluster_nodes and e.target in cluster_nodes
                ]
                avg_sim = (
                    sum(e.value for e in cluster_edges) / len(cluster_edges)
                    if cluster_edges else 0.0
                )
                
                cluster = Cluster(
                    id=f"cluster-{len(clusters)}",
                    nodes=cluster_nodes,
                    centroid=centroid,
                    avg_similarity=avg_sim
                )
                clusters.append(cluster)
        
        self.clusters = clusters
        return clusters
    
    def _build_clusters_from_communities(
        self, 
        communities: Dict[str, str]
    ) -> List[Cluster]:
        """Community mapping'den Cluster nesneleri oluştur"""
        # Kümeleri grupla
        community_groups: Dict[str, List[str]] = {}
        for node_id, comm_id in communities.items():
            if comm_id not in community_groups:
                community_groups[comm_id] = []
            community_groups[comm_id].append(node_id)
        
        # Cluster nesneleri oluştur
        clusters = []
        for comm_id, node_ids in community_groups.items():
            if len(node_ids) > 1:
                # Centroid: en yüksek H(x,ψ) puanı
                centroid = max(node_ids, key=lambda nid: self.nodes[nid].val)
                
                # Ortalama benzerlik
                cluster_edges = [
                    e for e in self.edges
                    if e.source in node_ids and e.target in node_ids
                ]
                avg_sim = (
                    sum(e.value for e in cluster_edges) / len(cluster_edges)
                    if cluster_edges else 0.0
                )
                
                # Topic: centroid'in türü
                topic = self.nodes[centroid].type
                
                cluster = Cluster(
                    id=f"cluster-{len(clusters)}",
                    nodes=node_ids,
                    centroid=centroid,
                    avg_similarity=avg_sim,
                    topic=topic
                )
                clusters.append(cluster)
        
        self.clusters = clusters
        return clusters
    
    def export_graph(self) -> Dict[str, Any]:
        """
        Graf verisini JSON formatında dışa aktar
        
        Returns:
            Graf verisi
        """
        return {
            'nodes': [
                {
                    'id': node.id,
                    'name': node.name,
                    'type': node.type,
                    'val': node.val,
                    'color': node.color,
                    'metadata': node.metadata
                }
                for node in self.nodes.values()
            ],
            'links': [
                {
                    'source': edge.source,
                    'target': edge.target,
                    'value': edge.value,
                    'type': edge.type
                }
                for edge in self.edges
            ],
            'metadata': {
                'total_nodes': len(self.nodes),
                'total_edges': len(self.edges),
                'avg_degree': (
                    2 * len(self.edges) / len(self.nodes)
                    if self.nodes else 0
                ),
                'clusters': len(self.clusters)
            }
        }
