"""
MemoryOrchestrator - Tüm bellek katmanlarını koordine eder
STM, Episodic, LTM (VectorStore) arasında veri akışını yönetir
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from .short_term_memory import ShortTermMemory
from .episodic_memory import EpisodicMemory
from .vector_store import VectorStore
from .memory_scorer import MemoryScorer

logger = logging.getLogger(__name__)


class MemoryOrchestrator:
    """Bellek orkestratörü - tüm katmanları koordine eder"""
    
    def __init__(
        self,
        vector_collection,
        episodic_collection,
        stm_max_items: int = 20
    ):
        """
        Args:
            vector_collection: MongoDB collection for vectors
            episodic_collection: MongoDB collection for episodes
            stm_max_items: Short-term memory buffer size
        """
        self.stm = ShortTermMemory(max_items=stm_max_items)
        self.episodic = EpisodicMemory(episodic_collection)
        self.vector_store = VectorStore(vector_collection)
        self.scorer = MemoryScorer()  # H(x,ψ) puanlama sistemi
        
        logger.info("MemoryOrchestrator initialized with H(x,ψ) scoring")
    
    async def initialize(self) -> bool:
        """Veritabanından yükle"""
        try:
            await self.vector_store.load_from_db()
            await self.episodic.load_from_db()
            logger.info("MemoryOrchestrator loaded from database")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing MemoryOrchestrator: {e}")
            return False
    
    async def record_interaction(
        self,
        user_input: str,
        system_output: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Etkileşim kaydet (tüm katmanlara)"""
        try:
            interaction = {
                "user": user_input,
                "system": system_output,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": metadata or {}
            }
            
            # 1. Short-term memory'ye ekle
            self.stm.add(interaction)
            
            # 2. Episodic memory'ye ekle
            combined_text = f"User: {user_input}\nSystem: {system_output}"
            await self.episodic.add_episode(
                text=combined_text,
                semantic={"domain": "interaction"},
                emotions={"label": "neutral"},
                notes=metadata or {}
            )
            
            logger.info("Recorded interaction to all memory layers")
            return True
            
        except Exception as e:
            logger.error(f"Error recording interaction: {e}")
            return False
    
    async def recall_relevant(
        self,
        query: str,
        top_k: int = 5,
        query_vector: Optional[List[float]] = None,
        use_h_score: bool = True
    ) -> Dict[str, Any]:
        """
        Alakalı bilgileri geri çağır (tüm katmanlardan)
        
        Args:
            query: Arama sorgusu
            top_k: Kaç sonuç döndürülecek
            query_vector: Query vektörü (semantic search için)
            use_h_score: H(x,ψ) puanlama kullan
        """
        try:
            result = {
                "recent": [],
                "episodic": [],
                "vector": [],
                "ranked": []
            }
            
            # 1. Short-term memory'den son etkileşimler
            result["recent"] = self.stm.get_recent(3)
            
            # 2. Episodic memory'den keyword search
            episodic_results = await self.episodic.search(query, limit=top_k * 2)
            result["episodic"] = episodic_results
            
            # 3. Vector store'dan semantic search (eğer vector varsa)
            if query_vector:
                vector_results = await self.vector_store.search_vectors(
                    query_vector, 
                    top_k=top_k * 2
                )
                result["vector"] = vector_results
            
            # 4. H(x,ψ) ile sırala (eğer aktifse)
            if use_h_score and (episodic_results or result["vector"]):
                all_memories = []
                
                # Episodic'i ekle
                for ep in episodic_results:
                    all_memories.append({
                        "text": ep.get("text", ""),
                        "timestamp": ep.get("timestamp"),
                        "last_accessed": ep.get("timestamp"),
                        "access_count": 1,
                        "importance": 0.5,
                        "source": "episodic",
                        "data": ep
                    })
                
                # Vector'ü ekle
                for vec in result["vector"]:
                    all_memories.append({
                        "text": vec.get("metadata", {}).get("text", ""),
                        "timestamp": vec.get("metadata", {}).get("timestamp"),
                        "last_accessed": vec.get("metadata", {}).get("timestamp"),
                        "access_count": vec.get("metadata", {}).get("access_count", 1),
                        "importance": vec.get("score", 0.5),
                        "vector": vec.get("metadata", {}).get("vector"),
                        "source": "vector",
                        "data": vec
                    })
                
                # H(x,ψ) ile sırala
                ranked = self.scorer.rank_memories(
                    all_memories,
                    query,
                    query_vector
                )
                
                result["ranked"] = ranked[:top_k]
            
            logger.info(f"Recalled memories for query: {query[:50]}... (H(x,ψ): {use_h_score})")
            return result
            
        except Exception as e:
            logger.error(f"Error recalling memories: {e}")
            return {"recent": [], "episodic": [], "vector": [], "ranked": []}
    
    async def summarize_recent(self) -> Dict[str, Any]:
        """Son etkileşimlerin özeti"""
        try:
            recent = self.stm.get_recent(5)
            
            summary = {
                "count": len(recent),
                "stm_size": self.stm.size(),
                "stm_full": self.stm.is_full(),
                "last_interaction": recent[-1] if recent else None
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error summarizing recent: {e}")
            return {"count": 0, "stm_size": 0, "stm_full": False}
    
    async def get_stats(self) -> Dict[str, Any]:
        """Tüm katmanların istatistikleri"""
        try:
            episodic_recent = await self.episodic.get_recent(1000)
            
            stats = {
                "stm_size": self.stm.size(),
                "stm_max": self.stm.max_items,
                "episodic_count": len(episodic_recent),
                "vector_count": len(self.vector_store.vectors),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}
    
    async def clear_all(self) -> bool:
        """Tüm bellekleri temizle"""
        try:
            self.stm.clear()
            await self.episodic.clear()
            
            # Vector store temizleme (dikkatli!)
            for key in list(self.vector_store.vectors.keys()):
                await self.vector_store.delete_vector(key)
            
            logger.warning("Cleared all memory layers")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing all memories: {e}")
            return False
