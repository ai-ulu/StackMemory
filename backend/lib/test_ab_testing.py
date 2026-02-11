"""
A/B Testing Framework - Temel Testler
"""

import pytest
import asyncio
from lib.ab_testing import (
    ABTestingFramework,
    HScoreWeights,
    WeightVariant,
    ExperimentMetric
)


def test_create_experiment():
    """Deney oluşturma testi"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(
            id="control",
            name="Control",
            weights=HScoreWeights(alpha=0.4, beta=0.2, gamma=0.3, delta=0.1)
        ),
        WeightVariant(
            id="variant_a",
            name="Variant A",
            weights=HScoreWeights(alpha=0.5, beta=0.2, gamma=0.2, delta=0.1)
        )
    ]
    
    experiment = framework.create_experiment("Test Experiment", variants)
    
    assert experiment.name == "Test Experiment"
    assert len(experiment.variants) == 2
    assert experiment.status == "running"


@pytest.mark.asyncio
async def test_assign_variant_consistency():
    """Varyant atama tutarlılığı testi - Özellik 49"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(
            id="control",
            name="Control",
            weights=HScoreWeights()
        ),
        WeightVariant(
            id="variant_a",
            name="Variant A",
            weights=HScoreWeights(alpha=0.5, beta=0.2, gamma=0.2, delta=0.1)
        )
    ]
    
    experiment = framework.create_experiment("Consistency Test", variants)
    
    # Aynı kullanıcı her zaman aynı varyantı almalı
    user_id = "user_123"
    
    variant1 = await framework.assign_variant(user_id, experiment.id)
    variant2 = await framework.assign_variant(user_id, experiment.id)
    variant3 = await framework.assign_variant(user_id, experiment.id)
    
    assert variant1.id == variant2.id == variant3.id


def test_record_result():
    """Metrik kaydetme testi - Özellik 51"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(
            id="control",
            name="Control",
            weights=HScoreWeights()
        ),
        WeightVariant(
            id="variant_a",
            name="Variant A",
            weights=HScoreWeights(alpha=0.5, beta=0.2, gamma=0.2, delta=0.1)
        )
    ]
    
    experiment = framework.create_experiment("Metric Test", variants)
    
    # Metrik kaydet
    metric = ExperimentMetric(
        variant_id="control",
        score=0.85,
        search_relevance=0.9,
        user_satisfaction=0.8
    )
    
    framework.record_result(experiment.id, "user_123", metric)
    
    assert len(experiment.results) == 1
    assert experiment.results[0].score == 0.85


def test_analyze_results():
    """İstatistiksel analiz testi - Özellik 52"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(
            id="control",
            name="Control",
            weights=HScoreWeights()
        ),
        WeightVariant(
            id="variant_a",
            name="Variant A",
            weights=HScoreWeights(alpha=0.5, beta=0.2, gamma=0.2, delta=0.1)
        )
    ]
    
    experiment = framework.create_experiment("Analysis Test", variants)
    
    # Control için sonuçlar
    for i in range(50):
        metric = ExperimentMetric(
            variant_id="control",
            score=0.75 + (i % 10) * 0.01
        )
        framework.record_result(experiment.id, f"user_{i}", metric)
    
    # Variant A için sonuçlar (daha iyi)
    for i in range(50):
        metric = ExperimentMetric(
            variant_id="variant_a",
            score=0.85 + (i % 10) * 0.01
        )
        framework.record_result(experiment.id, f"user_{i+50}", metric)
    
    # Analiz
    analysis = framework.analyze_results(experiment.id)
    
    assert len(analysis.stats) == 2
    assert analysis.winner.id == "variant_a"  # Daha yüksek puan
    assert analysis.confidence > 0.0


def test_get_active_experiments():
    """Aktif deney listesi testi"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(id="control", name="Control", weights=HScoreWeights()),
        WeightVariant(id="variant_a", name="Variant A", weights=HScoreWeights())
    ]
    
    exp1 = framework.create_experiment("Exp 1", variants)
    exp2 = framework.create_experiment("Exp 2", variants)
    
    active = framework.get_active_experiments()
    
    assert len(active) >= 2
    assert all(exp.status == "running" for exp in active)


def test_stop_experiment():
    """Deney durdurma testi"""
    framework = ABTestingFramework(storage_path="data/test_ab")
    
    variants = [
        WeightVariant(id="control", name="Control", weights=HScoreWeights()),
        WeightVariant(id="variant_a", name="Variant A", weights=HScoreWeights())
    ]
    
    experiment = framework.create_experiment("Stop Test", variants)
    
    framework.stop_experiment(experiment.id)
    
    assert experiment.status == "stopped"
    assert experiment.stopped_at is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
