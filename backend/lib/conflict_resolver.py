"""
ConflictResolver - Çelişkili bellekleri tespit ve çözümle

Gereksinimler: 18.1, 18.2, 18.3
Özellikler: 45, 46, 47, 48
"""

from dataclasses import dataclass
from typing import List, Optional, Callable, Literal
from datetime import datetime
import hashlib


# Tip tanımları
ConflictType = Literal['contradiction', 'duplicate', 'outdated', 'ambiguous']
ConflictResolution = Literal['keep1', 'keep2', 'merge', 'ignore']
ResolvedBy = Literal['user', 'auto']


@dataclass
class MemoryData:
    """Temel bellek verisi"""
    id: str
    type: str
    scope: str
    timestamp: int
    lastAccessed: int
    metadata: dict
    content: any
    accessCount: int = 0
    importance: float = 0.5


@dataclass
class Conflict:
    """Çelişki verisi"""
    id: str
    memory1: MemoryData
    memory2: MemoryData
    score1: float  # H(x,ψ) puanı
    score2: float  # H(x,ψ) puanı
    type: ConflictType
    similarity: float
    detectedAt: int
    status: Literal['pending', 'resolved', 'ignored'] = 'pending'


@dataclass
class ConflictHistory:
    """Çözüm geçmişi"""
    conflictId: str
    resolution: ConflictResolution
    resolvedAt: int
    resolvedBy: ResolvedBy
    reason: Optional[str] = None


@dataclass
class AutoResolveRule:
    """Otomatik çözüm kuralı"""
    condition: Callable[[Conflict], bool]
    resolution: ConflictResolution
    priority: int


class ConflictResolver:
    """
    Çelişkili bellekleri tespit ve çözümle
    
    Özellikler:
    - Çelişki tespiti (similarity > 0.8 ama semantik fark)
    - H(x,ψ) tabanlı sıralama
    - Çelişki türü tespiti
    - Birleştirme stratejileri
    - Çözüm geçmişi
    """
    
    def __init__(self):
        self.history: List[ConflictHistory] = []
        self.autoResolveRules: List[AutoResolveRule] = []
        
    async def detectConflicts(self, memories: List[MemoryData]) -> List[Conflict]:
        """
        Çelişkili bellekleri tespit et
        
        Gereksinim 18.1, 18.2: Benzer içerik + farklı anlam = çelişki
        Gereksinim 18.3: H(x,ψ) puanına göre sırala
        
        Args:
            memories: Kontrol edilecek bellekler
            
        Returns:
            Tespit edilen çelişkiler (H(x,ψ) puanına göre sıralı)
        """
        conflicts: List[Conflict] = []
        
        # Her bellek çiftini kontrol et
        for i in range(len(memories)):
            for j in range(i + 1, len(memories)):
                m1 = memories[i]
                m2 = memories[j]
                
                # Çelişki var mı?
                if self._isConflicting(m1, m2):
                    # H(x,ψ) puanlarını hesapla
                    score1 = self._calculateHScore(m1)
                    score2 = self._calculateHScore(m2)
                    
                    # Benzerlik hesapla
                    similarity = self._calculateSimilarity(m1.content, m2.content)
                    
                    # Çelişki türünü tespit et
                    conflictType = self._detectConflictType(m1, m2, similarity)
                    
                    # Çelişki ID'si oluştur
                    conflictId = self._generateConflictId(m1.id, m2.id)
                    
                    conflict = Conflict(
                        id=conflictId,
                        memory1=m1,
                        memory2=m2,
                        score1=score1,
                        score2=score2,
                        type=conflictType,
                        similarity=similarity,
                        detectedAt=int(datetime.now().timestamp() * 1000)
                    )
                    
                    conflicts.append(conflict)
        
        # H(x,ψ) puanına göre sırala (yüksek önce)
        # Gereksinim 18.3: Çelişkiler H(x,ψ) puanına göre sıralanmalı
        conflicts.sort(key=lambda c: max(c.score1, c.score2), reverse=True)
        
        return conflicts
    
    def _isConflicting(self, m1: MemoryData, m2: MemoryData) -> bool:
        """
        İki bellek çelişkili mi kontrol et
        
        Gereksinim 18.1, 18.2: Benzer içerik + farklı anlam = çelişki
        
        Çelişki kriterleri:
        1. Similarity > 0.8 (benzer içerik)
        2. Semantik fark var (farklı anlam)
        3. Aynı bağlamda ama farklı sonuç
        
        Args:
            m1: İlk bellek
            m2: İkinci bellek
            
        Returns:
            True ise çelişki var
        """
        # Benzerlik hesapla
        similarity = self._calculateSimilarity(m1.content, m2.content)
        
        # Similarity > 0.8 değilse çelişki yok
        if similarity <= 0.8:
            return False
        
        # Semantik fark kontrolü
        semanticDiff = self._checkSemanticDifference(m1, m2)
        
        return semanticDiff
    
    def _calculateSimilarity(self, content1: any, content2: any) -> float:
        """
        İki içerik arasındaki benzerliği hesapla
        
        Basit string benzerliği (Jaccard similarity)
        Gerçek implementasyonda embedding similarity kullanılabilir
        
        Args:
            content1: İlk içerik
            content2: İkinci içerik
            
        Returns:
            Benzerlik skoru (0-1)
        """
        # String'e çevir
        str1 = str(content1).lower()
        str2 = str(content2).lower()
        
        # Kelime setleri
        words1 = set(str1.split())
        words2 = set(str2.split())
        
        # Jaccard similarity
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    def _checkSemanticDifference(self, m1: MemoryData, m2: MemoryData) -> bool:
        """
        Semantik fark var mı kontrol et
        
        Kontroller:
        1. Metadata'da çelişkili alanlar
        2. İçerikte zıt ifadeler
        3. Farklı sonuçlar/kararlar
        
        Args:
            m1: İlk bellek
            m2: İkinci bellek
            
        Returns:
            True ise semantik fark var
        """
        # Metadata kontrolü
        if self._hasConflictingMetadata(m1.metadata, m2.metadata):
            return True
        
        # İçerik kontrolü
        content1 = str(m1.content).lower()
        content2 = str(m2.content).lower()
        
        # Zıt ifadeler
        opposites = [
            ('true', 'false'),
            ('yes', 'no'),
            ('success', 'failure'),
            ('correct', 'incorrect'),
            ('valid', 'invalid'),
            ('enabled', 'disabled'),
            ('active', 'inactive')
        ]
        
        for word1, word2 in opposites:
            if (word1 in content1 and word2 in content2) or \
               (word2 in content1 and word1 in content2):
                return True
        
        return False
    
    def _hasConflictingMetadata(self, meta1: dict, meta2: dict) -> bool:
        """
        Metadata'da çelişkili alanlar var mı
        
        Args:
            meta1: İlk metadata
            meta2: İkinci metadata
            
        Returns:
            True ise çelişki var
        """
        # Ortak anahtarlar
        commonKeys = set(meta1.keys()) & set(meta2.keys())
        
        for key in commonKeys:
            val1 = meta1[key]
            val2 = meta2[key]
            
            # Aynı anahtar, farklı değer
            if val1 != val2:
                # Boolean çelişkisi
                if isinstance(val1, bool) and isinstance(val2, bool):
                    if val1 != val2:
                        return True
                
                # Sayısal fark (>%50)
                if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                    if val1 != 0 and abs(val1 - val2) / abs(val1) > 0.5:
                        return True
        
        return False
    
    def _detectConflictType(self, m1: MemoryData, m2: MemoryData, similarity: float) -> ConflictType:
        """
        Çelişki türünü tespit et
        
        Türler:
        - contradiction: Zıt bilgiler
        - duplicate: Aynı bilgi (similarity > 0.95)
        - outdated: Biri eski
        - ambiguous: Belirsiz durum
        
        Args:
            m1: İlk bellek
            m2: İkinci bellek
            similarity: Benzerlik skoru
            
        Returns:
            Çelişki türü
        """
        # Duplicate kontrolü (çok yüksek benzerlik)
        if similarity > 0.95:
            return 'duplicate'
        
        # Outdated kontrolü (zaman farkı)
        timeDiff = abs(m1.timestamp - m2.timestamp)
        oneWeek = 7 * 24 * 60 * 60 * 1000  # ms
        
        if timeDiff > oneWeek:
            # Biri çok daha eski
            return 'outdated'
        
        # Contradiction kontrolü (zıt ifadeler)
        if self._hasContradiction(m1, m2):
            return 'contradiction'
        
        # Varsayılan: ambiguous
        return 'ambiguous'
    
    def _hasContradiction(self, m1: MemoryData, m2: MemoryData) -> bool:
        """
        Zıt ifadeler var mı
        
        Args:
            m1: İlk bellek
            m2: İkinci bellek
            
        Returns:
            True ise zıt ifade var
        """
        content1 = str(m1.content).lower()
        content2 = str(m2.content).lower()
        
        # Olumsuzluk ifadeleri
        negations = ['not', 'no', 'never', 'none', 'neither']
        
        # Biri olumlu, diğeri olumsuz
        hasNegation1 = any(neg in content1 for neg in negations)
        hasNegation2 = any(neg in content2 for neg in negations)
        
        return hasNegation1 != hasNegation2
    
    def _calculateHScore(self, memory: MemoryData) -> float:
        """
        H(x,ψ) puanını hesapla
        
        Gereksinim 16.2, 16.3: H(x,ψ) = w1*similarity + w2*decay + w3*importance + w4*frequency
        
        Args:
            memory: Bellek verisi
            
        Returns:
            H(x,ψ) puanı (0-1)
        """
        # Varsayılan ağırlıklar
        weights = {
            'similarity': 0.4,
            'decay': 0.2,
            'importance': 0.3,
            'frequency': 0.1
        }
        
        # Similarity (query ile benzerlik - şimdilik 1.0)
        similarity = 1.0
        
        # Decay (zaman azalması)
        now = int(datetime.now().timestamp() * 1000)
        age = now - memory.timestamp
        halfLife = 30 * 24 * 60 * 60 * 1000  # 30 gün (ms)
        decay = 2 ** (-age / halfLife)
        
        # Importance (metadata'dan veya varsayılan)
        importance = memory.importance
        
        # Frequency (erişim sayısı normalize)
        frequency = min(memory.accessCount / 100.0, 1.0)
        
        # H(x,ψ) hesapla
        hScore = (
            weights['similarity'] * similarity +
            weights['decay'] * decay +
            weights['importance'] * importance +
            weights['frequency'] * frequency
        )
        
        return hScore
    
    def _generateConflictId(self, id1: str, id2: str) -> str:
        """
        Çelişki ID'si oluştur
        
        Args:
            id1: İlk bellek ID
            id2: İkinci bellek ID
            
        Returns:
            Çelişki ID'si
        """
        # Sıralı ID'ler (tutarlılık için)
        ids = sorted([id1, id2])
        combined = f"{ids[0]}:{ids[1]}"
        
        # Hash
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    async def resolveConflict(
        self,
        conflict: Conflict,
        resolution: ConflictResolution
    ) -> MemoryData:
        """
        Çelişkiyi çözümle
        
        Gereksinim 18.6, 18.7: Birleştirme işlemi
        
        Args:
            conflict: Çözülecek çelişki
            resolution: Çözüm stratejisi
            
        Returns:
            Sonuç bellek
        """
        # Çözüm geçmişine kaydet
        history = ConflictHistory(
            conflictId=conflict.id,
            resolution=resolution,
            resolvedAt=int(datetime.now().timestamp() * 1000),
            resolvedBy='user'
        )
        self.history.append(history)
        
        # Çelişki durumunu güncelle
        conflict.status = 'resolved' if resolution != 'ignore' else 'ignored'
        
        # Çözüm stratejisine göre işle
        if resolution == 'keep1':
            return conflict.memory1
        elif resolution == 'keep2':
            return conflict.memory2
        elif resolution == 'merge':
            return self.mergeMemories(conflict.memory1, conflict.memory2)
        else:  # ignore
            return conflict.memory1
    
    def mergeMemories(self, m1: MemoryData, m2: MemoryData) -> MemoryData:
        """
        İki belleği birleştir
        
        Gereksinim 18.6, 18.7: Kaynak ID'leri ile işaretle
        
        Args:
            m1: İlk bellek
            m2: İkinci bellek
            
        Returns:
            Birleştirilmiş bellek
        """
        # Yeni ID oluştur
        mergedId = f"merged_{m1.id}_{m2.id}"
        
        # Metadata birleştir
        mergedMetadata = {**m1.metadata, **m2.metadata}
        mergedMetadata['sourceIds'] = [m1.id, m2.id]
        mergedMetadata['mergedAt'] = int(datetime.now().timestamp() * 1000)
        
        # İçerik birleştir
        mergedContent = {
            'source1': m1.content,
            'source2': m2.content,
            'merged': True
        }
        
        # Yeni bellek oluştur
        merged = MemoryData(
            id=mergedId,
            type=m1.type,
            scope=m1.scope,
            timestamp=max(m1.timestamp, m2.timestamp),
            lastAccessed=int(datetime.now().timestamp() * 1000),
            metadata=mergedMetadata,
            content=mergedContent,
            accessCount=m1.accessCount + m2.accessCount,
            importance=max(m1.importance, m2.importance)
        )
        
        return merged
    
    def getConflictHistory(self) -> List[ConflictHistory]:
        """
        Çözüm geçmişini getir
        
        Gereksinim 18.8, 18.9: Çözüm kararı geçmişi
        
        Returns:
            Çözüm geçmişi
        """
        return self.history
    
    def setAutoResolveRules(self, rules: List[AutoResolveRule]) -> None:
        """
        Otomatik çözüm kurallarını ayarla
        
        Args:
            rules: Otomatik çözüm kuralları
        """
        # Önceliğe göre sırala
        self.autoResolveRules = sorted(rules, key=lambda r: r.priority, reverse=True)
