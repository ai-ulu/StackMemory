"""
H(x,ψ) Entegrasyon Testleri
Task 30.1: H(x,ψ) entegrasyon testleri

Bu testler, H(x,ψ) puanlama sisteminin diğer bileşenlerle entegrasyonunu doğrular.

**Validates: Requirements 16.7, 16.10**
"""
import pytest
from datetime import datetime, timedelta
from lib.memory_scorer import MemoryScorer, HScoreWeights


class TestSearchWithHScoreRanking:
    """
    Test 1: Arama + H(x,ψ) puanlama entegrasyonu
    **Validates: Requirement 16.7**
    """
    
    @pytest.fixture
    def scorer(self):
        """Test scorer"""
        return MemoryScorer()
    
    @pytest.fixture
    def sample_memories(self):
        """Örnek bellek seti"""
        now = datetime.utcnow().timestamp()
        
        return [
            {
                "id": "mem_1",
                "text": "Python programlama dili tutorial",
                "timestamp": now,
                "last_accessed": now,
                "access_count": 20,
                "importance": 0.9,
                "vector": [0.8, 0.2, 0.1, 0.3, 0.5]
            },
            {
                "id": "mem_2",
                "text": "JavaScript framework React",
                "timestamp": (datetime.utcnow() - timedelta(days=30)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=30)).timestamp(),
                "access_count": 5,
                "importance": 0.6,
                "vector": [0.2, 0.8, 0.3, 0.1, 0.4]
            },
            {
                "id": "mem_3",
                "text": "Python Django web framework",
                "timestamp": (datetime.utcnow() - timedelta(days=7)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=7)).timestamp(),
                "access_count": 10,
                "importance": 0.7,
                "vector": [0.7, 0.3, 0.2, 0.4, 0.5]
            },
            {
                "id": "mem_4",
                "text": "Machine learning algorithms",
                "timestamp": (datetime.utcnow() - timedelta(days=60)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=60)).timestamp(),
                "access_count": 2,
                "importance": 0.4,
                "vector": [0.1, 0.1, 0.9, 0.2, 0.3]
            },
            {
                "id": "mem_5",
                "text": "Python data science pandas numpy",
                "timestamp": (datetime.utcnow() - timedelta(days=3)).timestamp(),
                "last_accessed": (datetime.utcnow() - timedelta(days=3)).timestamp(),
                "access_count": 15,
                "importance": 0.8,
                "vector": [0.6, 0.2, 0.4, 0.5, 0.6]
            }
        ]
    
    def test_search_results_ranked_by_hscore(self, scorer, sample_memories):
        """Arama sonuçları H(x,ψ) puanına göre sıralanmalı"""
        query = "Python programlama"
        
        # Bellekleri sırala
        ranked = scorer.rank_memories(sample_memories, query)
        
        # Sonuçlar döndürülmeli
        assert len(ranked) == 5
        
        # Her sonuç gerekli alanları içermeli
        for result in ranked:
            assert "memory" in result
            assert "h_score" in result
            assert "total_score" in result
            
            # H(x,ψ) bileşenleri mevcut olmalı
            h_score = result["h_score"]
            assert "total" in h_score
            assert "similarity" in h_score
            assert "decay" in h_score
            assert "importance" in h_score
            assert "frequency" in h_score
        
        # Sıralama doğruluğu: total_score artan sırada (düşük = alakalı)
        for i in range(len(ranked) - 1):
            assert ranked[i]["total_score"] <= ranked[i + 1]["total_score"], \
                f"Sıralama hatası: {ranked[i]['total_score']} > {ranked[i+1]['total_score']}"
    
    def test_most_relevant_memory_first(self, scorer, sample_memories):
        """En alakalı bellek ilk sırada olmalı"""
        query = "Python programlama"
        
        ranked = scorer.rank_memories(sample_memories, query)
        
        # İlk sonuç en alakalı olmalı (mem_1: yüksek similarity, importance, frequency)
        first_result = ranked[0]
        assert first_result["memory"]["id"] == "mem_1"
        
        # İlk sonucun puanı en düşük olmalı
        assert first_result["total_score"] < ranked[1]["total_score"]
    
    def test_old_low_importance_memory_last(self, scorer, sample_memories):
        """Eski ve düşük önem bellekler son sırada olmalı"""
        query = "Python programlama"
        
        ranked = scorer.rank_memories(sample_memories, query)
        
        # mem_4 veya mem_2 son sırada olabilir (ikisi de düşük alakalı)
        # mem_4: machine learning (düşük similarity)
        # mem_2: JavaScript (düşük similarity, eski)
        last_result = ranked[-1]
        assert last_result["memory"]["id"] in ["mem_4", "mem_2"]
        
        # Son sonucun puanı en yüksek olmalı
        assert last_result["total_score"] > ranked[-2]["total_score"]
    
    def test_ranking_considers_all_factors(self, scorer, sample_memories):
        """Sıralama tüm faktörleri dikkate almalı"""
        query = "Python"
        
        ranked = scorer.rank_memories(sample_memories, query)
        
        # mem_1: Yüksek similarity, yeni, yüksek importance, yüksek frequency
        # mem_5: Orta similarity, yeni, yüksek importance, yüksek frequency
        # mem_3: Orta similarity, orta yaş, orta importance, orta frequency
        # mem_2: Düşük similarity, eski, orta importance, düşük frequency
        # mem_4: Düşük similarity, çok eski, düşük importance, çok düşük frequency
        
        # İlk 3 Python ile ilgili olmalı
        top_3_ids = [r["memory"]["id"] for r in ranked[:3]]
        assert "mem_1" in top_3_ids
        assert "mem_5" in top_3_ids
        assert "mem_3" in top_3_ids
    
    def test_empty_query_still_ranks(self, scorer, sample_memories):
        """Boş query ile bile sıralama yapılmalı"""
        query = ""
        
        ranked = scorer.rank_memories(sample_memories, query)
        
        # Sonuçlar döndürülmeli
        assert len(ranked) == 5
        
        # Sıralama decay, importance, frequency'ye göre olmalı
        # (similarity 0 olacak)
        for i in range(len(ranked) - 1):
            assert ranked[i]["total_score"] <= ranked[i + 1]["total_score"]
    
    def test_vector_similarity_used_when_available(self, scorer, sample_memories):
        """Vektör varsa cosine similarity kullanılmalı"""
        query = "Python"
        query_vector = [0.8, 0.2, 0.1, 0.3, 0.5]  # mem_1'e benzer
        
        ranked = scorer.rank_memories(sample_memories, query, query_vector=query_vector)
        
        # mem_1 veya mem_3 ilk sırada olmalı (ikisi de Python ile ilgili ve benzer vektörler)
        assert ranked[0]["memory"]["id"] in ["mem_1", "mem_3"]
        
        # Similarity puanı yüksek olmalı
        assert ranked[0]["h_score"]["similarity"] > 0.7


class TestAccessCounterUpdate:
    """
    Test 2: Erişim sayacı güncelleme entegrasyonu
    **Validates: Requirement 16.10**
    """
    
    @pytest.fixture
    def scorer(self):
        """Test scorer"""
        return MemoryScorer()
    
    def test_access_count_increases_frequency(self, scorer):
        """accessCount artışı frequency'yi artırmalı"""
        base_memory = {
            "id": "mem_test",
            "text": "test memory",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "importance": 0.5
        }
        
        # Düşük access_count
        memory_low = {**base_memory, "access_count": 1}
        score_low = scorer.calculate_score(memory_low, "test")
        
        # Orta access_count
        memory_mid = {**base_memory, "access_count": 10}
        score_mid = scorer.calculate_score(memory_mid, "test")
        
        # Yüksek access_count
        memory_high = {**base_memory, "access_count": 100}
        score_high = scorer.calculate_score(memory_high, "test")
        
        # Frequency artmalı
        assert score_low.frequency < score_mid.frequency
        assert score_mid.frequency < score_high.frequency
    
    def test_last_accessed_update_affects_decay(self, scorer):
        """lastAccessed güncellemesi decay'i etkilemeli"""
        now = datetime.utcnow().timestamp()
        
        base_memory = {
            "id": "mem_test",
            "text": "test memory",
            "timestamp": (datetime.utcnow() - timedelta(days=60)).timestamp(),
            "access_count": 5,
            "importance": 0.5
        }
        
        # Eski erişim
        memory_old_access = {
            **base_memory,
            "last_accessed": (datetime.utcnow() - timedelta(days=60)).timestamp()
        }
        score_old = scorer.calculate_score(memory_old_access, "test")
        
        # Yeni erişim
        memory_new_access = {
            **base_memory,
            "last_accessed": now
        }
        score_new = scorer.calculate_score(memory_new_access, "test")
        
        # Yeni erişim daha düşük decay
        assert score_new.decay < score_old.decay
    
    def test_multiple_accesses_simulation(self, scorer):
        """Birden fazla erişim simülasyonu"""
        memory = {
            "id": "mem_test",
            "text": "test memory",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        scores = []
        
        # 5 erişim simüle et
        for i in range(1, 6):
            memory["access_count"] = i
            memory["last_accessed"] = datetime.utcnow().timestamp()
            
            score = scorer.calculate_score(memory, "test")
            scores.append(score)
        
        # Her erişimde frequency artmalı
        for i in range(len(scores) - 1):
            assert scores[i].frequency <= scores[i + 1].frequency
        
        # Decay düşük kalmalı (sürekli erişiliyor)
        for score in scores:
            assert score.decay < 0.1
    
    def test_access_count_zero_handled(self, scorer):
        """accessCount 0 veya eksik olduğunda varsayılan değer kullanılmalı"""
        memory_no_count = {
            "id": "mem_test",
            "text": "test memory",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "importance": 0.5
        }
        
        score = scorer.calculate_score(memory_no_count, "test")
        
        # Varsayılan frequency hesaplanmalı (access_count=1)
        assert score.frequency >= 0.0
        assert score.frequency <= 1.0
    
    def test_access_pattern_affects_ranking(self, scorer):
        """Erişim paterni sıralamayı etkilemeli"""
        now = datetime.utcnow().timestamp()
        
        memories = [
            {
                "id": "frequently_accessed",
                "text": "Python tutorial guide",
                "timestamp": now,
                "last_accessed": now,
                "access_count": 50,  # Çok sık erişilen
                "importance": 0.7
            },
            {
                "id": "rarely_accessed",
                "text": "Python guide",
                "timestamp": now,
                "last_accessed": now,
                "access_count": 2,  # Az erişilen
                "importance": 0.7
            }
        ]
        
        ranked = scorer.rank_memories(memories, "Python tutorial")
        
        # Sık erişilen VE daha yüksek similarity olan ilk sırada olmalı
        assert ranked[0]["memory"]["id"] == "frequently_accessed"


class TestWeightConfiguration:
    """
    Test 3: Ağırlık yapılandırması entegrasyonu
    **Validates: Requirement 16.5**
    """
    
    def test_different_weights_different_scores(self):
        """Farklı ağırlıklar farklı puanlar üretmeli"""
        memory = {
            "id": "mem_test",
            "text": "Python programming",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 10,
            "importance": 0.8
        }
        
        query = "Python"
        
        # Varsayılan ağırlıklar
        scorer_default = MemoryScorer()
        score_default = scorer_default.calculate_score(memory, query)
        
        # Similarity ağırlığı yüksek
        scorer_similarity = MemoryScorer(
            weights=HScoreWeights(alpha=0.7, beta=0.1, gamma=0.1, delta=0.1)
        )
        score_similarity = scorer_similarity.calculate_score(memory, query)
        
        # Importance ağırlığı yüksek
        scorer_importance = MemoryScorer(
            weights=HScoreWeights(alpha=0.1, beta=0.1, gamma=0.7, delta=0.1)
        )
        score_importance = scorer_importance.calculate_score(memory, query)
        
        # Puanlar farklı olmalı
        assert score_default.total != score_similarity.total
        assert score_default.total != score_importance.total
        assert score_similarity.total != score_importance.total
    
    def test_weight_update_affects_subsequent_scoring(self):
        """Ağırlık güncellemesi sonraki puanlamaları etkilemeli"""
        scorer = MemoryScorer()
        
        memory = {
            "id": "mem_test",
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 5,
            "importance": 0.9
        }
        
        # İlk puan
        score1 = scorer.calculate_score(memory, "test")
        
        # Ağırlıkları güncelle (importance'ı artır)
        new_weights = HScoreWeights(alpha=0.1, beta=0.1, gamma=0.7, delta=0.1)
        scorer.update_weights(new_weights)
        
        # İkinci puan
        score2 = scorer.calculate_score(memory, "test")
        
        # Puanlar farklı olmalı
        assert score1.total != score2.total
        
        # Yeni ağırlıklar kullanılmalı (floating point tolerance)
        assert abs(scorer.get_weights().gamma - 0.7) < 0.001
    
    def test_weight_configuration_affects_ranking(self):
        """Ağırlık yapılandırması sıralamayı etkilemeli"""
        # İki bellek: biri çok önemli ama alakasız, diğeri alakalı ama önemsiz
        memories = [
            {
                "id": "high_importance",
                "text": "Critical system documentation",
                "timestamp": datetime.utcnow().timestamp(),
                "last_accessed": datetime.utcnow().timestamp(),
                "access_count": 5,
                "importance": 0.95  # Çok yüksek önem
            },
            {
                "id": "high_similarity",
                "text": "Python programming language tutorial guide",
                "timestamp": datetime.utcnow().timestamp(),
                "last_accessed": datetime.utcnow().timestamp(),
                "access_count": 5,
                "importance": 0.1  # Çok düşük önem
            }
        ]
        
        query = "Python programming language tutorial"
        
        # Similarity ağırlığı yüksek - alakalı içerik kazanmalı
        scorer_similarity = MemoryScorer(
            weights=HScoreWeights(alpha=0.9, beta=0.03, gamma=0.03, delta=0.04)
        )
        ranked_similarity = scorer_similarity.rank_memories(memories, query)
        
        # high_similarity ilk sırada olmalı (query ile alakalı)
        assert ranked_similarity[0]["memory"]["id"] == "high_similarity"
        
        # Farklı ağırlıklarla puanlar değişmeli
        scorer_default = MemoryScorer()
        ranked_default = scorer_default.rank_memories(memories, query)
        
        # Varsayılan ağırlıklarla da high_similarity ilk sırada (similarity dominant)
        # Ama puanlar farklı olmalı
        assert ranked_similarity[0]["total_score"] != ranked_default[0]["total_score"]
    
    def test_weights_normalized_on_update(self):
        """Ağırlıklar güncelleme sırasında normalize edilmeli"""
        scorer = MemoryScorer()
        
        # Normalize olmayan ağırlıklar
        new_weights = HScoreWeights(alpha=2.0, beta=1.0, gamma=1.0, delta=0.5)
        scorer.update_weights(new_weights)
        
        weights = scorer.get_weights()
        
        # Toplam 1.0 olmalı
        total = weights.alpha + weights.beta + weights.gamma + weights.delta
        assert abs(total - 1.0) < 0.001
    
    def test_extreme_weight_configurations(self):
        """Uç ağırlık yapılandırmaları test edilmeli"""
        memory = {
            "id": "mem_test",
            "text": "Python programming",
            "timestamp": (datetime.utcnow() - timedelta(days=90)).timestamp(),
            "last_accessed": (datetime.utcnow() - timedelta(days=90)).timestamp(),
            "access_count": 100,
            "importance": 0.9
        }
        
        query = "Python"
        
        # Sadece similarity
        scorer_only_similarity = MemoryScorer(
            weights=HScoreWeights(alpha=1.0, beta=0.0, gamma=0.0, delta=0.0)
        )
        score_similarity = scorer_only_similarity.calculate_score(memory, query)
        
        # Sadece decay
        scorer_only_decay = MemoryScorer(
            weights=HScoreWeights(alpha=0.0, beta=1.0, gamma=0.0, delta=0.0)
        )
        score_decay = scorer_only_decay.calculate_score(memory, query)
        
        # Sadece importance
        scorer_only_importance = MemoryScorer(
            weights=HScoreWeights(alpha=0.0, beta=0.0, gamma=1.0, delta=0.0)
        )
        score_importance = scorer_only_importance.calculate_score(memory, query)
        
        # Sadece frequency
        scorer_only_frequency = MemoryScorer(
            weights=HScoreWeights(alpha=0.0, beta=0.0, gamma=0.0, delta=1.0)
        )
        score_frequency = scorer_only_frequency.calculate_score(memory, query)
        
        # Tüm puanlar farklı olmalı
        scores = [
            score_similarity.total,
            score_decay.total,
            score_importance.total,
            score_frequency.total
        ]
        
        assert len(set(scores)) == 4  # Hepsi farklı


class TestIntegrationEdgeCases:
    """Entegrasyon kenar durumları"""
    
    @pytest.fixture
    def scorer(self):
        """Test scorer"""
        return MemoryScorer()
    
    def test_empty_memory_list(self, scorer):
        """Boş bellek listesi zarif bir şekilde işlenmeli"""
        ranked = scorer.rank_memories([], "test query")
        
        assert ranked == []
    
    def test_single_memory(self, scorer):
        """Tek bellek sıralanabilmeli"""
        memory = {
            "id": "mem_1",
            "text": "test",
            "timestamp": datetime.utcnow().timestamp(),
            "last_accessed": datetime.utcnow().timestamp(),
            "access_count": 1,
            "importance": 0.5
        }
        
        ranked = scorer.rank_memories([memory], "test")
        
        assert len(ranked) == 1
        assert ranked[0]["memory"]["id"] == "mem_1"
    
    def test_memories_with_missing_fields(self, scorer):
        """Eksik alanları olan bellekler varsayılan değerlerle işlenmeli"""
        memory_minimal = {
            "id": "mem_minimal",
            "text": "test"
            # timestamp, last_accessed, access_count, importance eksik
        }
        
        score = scorer.calculate_score(memory_minimal, "test")
        
        # Varsayılan değerler kullanılmalı
        assert score.importance == 0.5  # Varsayılan
        assert score.frequency >= 0.0  # access_count=1 varsayılan
        assert score.decay >= 0.0
    
    def test_identical_scores_stable_order(self, scorer):
        """Aynı puanlı bellekler stabil sırada kalmalı"""
        # Aynı timestamp kullan
        now = datetime.utcnow().timestamp()
        
        memories = [
            {
                "id": f"mem_{i}",
                "text": "identical content",
                "timestamp": now,
                "last_accessed": now,
                "access_count": 5,
                "importance": 0.5
            }
            for i in range(5)
        ]
        
        ranked = scorer.rank_memories(memories, "identical")
        
        # Tüm puanlar aynı olmalı (floating point tolerance ile)
        scores = [r["total_score"] for r in ranked]
        assert all(abs(s - scores[0]) < 1e-6 for s in scores), "Tüm puanlar aynı olmalı"
        
        # Sıra korunmalı
        ids = [r["memory"]["id"] for r in ranked]
        assert ids == ["mem_0", "mem_1", "mem_2", "mem_3", "mem_4"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
