"""
VectorStore - Basit vektör depolama ve arama
MongoDB ile entegre, cosine similarity kullanır
"""
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    """Vektör depolama ve benzerlik araması"""
    
    def __init__(self, db_collection):
        """
        Args:
            db_collection: MongoDB collection instance
        """
        self.collection = db_collection
        self.vectors: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Dict[str, Any]] = {}
    
    async def add_vector(
        self, 
        key: str, 
        vector: List[float], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Vektör ekle"""
        try:
            if not vector or len(vector) == 0:
                logger.warning(f"Empty vector for key: {key}")
                return False
            
            # Numpy array'e çevir
            vec_array = np.array(vector, dtype=np.float32)
            
            # Normalize et
            norm = np.linalg.norm(vec_array)
            if norm > 0:
                vec_array = vec_array / norm
            
            # Memory'de sakla
            self.vectors[key] = vec_array
            self.metadata[key] = metadata or {}
            
            # MongoDB'ye kaydet
            doc = {
                "key": key,
                "vector": vector,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.collection.update_one(
                {"key": key},
                {"$set": doc},
                upsert=True
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding vector {key}: {e}")
            return False
    
    async def search_vectors(
        self, 
        query_vector: List[float], 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Benzer vektörleri ara"""
        try:
            if not query_vector or len(query_vector) == 0:
                return []
            
            # Query vektörünü normalize et
            query_array = np.array(query_vector, dtype=np.float32)
            norm = np.linalg.norm(query_array)
            if norm > 0:
                query_array = query_array / norm
            
            # Cosine similarity hesapla
            results = []
            for key, vec in self.vectors.items():
                similarity = float(np.dot(query_array, vec))
                results.append({
                    "key": key,
                    "score": similarity,
                    "metadata": self.metadata.get(key, {})
                })
            
            # Sırala ve top_k al
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]
            
        except Exception as e:
            logger.error(f"Error searching vectors: {e}")
            return []
    
    async def delete_vector(self, key: str) -> bool:
        """Vektör sil"""
        try:
            if key in self.vectors:
                del self.vectors[key]
            if key in self.metadata:
                del self.metadata[key]
            
            await self.collection.delete_one({"key": key})
            return True
            
        except Exception as e:
            logger.error(f"Error deleting vector {key}: {e}")
            return False
    
    async def load_from_db(self) -> int:
        """MongoDB'den vektörleri yükle"""
        try:
            count = 0
            async for doc in self.collection.find({}):
                key = doc.get("key")
                vector = doc.get("vector")
                metadata = doc.get("metadata", {})
                
                if key and vector:
                    vec_array = np.array(vector, dtype=np.float32)
                    norm = np.linalg.norm(vec_array)
                    if norm > 0:
                        vec_array = vec_array / norm
                    
                    self.vectors[key] = vec_array
                    self.metadata[key] = metadata
                    count += 1
            
            logger.info(f"Loaded {count} vectors from database")
            return count
            
        except Exception as e:
            logger.error(f"Error loading vectors: {e}")
            return 0
