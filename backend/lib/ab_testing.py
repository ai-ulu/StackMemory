"""
A/B Testing Framework - H(x,ψ) Ağırlık Optimizasyonu

Bu modül, farklı H(x,ψ) ağırlıklarını test etmek için A/B test framework'ü sağlar.
Consistent hashing ile kullanıcı atama, metrik toplama ve istatistiksel analiz içerir.
"""

import hashlib
import json
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Literal
from pathlib import Path
import math


@dataclass
class HScoreWeights:
    """H(x,ψ) ağırlıkları"""
    alpha: float = 0.4  # Benzerlik ağırlığı
    beta: float = 0.2   # Zaman azalması ağırlığı
    gamma: float = 0.3  # Önem ağırlığı
    delta: float = 0.1  # Sıklık ağırlığı


@dataclass
class WeightVariant:
    """Deney varyantı"""
    id: str
    name: str
    weights: HScoreWeights
    description: Optional[str] = None


@dataclass
class ExperimentMetric:
    """Deney metriği"""
    variant_id: str
    score: float
    search_relevance: Optional[float] = None
    user_satisfaction: Optional[float] = None
    click_through_rate: Optional[float] = None


@dataclass
class ExperimentResult:
    """Deney sonucu"""
    user_id: str
    variant_id: str
    score: float
    timestamp: float
    metadata: Optional[Dict] = None


@dataclass
class VariantStats:
    """Varyant istatistikleri"""
    variant: WeightVariant
    avg_score: float
    sample_size: int
    confidence: float
    standard_deviation: float


@dataclass
class ExperimentAnalysis:
    """Deney analizi"""
    winner: WeightVariant
    stats: List[VariantStats]
    recommendation: Literal['deploy', 'continue', 'stop']
    confidence: float


@dataclass
class Experiment:
    """A/B Test Deneyi"""
    id: str
    name: str
    variants: List[WeightVariant]
    results: List[ExperimentResult]
    status: Literal['running', 'stopped', 'completed']
    created_at: float
    stopped_at: Optional[float] = None


class ABTestingFramework:
    """
    A/B Test Framework - H(x,ψ) ağırlık optimizasyonu
    
    Özellikler:
    - Consistent hashing ile kullanıcı atama
    - Metrik toplama ve saklama
    - İstatistiksel analiz (%95 güven seviyesi)
    - Kazanan deployment
    """
    
    def __init__(self, storage_path: str = "data/ab_testing"):
        """
        Args:
            storage_path: Deney verilerinin saklanacağı dizin
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.experiments: Dict[str, Experiment] = {}
        self.user_assignments: Dict[str, Dict[str, str]] = {}  # {experiment_id: {user_id: variant_id}}
        
        self._load_experiments()
    
    def create_experiment(
        self,
        name: str,
        variants: List[WeightVariant]
    ) -> Experiment:
        """
        Yeni deney oluştur
        
        Args:
            name: Deney adı
            variants: Test edilecek varyantlar
            
        Returns:
            Oluşturulan deney
            
        Validates: Gereksinim 19.1
        """
        if len(variants) < 2:
            raise ValueError("En az 2 varyant gerekli")
        
        experiment_id = self._generate_experiment_id(name)
        
        experiment = Experiment(
            id=experiment_id,
            name=name,
            variants=variants,
            results=[],
            status='running',
            created_at=time.time()
        )
        
        self.experiments[experiment_id] = experiment
        self.user_assignments[experiment_id] = {}
        
        self._save_experiment(experiment)
        
        return experiment
    
    async def assign_variant(
        self,
        user_id: str,
        experiment_id: str
    ) -> WeightVariant:
        """
        Kullanıcıya varyant ata (consistent hashing)
        
        Aynı kullanıcı her zaman aynı varyantı alır.
        
        Args:
            user_id: Kullanıcı ID
            experiment_id: Deney ID
            
        Returns:
            Atanan varyant
            
        Validates: Gereksinim 19.2, 19.3
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Deney bulunamadı: {experiment_id}")
        
        experiment = self.experiments[experiment_id]
        
        # Önce cache'den kontrol et
        if user_id in self.user_assignments[experiment_id]:
            variant_id = self.user_assignments[experiment_id][user_id]
            return next(v for v in experiment.variants if v.id == variant_id)
        
        # Consistent hashing ile varyant seç
        variant = self._consistent_hash_variant(user_id, experiment_id, experiment.variants)
        
        # Cache'e kaydet
        self.user_assignments[experiment_id][user_id] = variant.id
        
        return variant
    
    def record_result(
        self,
        experiment_id: str,
        user_id: str,
        metric: ExperimentMetric
    ) -> None:
        """
        Deney sonucu kaydet
        
        Args:
            experiment_id: Deney ID
            user_id: Kullanıcı ID
            metric: Metrik verisi
            
        Validates: Gereksinim 19.4, 19.5
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Deney bulunamadı: {experiment_id}")
        
        experiment = self.experiments[experiment_id]
        
        if experiment.status != 'running':
            raise ValueError(f"Deney aktif değil: {experiment.status}")
        
        result = ExperimentResult(
            user_id=user_id,
            variant_id=metric.variant_id,
            score=metric.score,
            timestamp=time.time(),
            metadata={
                'search_relevance': metric.search_relevance,
                'user_satisfaction': metric.user_satisfaction,
                'click_through_rate': metric.click_through_rate
            }
        )
        
        experiment.results.append(result)
        self._save_experiment(experiment)
    
    def analyze_results(self, experiment_id: str) -> ExperimentAnalysis:
        """
        Deney sonuçlarını analiz et
        
        İstatistiksel analiz:
        - Ortalama puan
        - Standart sapma
        - Güven seviyesi (%95)
        - Kazanan seçimi
        
        Args:
            experiment_id: Deney ID
            
        Returns:
            Analiz sonuçları
            
        Validates: Gereksinim 19.6, 19.7
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Deney bulunamadı: {experiment_id}")
        
        experiment = self.experiments[experiment_id]
        
        # Her varyant için istatistikleri hesapla
        variant_stats: List[VariantStats] = []
        
        for variant in experiment.variants:
            variant_results = [
                r for r in experiment.results
                if r.variant_id == variant.id
            ]
            
            if not variant_results:
                continue
            
            scores = [r.score for r in variant_results]
            avg_score = sum(scores) / len(scores)
            
            # Standart sapma
            variance = sum((x - avg_score) ** 2 for x in scores) / len(scores)
            std_dev = math.sqrt(variance)
            
            # Güven seviyesi (%95 için z-score = 1.96)
            z_score = 1.96
            margin_of_error = z_score * (std_dev / math.sqrt(len(scores)))
            confidence = 1.0 - (margin_of_error / avg_score) if avg_score > 0 else 0.0
            
            variant_stats.append(VariantStats(
                variant=variant,
                avg_score=avg_score,
                sample_size=len(scores),
                confidence=min(confidence, 1.0),
                standard_deviation=std_dev
            ))
        
        if not variant_stats:
            raise ValueError("Henüz sonuç yok")
        
        # Kazananı seç (en yüksek ortalama puan + %95 güven)
        winner = max(variant_stats, key=lambda s: s.avg_score)
        
        # Öneri
        if winner.confidence >= 0.95 and winner.sample_size >= 30:
            recommendation = 'deploy'
        elif any(s.sample_size < 30 for s in variant_stats):
            recommendation = 'continue'
        else:
            recommendation = 'stop'
        
        return ExperimentAnalysis(
            winner=winner.variant,
            stats=variant_stats,
            recommendation=recommendation,
            confidence=winner.confidence
        )
    
    def get_active_experiments(self) -> List[Experiment]:
        """
        Aktif deneyleri getir
        
        Returns:
            Aktif deney listesi
            
        Validates: Gereksinim 19.9
        """
        return [
            exp for exp in self.experiments.values()
            if exp.status == 'running'
        ]
    
    def stop_experiment(self, experiment_id: str) -> None:
        """
        Deneyi durdur
        
        Args:
            experiment_id: Deney ID
            
        Validates: Gereksinim 19.9
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Deney bulunamadı: {experiment_id}")
        
        experiment = self.experiments[experiment_id]
        experiment.status = 'stopped'
        experiment.stopped_at = time.time()
        
        self._save_experiment(experiment)
    
    def deploy_winner(self, experiment_id: str) -> HScoreWeights:
        """
        Kazanan varyantı deploy et
        
        Kazanan varyantın ağırlıklarını varsayılan yapılandırma olarak ayarla.
        
        Args:
            experiment_id: Deney ID
            
        Returns:
            Kazanan ağırlıklar
            
        Validates: Gereksinim 19.8, 19.10
        """
        analysis = self.analyze_results(experiment_id)
        
        if analysis.recommendation != 'deploy':
            raise ValueError(
                f"Deney deploy için hazır değil: {analysis.recommendation}"
            )
        
        # Deneyi tamamla
        experiment = self.experiments[experiment_id]
        experiment.status = 'completed'
        experiment.stopped_at = time.time()
        self._save_experiment(experiment)
        
        # Kazanan ağırlıkları kaydet
        winner_weights = analysis.winner.weights
        self._save_default_config(winner_weights)
        
        # Geçmişe kaydet
        self._save_experiment_history(experiment_id, analysis)
        
        return winner_weights
    
    # Private metodlar
    
    def _generate_experiment_id(self, name: str) -> str:
        """Deney ID oluştur"""
        timestamp = str(time.time())
        hash_input = f"{name}_{timestamp}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]
    
    def _consistent_hash_variant(
        self,
        user_id: str,
        experiment_id: str,
        variants: List[WeightVariant]
    ) -> WeightVariant:
        """
        Consistent hashing ile varyant seç
        
        Aynı user_id + experiment_id her zaman aynı varyantı verir.
        """
        hash_input = f"{user_id}_{experiment_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        index = hash_value % len(variants)
        return variants[index]
    
    def _save_experiment(self, experiment: Experiment) -> None:
        """Deneyi diske kaydet"""
        file_path = self.storage_path / f"{experiment.id}.json"
        
        # Dataclass'ları dict'e çevir
        data = {
            'id': experiment.id,
            'name': experiment.name,
            'variants': [
                {
                    'id': v.id,
                    'name': v.name,
                    'weights': asdict(v.weights),
                    'description': v.description
                }
                for v in experiment.variants
            ],
            'results': [asdict(r) for r in experiment.results],
            'status': experiment.status,
            'created_at': experiment.created_at,
            'stopped_at': experiment.stopped_at
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_experiments(self) -> None:
        """Deneyleri diskten yükle"""
        if not self.storage_path.exists():
            return
        
        for file_path in self.storage_path.glob("*.json"):
            if file_path.stem == 'default_config' or file_path.stem == 'history':
                continue
            
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                # Dict'leri dataclass'a çevir
                variants = [
                    WeightVariant(
                        id=v['id'],
                        name=v['name'],
                        weights=HScoreWeights(**v['weights']),
                        description=v.get('description')
                    )
                    for v in data['variants']
                ]
                
                results = [
                    ExperimentResult(**r)
                    for r in data['results']
                ]
                
                experiment = Experiment(
                    id=data['id'],
                    name=data['name'],
                    variants=variants,
                    results=results,
                    status=data['status'],
                    created_at=data['created_at'],
                    stopped_at=data.get('stopped_at')
                )
                
                self.experiments[experiment.id] = experiment
                self.user_assignments[experiment.id] = {}
                
            except Exception as e:
                print(f"Deney yüklenemedi {file_path}: {e}")
    
    def _save_default_config(self, weights: HScoreWeights) -> None:
        """Varsayılan yapılandırmayı kaydet"""
        config_path = self.storage_path / "default_config.json"
        
        with open(config_path, 'w') as f:
            json.dump(asdict(weights), f, indent=2)
    
    def _save_experiment_history(
        self,
        experiment_id: str,
        analysis: ExperimentAnalysis
    ) -> None:
        """Deney geçmişini kaydet"""
        history_path = self.storage_path / "history.json"
        
        # Mevcut geçmişi yükle
        history = []
        if history_path.exists():
            with open(history_path, 'r') as f:
                history = json.load(f)
        
        # Yeni girdi ekle
        entry = {
            'experiment_id': experiment_id,
            'experiment_name': self.experiments[experiment_id].name,
            'winner': {
                'id': analysis.winner.id,
                'name': analysis.winner.name,
                'weights': asdict(analysis.winner.weights)
            },
            'confidence': analysis.confidence,
            'deployed_at': time.time()
        }
        
        history.append(entry)
        
        # Kaydet
        with open(history_path, 'w') as f:
            json.dump(history, f, indent=2)
