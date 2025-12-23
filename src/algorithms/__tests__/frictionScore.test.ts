/**
 * Friction Score Algorithm Tests
 * Per DOMAIN_RULES.md Section 1
 */

import {
  normalizeUberSurge,
  normalizeTrafficFlow,
  normalizeGarageOccupancy,
  calculateFrictionScore,
  passesOpenDoorFrictionThreshold,
} from '../frictionScore';

describe('Friction Score Normalization', () => {
  describe('normalizeUberSurge', () => {
    it('should normalize 1.0x surge to 0', () => {
      expect(normalizeUberSurge(1.0)).toBe(0);
    });

    it('should normalize 5.0x surge to 100', () => {
      expect(normalizeUberSurge(5.0)).toBe(100);
    });

    it('should normalize 3.0x surge to 50', () => {
      expect(normalizeUberSurge(3.0)).toBe(50);
    });

    it('should clamp values below 1.0x to 0', () => {
      expect(normalizeUberSurge(0.5)).toBe(0);
    });

    it('should clamp values above 5.0x to 100', () => {
      expect(normalizeUberSurge(7.0)).toBe(100);
    });
  });

  describe('normalizeTrafficFlow', () => {
    it('should normalize 0 flow to 0', () => {
      expect(normalizeTrafficFlow(0, 100)).toBe(0);
    });

    it('should normalize max flow to 100', () => {
      expect(normalizeTrafficFlow(100, 100)).toBe(100);
    });

    it('should normalize half max flow to 50', () => {
      expect(normalizeTrafficFlow(50, 100)).toBe(50);
    });

    it('should handle zero historical max', () => {
      expect(normalizeTrafficFlow(50, 0)).toBe(0);
    });
  });

  describe('normalizeGarageOccupancy', () => {
    it('should pass through 0-100 values', () => {
      expect(normalizeGarageOccupancy(50)).toBe(50);
    });

    it('should clamp values above 100', () => {
      expect(normalizeGarageOccupancy(150)).toBe(100);
    });

    it('should clamp values below 0', () => {
      expect(normalizeGarageOccupancy(-10)).toBe(0);
    });
  });
});

describe('calculateFrictionScore', () => {
  const historicalMax = 100;

  describe('All Systems Go (Scenario A)', () => {
    it('should return 0 when all inputs are minimum', () => {
      const result = calculateFrictionScore(
        { uberSurge: 1.0, trafficFlow: 0, garageOccupancy: 0 },
        historicalMax
      );
      expect(result.score).toBe(0);
      expect(result.scenario).toBe('all_up');
      expect(result.activeSourceCount).toBe(3);
    });

    it('should return ~100 when all inputs are maximum', () => {
      const result = calculateFrictionScore(
        { uberSurge: 5.0, trafficFlow: 100, garageOccupancy: 100 },
        historicalMax
      );
      expect(result.score).toBeCloseTo(100, 0);
      expect(result.scenario).toBe('all_up');
    });

    it('should calculate weighted average correctly', () => {
      // All inputs at 50 should give 50
      const result = calculateFrictionScore(
        { uberSurge: 3.0, trafficFlow: 50, garageOccupancy: 50 },
        historicalMax
      );
      expect(result.score).toBeCloseTo(50, 0);
    });
  });

  describe('Uber Down (Scenario B)', () => {
    it('should redistribute weights when Uber is null', () => {
      const result = calculateFrictionScore(
        { uberSurge: null, trafficFlow: 50, garageOccupancy: 50 },
        historicalMax
      );
      expect(result.scenario).toBe('uber_down');
      expect(result.activeSourceCount).toBe(2);
      expect(result.score).toBeCloseTo(50, 0);
    });
  });

  describe('Traffic Down (Scenario C)', () => {
    it('should redistribute weights when Traffic is null', () => {
      const result = calculateFrictionScore(
        { uberSurge: 3.0, trafficFlow: null, garageOccupancy: 50 },
        historicalMax
      );
      expect(result.scenario).toBe('traffic_down');
      expect(result.activeSourceCount).toBe(2);
      expect(result.score).not.toBeNull();
    });
  });

  describe('Two Sources Down', () => {
    it('should use single remaining source', () => {
      const result = calculateFrictionScore(
        { uberSurge: null, trafficFlow: null, garageOccupancy: 75 },
        historicalMax
      );
      expect(result.scenario).toBe('two_down');
      expect(result.activeSourceCount).toBe(1);
      expect(result.score).toBe(75);
    });
  });

  describe('Total Blackout', () => {
    it('should return null when all sources are down', () => {
      const result = calculateFrictionScore(
        { uberSurge: null, trafficFlow: null, garageOccupancy: null },
        historicalMax
      );
      expect(result.score).toBeNull();
      expect(result.scenario).toBe('blackout');
      expect(result.activeSourceCount).toBe(0);
    });
  });
});

describe('passesOpenDoorFrictionThreshold', () => {
  it('should return true for friction below 80', () => {
    expect(passesOpenDoorFrictionThreshold(79)).toBe(true);
  });

  it('should return false for friction at 80', () => {
    expect(passesOpenDoorFrictionThreshold(80)).toBe(false);
  });

  it('should return false for friction above 80', () => {
    expect(passesOpenDoorFrictionThreshold(85)).toBe(false);
  });

  it('should return false for null friction', () => {
    expect(passesOpenDoorFrictionThreshold(null)).toBe(false);
  });

  it('should use custom threshold when provided', () => {
    expect(passesOpenDoorFrictionThreshold(75, 70)).toBe(false);
    expect(passesOpenDoorFrictionThreshold(65, 70)).toBe(true);
  });
});
