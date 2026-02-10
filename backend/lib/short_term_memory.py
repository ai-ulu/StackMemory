"""
ShortTermMemory - FIFO buffer
Son N etkileşimi hızlı erişim için tutar
"""
from typing import List, Any
from collections import deque
import logging

logger = logging.getLogger(__name__)


class ShortTermMemory:
    """Kısa süreli bellek - FIFO buffer"""
    
    def __init__(self, max_items: int = 20):
        """
        Args:
            max_items: Maximum number of items to keep
        """
        self.max_items = max_items
        self.buffer: deque = deque(maxlen=max_items)
    
    def add(self, item: Any) -> None:
        """Item ekle (FIFO)"""
        try:
            self.buffer.append(item)
            logger.debug(f"Added item to STM, size: {len(self.buffer)}")
            
        except Exception as e:
            logger.error(f"Error adding to STM: {e}")
    
    def get_recent(self, n: int = 10) -> List[Any]:
        """Son N item'ı getir"""
        try:
            if n >= len(self.buffer):
                return list(self.buffer)
            
            # Son n item
            return list(self.buffer)[-n:]
            
        except Exception as e:
            logger.error(f"Error getting recent from STM: {e}")
            return []
    
    def clear(self) -> None:
        """Buffer'ı temizle"""
        try:
            self.buffer.clear()
            logger.info("Cleared STM buffer")
            
        except Exception as e:
            logger.error(f"Error clearing STM: {e}")
    
    def size(self) -> int:
        """Buffer boyutu"""
        return len(self.buffer)
    
    def is_full(self) -> bool:
        """Buffer dolu mu?"""
        return len(self.buffer) >= self.max_items
    
    def get_all(self) -> List[Any]:
        """Tüm item'ları getir"""
        return list(self.buffer)
