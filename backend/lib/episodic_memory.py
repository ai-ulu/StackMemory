"""
EpisodicMemory - Zaman sıralı episode tracking
Her etkileşimi timestamp, text, semantic info ve emotions ile saklar
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EpisodicMemory:
    """Episodik bellek - zaman sıralı etkileşimler"""
    
    def __init__(self, db_collection):
        """
        Args:
            db_collection: MongoDB collection instance
        """
        self.collection = db_collection
        self.episodes: List[Dict[str, Any]] = []
    
    async def add_episode(
        self,
        text: str,
        semantic: Optional[Dict[str, Any]] = None,
        emotions: Optional[Dict[str, Any]] = None,
        notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Episode ekle"""
        try:
            episode = {
                "timestamp": datetime.utcnow().isoformat(),
                "text": text,
                "semantic": semantic or {},
                "emotions": emotions or {"label": "neutral"},
                "notes": notes or {}
            }
            
            # Memory'de sakla
            self.episodes.append(episode)
            
            # MongoDB'ye kaydet
            await self.collection.insert_one(episode)
            
            logger.info(f"Added episode: {text[:50]}...")
            return episode
            
        except Exception as e:
            logger.error(f"Error adding episode: {e}")
            return {}
    
    async def get_recent(self, n: int = 10) -> List[Dict[str, Any]]:
        """Son N episode'u getir"""
        try:
            # Memory'den al (zaten sıralı)
            if len(self.episodes) <= n:
                return self.episodes.copy()
            return self.episodes[-n:]
            
        except Exception as e:
            logger.error(f"Error getting recent episodes: {e}")
            return []
    
    async def search(
        self, 
        keyword: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Keyword ile ara"""
        try:
            results = []
            keyword_lower = keyword.lower()
            
            for episode in reversed(self.episodes):
                # Text'te ara
                if keyword_lower in episode.get("text", "").lower():
                    results.append(episode)
                    if len(results) >= limit:
                        break
                
                # Semantic keywords'te ara
                semantic = episode.get("semantic", {})
                keywords = semantic.get("keywords", [])
                if any(keyword_lower in kw.lower() for kw in keywords):
                    if episode not in results:
                        results.append(episode)
                        if len(results) >= limit:
                            break
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching episodes: {e}")
            return []
    
    async def load_from_db(self, limit: int = 1000) -> int:
        """MongoDB'den episode'ları yükle"""
        try:
            self.episodes = []
            
            # Timestamp'e göre sıralı al
            cursor = self.collection.find({}).sort("timestamp", 1).limit(limit)
            
            async for doc in cursor:
                # MongoDB _id'yi çıkar
                doc.pop("_id", None)
                self.episodes.append(doc)
            
            count = len(self.episodes)
            logger.info(f"Loaded {count} episodes from database")
            return count
            
        except Exception as e:
            logger.error(f"Error loading episodes: {e}")
            return 0
    
    async def clear(self) -> bool:
        """Tüm episode'ları temizle"""
        try:
            self.episodes = []
            await self.collection.delete_many({})
            logger.info("Cleared all episodes")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing episodes: {e}")
            return False
