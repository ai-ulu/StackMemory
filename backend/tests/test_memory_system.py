"""
Memory System Tests
Tests for VectorStore, EpisodicMemory, ShortTermMemory, MemoryOrchestrator
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
import numpy as np

# Import memory modules
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib.vector_store import VectorStore
from lib.episodic_memory import EpisodicMemory
from lib.short_term_memory import ShortTermMemory
from lib.memory_orchestrator import MemoryOrchestrator


class TestShortTermMemory:
    """ShortTermMemory testleri"""
    
    def test_add_and_get_recent(self):
        """Item ekleme ve geri alma"""
        stm = ShortTermMemory(max_items=5)
        
        # Item ekle
        stm.add("item1")
        stm.add("item2")
        stm.add("item3")
        
        # Son 2 item'ı al
        recent = stm.get_recent(2)
        assert len(recent) == 2
        assert recent == ["item2", "item3"]
    
    def test_fifo_behavior(self):
        """FIFO davranışı"""
        stm = ShortTermMemory(max_items=3)
        
        # 4 item ekle (max 3)
        stm.add("item1")
        stm.add("item2")
        stm.add("item3")
        stm.add("item4")
        
        # İlk item çıkmış olmalı
        all_items = stm.get_all()
        assert len(all_items) == 3
        assert "item1" not in all_items
        assert all_items == ["item2", "item3", "item4"]
    
    def test_clear(self):
        """Buffer temizleme"""
        stm = ShortTermMemory(max_items=5)
        stm.add("item1")
        stm.add("item2")
        
        stm.clear()
        assert stm.size() == 0
        assert stm.get_all() == []
    
    def test_is_full(self):
        """Buffer dolu kontrolü"""
        stm = ShortTermMemory(max_items=2)
        assert not stm.is_full()
        
        stm.add("item1")
        assert not stm.is_full()
        
        stm.add("item2")
        assert stm.is_full()


class TestVectorStore:
    """VectorStore testleri"""
    
    @pytest.fixture
    def mock_collection(self):
        """Mock MongoDB collection"""
        collection = AsyncMock()
        collection.update_one = AsyncMock()
        collection.delete_one = AsyncMock()
        collection.find = MagicMock()
        return collection
    
    @pytest.mark.asyncio
    async def test_add_vector(self, mock_collection):
        """Vektör ekleme"""
        store = VectorStore(mock_collection)
        
        vector = [0.1, 0.2, 0.3, 0.4]
        metadata = {"type": "test"}
        
        result = await store.add_vector("key1", vector, metadata)
        assert result is True
        assert "key1" in store.vectors
        assert "key1" in store.metadata
    
    @pytest.mark.asyncio
    async def test_search_vectors(self, mock_collection):
        """Vektör arama"""
        store = VectorStore(mock_collection)
        
        # 3 vektör ekle
        await store.add_vector("key1", [1.0, 0.0, 0.0], {"type": "a"})
        await store.add_vector("key2", [0.9, 0.1, 0.0], {"type": "b"})
        await store.add_vector("key3", [0.0, 1.0, 0.0], {"type": "c"})
        
        # [1, 0, 0]'a benzer vektörleri ara
        results = await store.search_vectors([1.0, 0.0, 0.0], top_k=2)
        
        assert len(results) == 2
        # En benzer key1 olmalı
        assert results[0]["key"] == "key1"
        assert results[0]["score"] > 0.9
    
    @pytest.mark.asyncio
    async def test_delete_vector(self, mock_collection):
        """Vektör silme"""
        store = VectorStore(mock_collection)
        
        await store.add_vector("key1", [1.0, 0.0], {})
        assert "key1" in store.vectors
        
        result = await store.delete_vector("key1")
        assert result is True
        assert "key1" not in store.vectors


class TestEpisodicMemory:
    """EpisodicMemory testleri"""
    
    @pytest.fixture
    def mock_collection(self):
        """Mock MongoDB collection"""
        collection = AsyncMock()
        collection.insert_one = AsyncMock()
        collection.find = MagicMock()
        collection.delete_many = AsyncMock()
        return collection
    
    @pytest.mark.asyncio
    async def test_add_episode(self, mock_collection):
        """Episode ekleme"""
        episodic = EpisodicMemory(mock_collection)
        
        episode = await episodic.add_episode(
            text="Test episode",
            semantic={"keywords": ["test"]},
            emotions={"label": "positive"}
        )
        
        assert episode["text"] == "Test episode"
        assert "timestamp" in episode
        assert len(episodic.episodes) == 1
    
    @pytest.mark.asyncio
    async def test_get_recent(self, mock_collection):
        """Son episode'ları alma"""
        episodic = EpisodicMemory(mock_collection)
        
        # 5 episode ekle
        for i in range(5):
            await episodic.add_episode(f"Episode {i}")
        
        # Son 3'ü al
        recent = await episodic.get_recent(3)
        assert len(recent) == 3
        assert recent[-1]["text"] == "Episode 4"
    
    @pytest.mark.asyncio
    async def test_search(self, mock_collection):
        """Keyword araması"""
        episodic = EpisodicMemory(mock_collection)
        
        await episodic.add_episode(
            "Python programming",
            semantic={"keywords": ["python", "code"]}
        )
        await episodic.add_episode(
            "JavaScript tutorial",
            semantic={"keywords": ["javascript", "web"]}
        )
        
        # "python" ara
        results = await episodic.search("python", limit=10)
        assert len(results) >= 1
        assert "python" in results[0]["text"].lower()
    
    @pytest.mark.asyncio
    async def test_clear(self, mock_collection):
        """Episode'ları temizleme"""
        episodic = EpisodicMemory(mock_collection)
        
        await episodic.add_episode("Test")
        assert len(episodic.episodes) == 1
        
        await episodic.clear()
        assert len(episodic.episodes) == 0


class TestMemoryOrchestrator:
    """MemoryOrchestrator testleri"""
    
    @pytest.fixture
    def mock_collections(self):
        """Mock MongoDB collections"""
        vector_col = AsyncMock()
        vector_col.update_one = AsyncMock()
        vector_col.delete_one = AsyncMock()
        vector_col.find = MagicMock(return_value=AsyncMock(__aiter__=lambda x: iter([])))
        
        episodic_col = AsyncMock()
        episodic_col.insert_one = AsyncMock()
        episodic_col.delete_many = AsyncMock()
        episodic_col.find = MagicMock(return_value=AsyncMock(__aiter__=lambda x: iter([])))
        
        return vector_col, episodic_col
    
    @pytest.mark.asyncio
    async def test_record_interaction(self, mock_collections):
        """Etkileşim kaydetme"""
        vector_col, episodic_col = mock_collections
        orchestrator = MemoryOrchestrator(vector_col, episodic_col, stm_max_items=10)
        
        result = await orchestrator.record_interaction(
            user_input="Hello",
            system_output="Hi there!",
            metadata={"session": "test"}
        )
        
        assert result is True
        assert orchestrator.stm.size() == 1
        assert len(orchestrator.episodic.episodes) == 1
    
    @pytest.mark.asyncio
    async def test_recall_relevant(self, mock_collections):
        """Belleklerden geri çağırma"""
        vector_col, episodic_col = mock_collections
        orchestrator = MemoryOrchestrator(vector_col, episodic_col)
        
        # Etkileşim kaydet
        await orchestrator.record_interaction("Test query", "Test response")
        
        # Geri çağır
        result = await orchestrator.recall_relevant("test", top_k=5)
        
        assert "recent" in result
        assert "episodic" in result
        assert "vector" in result
        assert len(result["recent"]) > 0
    
    @pytest.mark.asyncio
    async def test_get_stats(self, mock_collections):
        """İstatistik alma"""
        vector_col, episodic_col = mock_collections
        orchestrator = MemoryOrchestrator(vector_col, episodic_col)
        
        await orchestrator.record_interaction("Test", "Response")
        
        stats = await orchestrator.get_stats()
        
        assert "stm_size" in stats
        assert "episodic_count" in stats
        assert "vector_count" in stats
        assert stats["stm_size"] == 1
    
    @pytest.mark.asyncio
    async def test_summarize_recent(self, mock_collections):
        """Son etkileşimlerin özeti"""
        vector_col, episodic_col = mock_collections
        orchestrator = MemoryOrchestrator(vector_col, episodic_col)
        
        await orchestrator.record_interaction("Test", "Response")
        
        summary = await orchestrator.summarize_recent()
        
        assert "count" in summary
        assert "stm_size" in summary
        assert summary["count"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
