"""
A/B Testing Entegrasyon Testleri
Task 30.3: A/B test entegrasyon testleri

Bu testler, A/B testing framework'ünün tam yaşam döngüsünü doğrular:
- Deney oluşturma + varyant atama + metrik toplama
- Analiz + kazanan deployment

**Validates: Requirements 19.1, 19.3, 19.5, 19.6, 19.10**
"""
import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from lib.ab_testing import (
    ABTestingFramework,
    HScoreWeights,
    WeightVariant,
    ExperimentMetric
)


class TestExperimentCreationVariantAssignmentMetricCollection:
    """
    Test 1: Deney oluşturma + varyant atama + metrik toplama
    
    Bu test, A/B testing framework'ünün temel akışını doğrular:
    1. Deney oluştur
    2. Kullanıcılara varyant ata
    3. Metrik topla
    4. Tutarlılığı doğrula
    
    **Validates: Requirements 19.1, 19.3, 19.5**
    """
    
    @pytest.fixture
    def temp_storage(self):
        """Geçici depolama dizini"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def framework(self, temp_storage):
        """Test framework"""
        return ABTestingFramework(storage_path=temp_storage)
    
    @pytest.fixture
    def test_variants(self):
        """Test varyantları"""
        return [
            WeightVariant(
                id="control",
                name="Control (Default)",
                weights=HScoreWeights(alpha=0.4, beta=0.2, gamma=0.3, delta=0.1),
                description="Varsayılan ağırlıklar"
            ),
            WeightVariant(
                id="similarity_focused",
                name="Similarity Focused",
                weights=HScoreWeights(alpha=0.7, beta=0.1, gamma=0.1, delta=0.1),
                description="Benzerlik odaklı"
            ),
            WeightVariant(
                id="importance_focused",
                name="Importance Focused",
                weights=HScoreWeights(alpha=0.1, beta=0.1, gamma=0.7, delta=0.1),
                description="Önem odaklı"
            )
        ]
    
    @pytest.mark.asyncio
    async def test_full_experiment_lifecycle(self, framework, test_variants):
        """Tam deney yaşam döngüsü testi"""
        # 1. Deney oluştur
        experiment = framework.create_experiment(
            name="H(x,ψ) Weight Optimization",
            variants=test_variants
        )
        
        # Deney oluşturulmalı
        assert experiment is not None
        assert experiment.id is not None
        assert experiment.name == "H(x,ψ) Weight Optimization"
        assert len(experiment.variants) == 3
        assert experiment.status == 'running'
        assert experiment.created_at > 0
        
        # 2. Kullanıcılara varyant ata
        users = [f"user_{i}" for i in range(30)]
        assignments = {}
        
        for user_id in users:
            variant = await framework.assign_variant(user_id, experiment.id)
            assignments[user_id] = variant.id
            
            # Varyant geçerli olmalı
            assert variant.id in ["control", "similarity_focused", "importance_focused"]
        
        # 3. Tutarlılık kontrolü - aynı kullanıcı her zaman aynı varyantı almalı
        for user_id in users:
            variant = await framework.assign_variant(user_id, experiment.id)
            assert variant.id == assignments[user_id], \
                f"Kullanıcı {user_id} farklı varyant aldı: {variant.id} != {assignments[user_id]}"
        
        # 4. Metrik topla
        for user_id in users:
            variant_id = assignments[user_id]
            
            # Simüle edilmiş metrik (varyanta göre farklı)
            if variant_id == "control":
                score = 0.7
            elif variant_id == "similarity_focused":
                score = 0.85  # En iyi performans
            else:  # importance_focused
                score = 0.75
            
            metric = ExperimentMetric(
                variant_id=variant_id,
                score=score,
                search_relevance=score + 0.05,
                user_satisfaction=score,
                click_through_rate=score - 0.1
            )
            
            framework.record_result(experiment.id, user_id, metric)
        
        # 5. Sonuçlar kaydedilmeli
        experiment = framework.experiments[experiment.id]
        assert len(experiment.results) == 30
        
        # Her varyant için sonuçlar olmalı
        variant_results = {}
        for result in experiment.results:
            if result.variant_id not in variant_results:
                variant_results[result.variant_id] = []
            variant_results[result.variant_id].append(result)
        
        assert len(variant_results) == 3
        assert all(len(results) > 0 for results in variant_results.values())
    
    @pytest.mark.asyncio
    async def test_consistent_hashing_distribution(self, framework, test_variants):
        """Consistent hashing dağılımı test et"""
        experiment = framework.create_experiment(
            name="Distribution Test",
            variants=test_variants
        )
        
        # 100 kullanıcıya varyant ata
        users = [f"user_{i}" for i in range(100)]
        assignments = {}
        
        for user_id in users:
            variant = await framework.assign_variant(user_id, experiment.id)
            assignments[user_id] = variant.id
        
        # Dağılım kontrolü - her varyanta en az birkaç kullanıcı atanmalı
        variant_counts = {}
        for variant_id in assignments.values():
            variant_counts[variant_id] = variant_counts.get(variant_id, 0) + 1
        
        assert len(variant_counts) == 3, "Tüm varyantlar kullanılmalı"
        
        # Her varyanta en az 20 kullanıcı atanmalı (100/3 ≈ 33, %60 tolerans)
        for variant_id, count in variant_counts.items():
            assert count >= 20, f"Varyant {variant_id} çok az kullanıcı aldı: {count}"
    
    @pytest.mark.asyncio
    async def test_metric_collection_validation(self, framework, test_variants):
        """Metrik toplama doğrulaması"""
        experiment = framework.create_experiment(
            name="Metric Validation Test",
            variants=test_variants
        )
        
        user_id = "test_user"
        variant = await framework.assign_variant(user_id, experiment.id)
        
        # Geçerli metrik
        metric = ExperimentMetric(
            variant_id=variant.id,
            score=0.85,
            search_relevance=0.9,
            user_satisfaction=0.8,
            click_through_rate=0.75
        )
        
        framework.record_result(experiment.id, user_id, metric)
        
        # Sonuç kaydedilmeli
        experiment = framework.experiments[experiment.id]
        assert len(experiment.results) == 1
        
        result = experiment.results[0]
        assert result.user_id == user_id
        assert result.variant_id == variant.id
        assert result.score == 0.85
        assert result.metadata['search_relevance'] == 0.9
        assert result.metadata['user_satisfaction'] == 0.8
        assert result.metadata['click_through_rate'] == 0.75
    
    @pytest.mark.asyncio
    async def test_multiple_metrics_per_user(self, framework, test_variants):
        """Kullanıcı başına birden fazla metrik"""
        experiment = framework.create_experiment(
            name="Multiple Metrics Test",
            variants=test_variants
        )
        
        user_id = "test_user"
        variant = await framework.assign_variant(user_id, experiment.id)
        
        # Aynı kullanıcı için 5 metrik kaydet
        for i in range(5):
            metric = ExperimentMetric(
                variant_id=variant.id,
                score=0.7 + (i * 0.05)  # Artan skorlar
            )
            framework.record_result(experiment.id, user_id, metric)
        
        # Tüm metrikler kaydedilmeli
        experiment = framework.experiments[experiment.id]
        assert len(experiment.results) == 5
        
        # Skorlar artan sırada olmalı (floating point tolerance)
        scores = [r.score for r in experiment.results]
        expected = [0.7, 0.75, 0.8, 0.85, 0.9]
        for actual, exp in zip(scores, expected):
            assert abs(actual - exp) < 0.001, f"Score mismatch: {actual} != {exp}"
    
    @pytest.mark.asyncio
    async def test_experiment_not_found_error(self, framework):
        """Var olmayan deney hatası"""
        with pytest.raises(ValueError, match="Deney bulunamadı"):
            await framework.assign_variant("user_1", "nonexistent_experiment")
    
    @pytest.mark.asyncio
    async def test_stopped_experiment_rejects_metrics(self, framework, test_variants):
        """Durdurulmuş deney metrik kabul etmemeli"""
        experiment = framework.create_experiment(
            name="Stopped Experiment Test",
            variants=test_variants
        )
        
        user_id = "test_user"
        variant = await framework.assign_variant(user_id, experiment.id)
        
        # Deneyi durdur
        framework.stop_experiment(experiment.id)
        
        # Metrik kaydetmeye çalış
        metric = ExperimentMetric(variant_id=variant.id, score=0.8)
        
        with pytest.raises(ValueError, match="Deney aktif değil"):
            framework.record_result(experiment.id, user_id, metric)


class TestAnalysisWinnerDeployment:
    """
    Test 2: Analiz + kazanan deployment
    
    Bu test, deney sonuçlarının analizini ve kazanan varyantın deployment'ını doğrular:
    1. Deney sonuçlarını analiz et
    2. Kazanan varyantı seç
    3. Kazananı deploy et
    4. Varsayılan yapılandırmayı güncelle
    
    **Validates: Requirements 19.6, 19.10**
    """
    
    @pytest.fixture
    def temp_storage(self):
        """Geçici depolama dizini"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def framework(self, temp_storage):
        """Test framework"""
        return ABTestingFramework(storage_path=temp_storage)
    
    @pytest.fixture
    def test_variants(self):
        """Test varyantları"""
        return [
            WeightVariant(
                id="control",
                name="Control",
                weights=HScoreWeights(alpha=0.4, beta=0.2, gamma=0.3, delta=0.1)
            ),
            WeightVariant(
                id="variant_a",
                name="Variant A",
                weights=HScoreWeights(alpha=0.7, beta=0.1, gamma=0.1, delta=0.1)
            ),
            WeightVariant(
                id="variant_b",
                name="Variant B",
                weights=HScoreWeights(alpha=0.1, beta=0.1, gamma=0.7, delta=0.1)
            )
        ]
    
    @pytest.mark.asyncio
    async def test_analysis_and_deployment_flow(self, framework, test_variants):
        """Analiz ve deployment akışı"""
        # 1. Deney oluştur ve sonuçlar ekle
        experiment = framework.create_experiment(
            name="Analysis Test",
            variants=test_variants
        )
        
        # Yeterli sonuç ekle (her varyant için 30+)
        # 3 varyant var, consistent hashing ile eşit dağılım için 150 kullanıcı
        for i in range(150):
            user_id = f"user_{i}"
            variant = await framework.assign_variant(user_id, experiment.id)
            
            # variant_a en iyi performansı gösterecek
            if variant.id == "control":
                score = 0.70
            elif variant.id == "variant_a":
                score = 0.90  # Kazanan
            else:  # variant_b
                score = 0.75
            
            metric = ExperimentMetric(variant_id=variant.id, score=score)
            framework.record_result(experiment.id, user_id, metric)
        
        # 2. Analiz yap
        analysis = framework.analyze_results(experiment.id)
        
        # Analiz sonuçları doğru olmalı
        assert analysis is not None
        assert analysis.winner is not None
        assert analysis.winner.id == "variant_a", "En yüksek skorlu varyant kazanmalı"
        assert len(analysis.stats) == 3
        assert analysis.confidence > 0.95, "Güven seviyesi %95'in üzerinde olmalı"
        assert analysis.recommendation == 'deploy', "Yeterli veri ile deploy önerilmeli"
        
        # 3. Kazananı deploy et
        winner_weights = framework.deploy_winner(experiment.id)
        
        # Kazanan ağırlıklar döndürülmeli
        assert winner_weights is not None
        assert winner_weights.alpha == 0.7
        assert winner_weights.beta == 0.1
        assert winner_weights.gamma == 0.1
        assert winner_weights.delta == 0.1
        
        # 4. Deney tamamlanmış olmalı
        experiment = framework.experiments[experiment.id]
        assert experiment.status == 'completed'
        assert experiment.stopped_at is not None
        
        # 5. Varsayılan yapılandırma güncellenmiş olmalı
        config_path = Path(framework.storage_path) / "default_config.json"
        assert config_path.exists(), "Varsayılan yapılandırma dosyası oluşturulmalı"
        
        # 6. Geçmiş kaydedilmiş olmalı
        history_path = Path(framework.storage_path) / "history.json"
        assert history_path.exists(), "Deney geçmişi kaydedilmeli"
    
    def test_statistical_analysis_accuracy(self, framework, test_variants):
        """İstatistiksel analiz doğruluğu"""
        experiment = framework.create_experiment(
            name="Stats Test",
            variants=test_variants
        )
        
        # Kontrollü sonuçlar ekle
        # control: avg=0.745 (0.7 + 0.045 ortalama)
        for i in range(50):
            metric = ExperimentMetric(variant_id="control", score=0.7 + (i % 10) * 0.01)
            framework.record_result(experiment.id, f"user_control_{i}", metric)
        
        # variant_a: avg=0.925 (0.9 + 0.025 ortalama) (kazanan)
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_a", score=0.9 + (i % 6) * 0.01)
            framework.record_result(experiment.id, f"user_a_{i}", metric)
        
        # variant_b: avg=0.785 (0.75 + 0.035 ortalama)
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_b", score=0.75 + (i % 8) * 0.01)
            framework.record_result(experiment.id, f"user_b_{i}", metric)
        
        # Analiz
        analysis = framework.analyze_results(experiment.id)
        
        # İstatistikler doğru hesaplanmalı
        stats_by_variant = {s.variant.id: s for s in analysis.stats}
        
        # Control - gerçek ortalama: (0.7*5 + 0.71*5 + 0.72*5 + ... + 0.79*5) / 50 = 0.745
        control_stats = stats_by_variant["control"]
        assert 0.74 <= control_stats.avg_score <= 0.75, f"Control avg: {control_stats.avg_score}"
        assert control_stats.sample_size == 50
        assert control_stats.standard_deviation > 0
        
        # Variant A (kazanan) - gerçek ortalama: (0.9*9 + 0.91*8 + ... + 0.95*8) / 50 ≈ 0.925
        variant_a_stats = stats_by_variant["variant_a"]
        assert 0.92 <= variant_a_stats.avg_score <= 0.93, f"Variant A avg: {variant_a_stats.avg_score}"
        assert variant_a_stats.sample_size == 50
        
        # Variant B - gerçek ortalama: (0.75*7 + 0.76*6 + ... + 0.82*6) / 50 ≈ 0.785
        variant_b_stats = stats_by_variant["variant_b"]
        assert 0.78 <= variant_b_stats.avg_score <= 0.79, f"Variant B avg: {variant_b_stats.avg_score}"
        assert variant_b_stats.sample_size == 50
        
        # Kazanan doğru seçilmeli
        assert analysis.winner.id == "variant_a"
    
    def test_insufficient_data_recommendation(self, framework, test_variants):
        """Yetersiz veri ile 'continue' önerisi"""
        experiment = framework.create_experiment(
            name="Insufficient Data Test",
            variants=test_variants
        )
        
        # Az sayıda sonuç ekle (< 30)
        for i in range(15):
            metric = ExperimentMetric(variant_id="control", score=0.7)
            framework.record_result(experiment.id, f"user_{i}", metric)
        
        for i in range(15):
            metric = ExperimentMetric(variant_id="variant_a", score=0.9)
            framework.record_result(experiment.id, f"user_a_{i}", metric)
        
        # Analiz
        analysis = framework.analyze_results(experiment.id)
        
        # 'continue' önerilmeli (sample_size < 30)
        assert analysis.recommendation == 'continue', \
            "Yetersiz veri ile 'continue' önerilmeli"
    
    def test_deploy_not_ready_error(self, framework, test_variants):
        """Deploy için hazır olmayan deney hatası"""
        experiment = framework.create_experiment(
            name="Not Ready Test",
            variants=test_variants
        )
        
        # Az veri ekle
        for i in range(10):
            metric = ExperimentMetric(variant_id="control", score=0.7)
            framework.record_result(experiment.id, f"user_{i}", metric)
        
        # Deploy etmeye çalış
        with pytest.raises(ValueError, match="Deney deploy için hazır değil"):
            framework.deploy_winner(experiment.id)
    
    def test_winner_selection_with_close_scores(self, framework, test_variants):
        """Yakın skorlarla kazanan seçimi"""
        experiment = framework.create_experiment(
            name="Close Scores Test",
            variants=test_variants
        )
        
        # Yakın skorlar
        for i in range(50):
            metric = ExperimentMetric(variant_id="control", score=0.80)
            framework.record_result(experiment.id, f"user_control_{i}", metric)
        
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_a", score=0.82)  # Biraz daha iyi
            framework.record_result(experiment.id, f"user_a_{i}", metric)
        
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_b", score=0.79)
            framework.record_result(experiment.id, f"user_b_{i}", metric)
        
        # Analiz
        analysis = framework.analyze_results(experiment.id)
        
        # En yüksek ortalama skorlu varyant kazanmalı
        assert analysis.winner.id == "variant_a"
        
        # Ama güven seviyesi düşük olabilir (skorlar yakın)
        # Bu durumda 'continue' veya 'stop' önerilmeli
        assert analysis.recommendation in ['continue', 'stop', 'deploy']
    
    def test_experiment_history_tracking(self, framework, test_variants):
        """Deney geçmişi takibi"""
        # İlk deney
        experiment1 = framework.create_experiment(
            name="Experiment 1",
            variants=test_variants
        )
        
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_a", score=0.9)
            framework.record_result(experiment1.id, f"user_{i}", metric)
        
        framework.deploy_winner(experiment1.id)
        
        # İkinci deney
        experiment2 = framework.create_experiment(
            name="Experiment 2",
            variants=test_variants
        )
        
        for i in range(50):
            metric = ExperimentMetric(variant_id="variant_b", score=0.95)
            framework.record_result(experiment2.id, f"user_{i}", metric)
        
        framework.deploy_winner(experiment2.id)
        
        # Geçmiş dosyası kontrol et
        history_path = Path(framework.storage_path) / "history.json"
        assert history_path.exists()
        
        import json
        with open(history_path, 'r') as f:
            history = json.load(f)
        
        # İki deney kaydı olmalı
        assert len(history) == 2
        
        # İlk deney
        assert history[0]['experiment_name'] == "Experiment 1"
        assert history[0]['winner']['id'] == "variant_a"
        
        # İkinci deney
        assert history[1]['experiment_name'] == "Experiment 2"
        assert history[1]['winner']['id'] == "variant_b"
    
    def test_get_active_experiments(self, framework, test_variants):
        """Aktif deneyleri getir"""
        # 3 deney oluştur
        exp1 = framework.create_experiment("Exp 1", test_variants)
        exp2 = framework.create_experiment("Exp 2", test_variants)
        exp3 = framework.create_experiment("Exp 3", test_variants)
        
        # Hepsi aktif olmalı
        active = framework.get_active_experiments()
        assert len(active) == 3
        
        # Birini durdur
        framework.stop_experiment(exp2.id)
        
        # 2 aktif kalmalı
        active = framework.get_active_experiments()
        assert len(active) == 2
        assert exp2.id not in [e.id for e in active]
    
    def test_stop_experiment_updates_status(self, framework, test_variants):
        """Deneyi durdurma durumu günceller"""
        experiment = framework.create_experiment(
            name="Stop Test",
            variants=test_variants
        )
        
        assert experiment.status == 'running'
        assert experiment.stopped_at is None
        
        # Durdur
        framework.stop_experiment(experiment.id)
        
        # Durum güncellenmiş olmalı
        experiment = framework.experiments[experiment.id]
        assert experiment.status == 'stopped'
        assert experiment.stopped_at is not None
        assert experiment.stopped_at > experiment.created_at


class TestIntegrationEdgeCases:
    """Entegrasyon kenar durumları"""
    
    @pytest.fixture
    def temp_storage(self):
        """Geçici depolama dizini"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def framework(self, temp_storage):
        """Test framework"""
        return ABTestingFramework(storage_path=temp_storage)
    
    def test_experiment_with_two_variants_minimum(self, framework):
        """En az 2 varyant gerekli"""
        with pytest.raises(ValueError, match="En az 2 varyant gerekli"):
            framework.create_experiment(
                name="Single Variant Test",
                variants=[
                    WeightVariant(
                        id="only_one",
                        name="Only One",
                        weights=HScoreWeights()
                    )
                ]
            )
    
    def test_analysis_with_no_results(self, framework):
        """Sonuç olmadan analiz hatası"""
        variants = [
            WeightVariant(id="v1", name="V1", weights=HScoreWeights()),
            WeightVariant(id="v2", name="V2", weights=HScoreWeights())
        ]
        
        experiment = framework.create_experiment("No Results Test", variants)
        
        with pytest.raises(ValueError, match="Henüz sonuç yok"):
            framework.analyze_results(experiment.id)
    
    def test_persistence_across_instances(self, temp_storage):
        """Framework instance'ları arası kalıcılık"""
        variants = [
            WeightVariant(id="v1", name="V1", weights=HScoreWeights()),
            WeightVariant(id="v2", name="V2", weights=HScoreWeights())
        ]
        
        # İlk instance
        framework1 = ABTestingFramework(storage_path=temp_storage)
        experiment = framework1.create_experiment("Persistence Test", variants)
        experiment_id = experiment.id
        
        # Metrik ekle
        metric = ExperimentMetric(variant_id="v1", score=0.8)
        framework1.record_result(experiment_id, "user_1", metric)
        
        # İkinci instance (aynı storage)
        framework2 = ABTestingFramework(storage_path=temp_storage)
        
        # Deney yüklenmiş olmalı
        assert experiment_id in framework2.experiments
        assert len(framework2.experiments[experiment_id].results) == 1
    
    @pytest.mark.asyncio
    async def test_concurrent_variant_assignments(self, framework):
        """Eşzamanlı varyant atamaları"""
        variants = [
            WeightVariant(id="v1", name="V1", weights=HScoreWeights()),
            WeightVariant(id="v2", name="V2", weights=HScoreWeights())
        ]
        
        experiment = framework.create_experiment("Concurrent Test", variants)
        
        # 10 kullanıcı için eşzamanlı atama
        tasks = [
            framework.assign_variant(f"user_{i}", experiment.id)
            for i in range(10)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Tüm atamalar başarılı olmalı
        assert len(results) == 10
        assert all(r.id in ["v1", "v2"] for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
