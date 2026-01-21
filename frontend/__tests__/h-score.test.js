/**
 * H(x,ψ) Algorithm Tests
 * 
 * Tests the memory scoring algorithm against spec requirements.
 * Reference: AI-ULU Teknik Blueprint - Algoritmik Detaylandırma
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_WEIGHTS, calculateHScoreWithExperiment, getExperimentConfig } from '../lib/ab-testing.js';

describe('H(x,ψ) Algorithm', () => {
  describe('Default Weights (Spec Compliance)', () => {
    it('should have correct alpha (similarity) weight', () => {
      expect(DEFAULT_WEIGHTS.alpha).toBe(0.40);
    });

    it('should have correct beta (decay) weight', () => {
      expect(DEFAULT_WEIGHTS.beta).toBe(0.20);
    });

    it('should have correct gamma (importance) weight', () => {
      expect(DEFAULT_WEIGHTS.gamma).toBe(0.30);
    });

    it('should have correct delta (frequency) weight', () => {
      expect(DEFAULT_WEIGHTS.delta).toBe(0.10);
    });

    it('weights should sum to 1.0', () => {
      const sum = DEFAULT_WEIGHTS.alpha + DEFAULT_WEIGHTS.beta + 
                  DEFAULT_WEIGHTS.gamma + DEFAULT_WEIGHTS.delta + 
                  DEFAULT_WEIGHTS.epsilon;
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('H Score Calculation', () => {
    const mockMemory = {
      id: 'test-1',
      content: 'Test memory',
      type: 'identity',
      access_count: 10,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      last_accessed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    };

    it('should calculate H score for identity memory', () => {
      const result = calculateHScoreWithExperiment(mockMemory, 0.8, null, 'test-user');
      
      expect(result).toHaveProperty('H');
      expect(result).toHaveProperty('decayFactor');
      expect(result).toHaveProperty('importance');
      expect(result).toHaveProperty('frequency');
      expect(typeof result.H).toBe('number');
    });

    it('should return higher importance for identity memories', () => {
      const identityMemory = { ...mockMemory, type: 'identity' };
      const factMemory = { ...mockMemory, type: 'fact' };
      
      const identityResult = calculateHScoreWithExperiment(identityMemory, 0.8, null, 'test-user');
      const factResult = calculateHScoreWithExperiment(factMemory, 0.8, null, 'test-user');
      
      expect(identityResult.importance).toBeGreaterThan(factResult.importance);
    });

    it('should apply decay based on last access time', () => {
      const recentMemory = { 
        ...mockMemory, 
        last_accessed_at: new Date().toISOString() 
      };
      const oldMemory = { 
        ...mockMemory, 
        last_accessed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() 
      };
      
      const recentResult = calculateHScoreWithExperiment(recentMemory, 0.8, null, 'test-user');
      const oldResult = calculateHScoreWithExperiment(oldMemory, 0.8, null, 'test-user');
      
      expect(recentResult.decayFactor).toBeGreaterThan(oldResult.decayFactor);
    });

    it('should handle emotional context', () => {
      const resultNeutral = calculateHScoreWithExperiment(mockMemory, 0.8, 'neutral', 'test-user');
      const resultHappy = calculateHScoreWithExperiment(mockMemory, 0.8, 'happy', 'test-user');
      
      expect(resultNeutral.emotionalResonance).toBeDefined();
      expect(resultHappy.emotionalResonance).toBeDefined();
    });
  });

  describe('Experiment Assignment', () => {
    it('should assign control group by default', () => {
      const config = getExperimentConfig('test-user-123');
      expect(config).toHaveProperty('experimentId');
      expect(config).toHaveProperty('weights');
    });

    it('should return consistent assignment for same user', () => {
      const config1 = getExperimentConfig('consistent-user');
      const config2 = getExperimentConfig('consistent-user');
      
      expect(config1.experimentId).toBe(config2.experimentId);
    });

    it('should have importance map in config', () => {
      const config = getExperimentConfig('test-user');
      
      expect(config.importanceMap).toBeDefined();
      expect(config.importanceMap.identity).toBe(1.0);
      expect(config.importanceMap.preference).toBe(0.7);
      expect(config.importanceMap.fact).toBe(0.4);
    });
  });
});
