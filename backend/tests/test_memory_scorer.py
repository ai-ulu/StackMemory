"""
MemoryScorer testleri - H(x,ψ) puanlama algoritması
"""
import pytest
from datetime import datetime, timedelta
from lib.memory_scorer import MemoryScorer, HScore, HScoreWeights


class TestHScoreWeights:
    """HScoreWeights testleri"""
    
    def test_default_weights(self):
        """Varsayılan ağırlıklar normalize edilmeli"""
        weights = HScoreWeights()
        
        total = weights.alpha + weights.beta + weights.gamma + weights.delta
        assert abs(total - 1.0) < 0.001
        
        # Varsayılan değerler (floating point tolerance)
        assert abs(weights.alpha - 0.4) < 0.001
        assert abs(weights.beta - 0.2) < 0.001
        assert abs(weights.gamma - 0.3) < 0.001
        assert abs(weights.delta - 0.1) < 0.001
    
    def test_custom_weights_normalized(self):
        """Özel ağırlıklar normalize edilmeli"""
        weights = HScoreWeights(alpha=2.0, beta=1.0, gamma=1.0, delta=0.5)
        
        total = weights.alpha + weights.beta + weights.gamma + weights.delta
        assert abs(total - 1.0) < 0.001
    
    def test_weights_to_dict(self):
        """Ağırlıklar dict'e çevrilebilmeli"""
        weights = HScoreWeights()
        d = weights.to_dict()
        
        assert "alpha" in d
        assert "beta" in d
        assert "gamma" in d
        assert "delta" in d


class TestMemoryScorer:
    """MemoryScorer testleri"""
    
    @pytest.fixture
    def scorer(self):
        """Test scorer"""
        return MemoryScorer()
    
    @pytest.fixture
    def sample_memory(self):
        """Örnek bellek"""
        return {
            "id": "mem_123",
            "text": "Python programlama dili hakkında bilgi",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 5,
            "importance": 0.8,
            "vector": [0.1, 0.2, 0.3, 0.4, 0.5]
        }
    
    def test_calculate_score_basic(self, scorer, sample_memory):
        """Temel puan hesaplama"""
        score = scorer.calculate_score(
            memory=sample_memory,
            query="Python programlama"
        )
        
        assert isinstance(score, HScore)
        assert 0 <= score.total <= 1
        assert 0 <= score.similarity <= 1
        assert 0 <= score.decay <= 1
        assert 0 <= score.importance <= 1
        assert 0 <= score.frequency <= 1
    
    def test_similarity_text_matching(self, scorer, sample_memory):
        """Text benzerlik hesaplama"""
        score = scorer.calculate_score(
            memory=sample_memory,
            query="Python programlama dili"
        )
        
        # Yüksek benzerlik bekleniyor
        assert score.similarity > 0.5
    
    def test_similarity_no_match(self, scorer, sample_memory):
        """Benzerlik yok"""
        score = scorer.calculate_score(
            memory=sample_memory,
            query="JavaScript framework"
        )
        
        # Düşük benzerlik bekleniyor
        assert score.similarity < 0.3
    
    def test_decay_recent_memory(self, scorer):
        """Yeni bellek - düşük decay"""
        memory = {
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        score = scorer.calculate_score(memory, "test")
        
        # Yeni bellek, decay düşük olmalı
        assert score.decay < 0.1
    
    def test_decay_old_memory(self, scorer):
        """Eski bellek - yüksek decay"""
        old_time = (datetime.utcnow() - timedelta(days=90)).timestamp()
        
        memory = {
            "text": "test",
            "timestamp": old_time,
            "last_accessed": old_time,
            "access_count": 1,
            "importance": 0.5
        }
        
        score = scorer.calculate_score(memory, "test")
        
        # Eski bellek, decay yüksek olmalı
        assert score.decay > 0.5
    
    def test_frequency_calculation(self, scorer, sample_memory):
        """Sıklık hesaplama"""
        # Düşük access_count
        sample_memory["access_count"] = 1
        score1 = scorer.calculate_score(sample_memory, "test")
        
        # Yüksek access_count
        sample_memory["access_count"] = 100
        score2 = scorer.calculate_score(sample_memory, "test")
        
        # Yüksek access_count, yüksek frequency
        assert score2.frequency > score1.frequency
    
    def test_importance_preserved(self, scorer, sample_memory):
        """Importance değeri korunmalı"""
        sample_memory["importance"] = 0.9
        
        score = scorer.calculate_score(sample_memory, "test")
        
        assert score.importance == 0.9
    
    def test_update_weights(self, scorer):
        """Ağırlık güncelleme"""
        new_weights = HScoreWeights(alpha=0.5, beta=0.3, gamma=0.1, delta=0.1)
        
        scorer.update_weights(new_weights)
        
        weights = scorer.get_weights()
        assert abs(weights.alpha - 0.5) < 0.001
    
    def test_rank_memories(self, scorer):
        """Bellekleri sıralama"""
        memories = [
            {
                "id": "mem_1",
                "text": "Python programlama",
                "timestamp": datetime.utcnow().timestamp(),
                "last_accessed": datetime.utcnow().timestamp(),
                "access_count": 10,
                "importance": 0.9
            },
            {
                "id": "mem_2",
                "text": "JavaScript framework",
                "timestamp": (datetime.utcnow() - timedelta(days=30)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=30)).timestamp(),
                "access_count": 2,
                "importance": 0.3
            },
            {
                "id": "mem_3",
                "text": "Python Django web",
                "timestamp": datetime.utcnow().timestamp(),
                "last_accessed": datetime.utcnow().timestamp(),
                "access_count": 5,
                "importance": 0.7
            }
        ]
        
        ranked = scorer.rank_memories(memories, "Python programlama")
        
        # En alakalı ilk sırada olmalı
        assert len(ranked) == 3
        assert ranked[0]["memory"]["id"] == "mem_1"  # En yüksek benzerlik + importance
    
    def test_cosine_similarity_with_vectors(self, scorer):
        """Vektör benzerlik hesaplama"""
        memory = {
            "text": "test",
            "vector": [1.0, 0.0, 0.0],
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        query_vector = [1.0, 0.0, 0.0]  # Aynı vektör
        
        score = scorer.calculate_score(
            memory=memory,
            query="test",
            query_vector=query_vector
        )
        
        # Aynı vektör, yüksek benzerlik
        assert score.similarity > 0.9
    
    def test_score_to_dict(self, scorer, sample_memory):
        """Score dict'e çevrilebilmeli"""
        score = scorer.calculate_score(sample_memory, "test")
        
        d = score.to_dict()
        
        assert "total" in d
        assert "similarity" in d
        assert "decay" in d
        assert "importance" in d
        assert "frequency" in d
        assert "breakdown" in d


class TestHScoreFormula:
    """H(x,ψ) formül testleri"""
    
    def test_formula_correctness(self):
        """Formül doğruluğu: H(x,ψ) = α(1-similarity) + β*decay + γ*importance + δ*frequency"""
        scorer = MemoryScorer()
        
        memory = {
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 10,
            "importance": 0.8
        }
        
        score = scorer.calculate_score(memory, "test")
        
        # Manuel hesaplama
        expected = (
            scorer.weights.alpha * (1 - score.similarity) +
            scorer.weights.beta * score.decay +
            scorer.weights.gamma * score.importance +
            scorer.weights.delta * score.frequency
        )
        
        assert abs(score.total - expected) < 0.001
    
    def test_monotonic_decay(self):
        """Özellik 39: Zaman Azalması Monotonluğu - Eski bellek daha yüksek decay"""
        scorer = MemoryScorer()
        
        # Yeni bellek
        new_memory = {
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        # Eski bellek
        old_memory = {
            "text": "test",
            "timestamp": (datetime.utcnow() - timedelta(days=60)).timestamp(),
            "last_accessed": (datetime.utcnow() - timedelta(days=60)).timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        new_score = scorer.calculate_score(new_memory, "test")
        old_score = scorer.calculate_score(old_memory, "test")
        
        # Eski bellek daha yüksek decay
        assert old_score.decay > new_score.decay


class TestPropertyBasedScoring:
    """Özellik tabanlı testler"""
    
    def test_property_37_scoring_accuracy(self):
        """Özellik 37: H(x,ψ) Puanlama Doğruluğu"""
        scorer = MemoryScorer()
        
        memory = {
            "text": "test memory",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 5,
            "importance": 0.7
        }
        
        score = scorer.calculate_score(memory, "test")
        
        # Tüm bileşenler 0-1 arası
        assert 0 <= score.similarity <= 1
        assert 0 <= score.decay <= 1
        assert 0 <= score.importance <= 1
        assert 0 <= score.frequency <= 1
        
        # Total score doğru hesaplanmış
        expected = (
            scorer.weights.alpha * (1 - score.similarity) +
            scorer.weights.beta * score.decay +
            scorer.weights.gamma * score.importance +
            scorer.weights.delta * score.frequency
        )
        assert abs(score.total - expected) < 0.001
    
    def test_property_38_weight_configuration(self):
        """Özellik 38: H(x,ψ) Ağırlık Yapılandırması"""
        scorer = MemoryScorer()
        
        memory = {
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        # İlk puan
        score1 = scorer.calculate_score(memory, "test")
        
        # Ağırlıkları değiştir
        new_weights = HScoreWeights(alpha=0.1, beta=0.1, gamma=0.7, delta=0.1)
        scorer.update_weights(new_weights)
        
        # İkinci puan
        score2 = scorer.calculate_score(memory, "test")
        
        # Puanlar farklı olmalı (importance ağırlığı arttı)
        assert score1.total != score2.total
    
    def test_property_41_h_score_ranking(self):
        """Özellik 41: H(x,ψ) Tabanlı Sıralama"""
        scorer = MemoryScorer()
        
        memories = [
            {
                "id": "high_relevance",
                "text": "Python programming language tutorial",
                "timestamp": datetime.utcnow().timestamp(),
                "last_accessed": datetime.utcnow().timestamp(),
                "access_count": 20,
                "importance": 0.9
            },
            {
                "id": "low_relevance",
                "text": "Unrelated content about cooking",
                "timestamp": (datetime.utcnow() - timedelta(days=90)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=90)).timestamp(),
                "access_count": 1,
                "importance": 0.2
            }
        ]
        
        ranked = scorer.rank_memories(memories, "Python programming")
        
        # En alakalı (düşük H score) ilk sırada
        assert ranked[0]["memory"]["id"] == "high_relevance"
        assert ranked[0]["total_score"] < ranked[1]["total_score"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
