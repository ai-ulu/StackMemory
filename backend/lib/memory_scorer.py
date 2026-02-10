"""
MemoryScorer - H(x,ψ) puanlama algoritması
Bellekleri similarity, decay, importance ve frequency'ye göre puanlar
"""
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
import math

logger = logging.getLogger(__name__)


class HScore:
    """H(x,ψ) puanı ve bileşenleri"""
    
    def __init__(
        self,
        total: float,
        similarity: float,
        decay: float,
        importance: float,
        frequency: float,
        breakdown: Dict[str, float]
    ):
        self.total = total
        self.similarity = similarity
        self.decay = decay
        self.importance = importance
        self.frequency = frequency
        self.breakdown = breakdown
    
    def to_dict(self) -> Dict[str, Any]:
        """Dict'e çevir"""
        return {
            "total": self.total,
            "similarity": self.similarity,
            "decay": self.decay,
            "importance": self.importance,
            "frequency": self.frequency,
            "breakdown": self.breakdown
        }


class HScoreWeights:
    """H(x,ψ) ağırlıkları"""
    
    def __init__(
        self,
        alpha: float = 0.4,  # Similarity weight
        beta: float = 0.2,   # Decay weight
        gamma: float = 0.3,  # Importance weight
        delta: float = 0.1   # Frequency weight
    ):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.delta = delta
        
        # Normalize et (toplam 1.0 olmalı)
        total = alpha + beta + gamma + delta
        if total > 0:
            self.alpha /= total
            self.beta /= total
            self.gamma /= total
            self.delta /= total
    
    def to_dict(self) -> Dict[str, float]:
        """Dict'e çevir"""
        return {
            "alpha": self.alpha,
            "beta": self.beta,
            "gamma": self.gamma,
            "delta": self.delta
        }


class MemoryScorer:
    """H(x,ψ) puanlama sistemi"""
    
    def __init__(
        self,
        weights: Optional[HScoreWeights] = None,
        decay_halflife_days: float = 30.0
    ):
        """
        Args:
            weights: H(x,ψ) ağırlıkları (varsayılan: α=0.4, β=0.2, γ=0.3, δ=0.1)
            decay_halflife_days: Zaman azalması yarı ömrü (gün)
        """
        self.weights = weights or HScoreWeights()
        self.decay_halflife_days = decay_halflife_days
        
        logger.info(f"MemoryScorer initialized with weights: {self.weights.to_dict()}")
    
    def calculate_score(
        self,
        memory: Dict[str, Any],
        query: str,
        query_vector: Optional[List[float]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> HScore:
        """
        H(x,ψ) puanını hesapla
        
        H(x,ψ) = α(1-similarity) + β*decay + γ*importance + δ*frequency
        
        Args:
            memory: Bellek verisi
            query: Arama sorgusu
            query_vector: Query vektörü (semantic similarity için)
            context: Ek bağlam (current_time, user_preferences, vb.)
        
        Returns:
            HScore nesnesi
        """
        try:
            # Context'ten değerleri al
            current_time = context.get("current_time") if context else None
            if not current_time:
                current_time = datetime.utcnow().timestamp()
            
            # 1. Similarity hesapla
            similarity = self._calculate_similarity(
                memory, 
                query, 
                query_vector
            )
            
            # 2. Decay hesapla
            last_accessed = memory.get("last_accessed", memory.get("timestamp", current_time))
            decay = self._calculate_decay(last_accessed, current_time)
            
            # 3. Importance al
            importance = memory.get("importance", 0.5)
            
            # 4. Frequency hesapla
            access_count = memory.get("access_count", 1)
            frequency = self._calculate_frequency(access_count)
            
            # 5. H(x,ψ) hesapla
            total = (
                self.weights.alpha * (1 - similarity) +
                self.weights.beta * decay +
                self.weights.gamma * importance +
                self.weights.delta * frequency
            )
            
            breakdown = {
                "alpha": self.weights.alpha,
                "beta": self.weights.beta,
                "gamma": self.weights.gamma,
                "delta": self.weights.delta
            }
            
            return HScore(
                total=total,
                similarity=similarity,
                decay=decay,
                importance=importance,
                frequency=frequency,
                breakdown=breakdown
            )
            
        except Exception as e:
            logger.error(f"Error calculating H(x,ψ) score: {e}")
            # Varsayılan puan döndür
            return HScore(
                total=0.5,
                similarity=0.0,
                decay=0.5,
                importance=0.5,
                frequency=0.0,
                breakdown=self.weights.to_dict()
            )
    
    def _calculate_similarity(
        self,
        memory: Dict[str, Any],
        query: str,
        query_vector: Optional[List[float]] = None
    ) -> float:
        """Benzerlik hesapla (0-1 arası)"""
        try:
            # Eğer vektör varsa, cosine similarity kullan
            if query_vector and "vector" in memory:
                memory_vector = memory["vector"]
                if memory_vector and len(memory_vector) == len(query_vector):
                    return self._cosine_similarity(query_vector, memory_vector)
            
            # Yoksa basit text matching
            memory_text = str(memory.get("text", "")).lower()
            query_lower = query.lower()
            
            if not memory_text or not query_lower:
                return 0.0
            
            # Jaccard similarity (kelime bazlı)
            memory_words = set(memory_text.split())
            query_words = set(query_lower.split())
            
            if not memory_words or not query_words:
                return 0.0
            
            intersection = len(memory_words & query_words)
            union = len(memory_words | query_words)
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
    def _cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float]
    ) -> float:
        """Cosine similarity hesapla"""
        try:
            v1 = np.array(vec1, dtype=np.float32)
            v2 = np.array(vec2, dtype=np.float32)
            
            # Normalize
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            v1 = v1 / norm1
            v2 = v2 / norm2
            
            # Dot product
            similarity = float(np.dot(v1, v2))
            
            # 0-1 arası normalize et
            return max(0.0, min(1.0, (similarity + 1) / 2))
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    def _calculate_decay(
        self,
        last_accessed: float,
        current_time: float
    ) -> float:
        """
        Zaman azalması hesapla (soft decay)
        
        decay = exp(-days_since / halflife)
        
        Returns:
            0-1 arası değer (0 = yeni, 1 = çok eski)
        """
        try:
            # Timestamp'leri datetime'a çevir
            if isinstance(last_accessed, str):
                last_accessed = datetime.fromisoformat(last_accessed).timestamp()
            if isinstance(current_time, str):
                current_time = datetime.fromisoformat(current_time).timestamp()
            
            # Gün cinsinden fark
            days_since = (current_time - last_accessed) / (24 * 3600)
            
            # Soft decay (exponential)
            decay = math.exp(-days_since / self.decay_halflife_days)
            
            # 1 - decay (0 = yeni, 1 = eski)
            return 1 - decay
            
        except Exception as e:
            logger.error(f"Error calculating decay: {e}")
            return 0.5
    
    def _calculate_frequency(self, access_count: int) -> float:
        """
        Sıklık hesapla (logaritmik)
        
        frequency = log(access_count + 1) / log(max_count + 1)
        
        Returns:
            0-1 arası değer
        """
        try:
            if access_count <= 0:
                return 0.0
            
            # Logaritmik scale (çok sık erişilen bellekler için diminishing returns)
            max_count = 1000  # Varsayılan max
            
            freq = math.log(access_count + 1) / math.log(max_count + 1)
            
            return min(1.0, freq)
            
        except Exception as e:
            logger.error(f"Error calculating frequency: {e}")
            return 0.0
    
    def update_weights(self, weights: HScoreWeights) -> None:
        """Ağırlıkları güncelle"""
        self.weights = weights
        logger.info(f"Updated weights: {self.weights.to_dict()}")
    
    def get_weights(self) -> HScoreWeights:
        """Mevcut ağırlıkları al"""
        return self.weights
    
    def rank_memories(
        self,
        memories: List[Dict[str, Any]],
        query: str,
        query_vector: Optional[List[float]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Bellekleri H(x,ψ) puanına göre sırala
        
        Returns:
            Sıralanmış bellek listesi (en düşük puan = en alakalı)
        """
        try:
            scored_memories = []
            
            for memory in memories:
                score = self.calculate_score(memory, query, query_vector, context)
                
                scored_memories.append({
                    "memory": memory,
                    "h_score": score.to_dict(),
                    "total_score": score.total
                })
            
            # Sırala (en düşük puan = en alakalı)
            scored_memories.sort(key=lambda x: x["total_score"])
            
            return scored_memories
            
        except Exception as e:
            logger.error(f"Error ranking memories: {e}")
            return [{"memory": m, "h_score": {}, "total_score": 0.5} for m in memories]
