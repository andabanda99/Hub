/**
 * Friction Score Algorithm Tests
 * Per DOMAIN_RULES.md Section 1
 *
 * 4-Factor Algorithm: F = (Uber*0.15) + (Traffic*0.25) + (Foot*0.4) + (Garage*0.2)
 * With confidence penalty when primary source (foot traffic) is unavailable
 */

import {
  normalizeUberSurge,
  normalizeTrafficFlow,
  normalizeFootTraffic,
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

  describe('normalizeFootTraffic', () => {
    it('should normalize 0 count to 0', () => {
      expect(normalizeFootTraffic(0, 100)).toBe(0);
    });

    it('should normalize max count to 100', () => {
      expect(normalizeFootTraffic(100, 100)).toBe(100);
    });

    it('should normalize half max count to 50', () => {
      expect(normalizeFootTraffic(50, 100)).toBe(50);
    });

    it('should handle zero historical max', () => {
      expect(normalizeFootTraffic(50, 0)).toBe(0);
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
  const trafficHistoricalMax = 100;
  const footHistoricalMax = 100;

  describe('Standard Mode (All 4 factors available)', () => {
    it('should return 0 when all inputs are minimum', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: 1.0,
          trafficFlow: 0,
          footTrafficCount: 0,
          garageOccupancy: 0,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.score).toBe(0);
      expect(result.isDegraded).toBe(false);
      expect(result.activeSourceCount).toBe(4);
      expect(result.rawFactors).toEqual({
        uber: 0,
        traffic: 0,
        foot: 0,
        garage: 0,
      });
    });

    it('should return ~100 when all inputs are maximum', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: 5.0,
          trafficFlow: 100,
          footTrafficCount: 100,
          garageOccupancy: 100,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.score).toBeCloseTo(100, 0);
      expect(result.isDegraded).toBe(false);
      expect(result.activeSourceCount).toBe(4);
    });

    it('should calculate weighted average with normalized weights', () => {
      // Weights: Uber=0.15, Traffic=0.25, Foot=0.4, Garage=0.2
      // All at 50 should give exactly 50
      const result = calculateFrictionScore(
        {
          uberSurge: 3.0, // 50 normalized
          trafficFlow: 50,
          footTrafficCount: 50,
          garageOccupancy: 50,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.score).toBeCloseTo(50, 0);
      expect(result.isDegraded).toBe(false);
    });

    it('should weight foot traffic highest (40%)', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: 1.0, // 0
          trafficFlow: 0,
          footTrafficCount: 100, // Only foot traffic high
          garageOccupancy: 0,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      // Score should be ~40 (100 * 0.4)
      expect(result.score).toBeCloseTo(40, 0);
    });
  });

  describe('Degraded Mode (Foot traffic unavailable)', () => {
    it('should apply confidence penalty when foot traffic is null', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: 3.0,
          trafficFlow: 50,
          footTrafficCount: null, // Primary source down
          garageOccupancy: 50,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.isDegraded).toBe(true);
      expect(result.activeSourceCount).toBe(3);
      // Degraded weights: Uber=0.20, Traffic=0.35, Foot=0.05, Garage=0.40
      // Score = (50*0.20) + (50*0.35) + (0*0.05) + (50*0.40) = 10 + 17.5 + 0 + 20 = 47.5
      expect(result.score).toBeCloseTo(47.5, 0);
    });

    it('should still work with partial data in degraded mode', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: null,
          trafficFlow: 75,
          footTrafficCount: null,
          garageOccupancy: 75,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.isDegraded).toBe(true);
      expect(result.activeSourceCount).toBe(2);
      expect(result.score).not.toBeNull();
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle single source available', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: null,
          trafficFlow: null,
          footTrafficCount: null,
          garageOccupancy: 75,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.activeSourceCount).toBe(1);
      expect(result.score).not.toBeNull();
    });

    it('should return null when all sources are down (total blackout)', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: null,
          trafficFlow: null,
          footTrafficCount: null,
          garageOccupancy: null,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.score).toBeNull();
      expect(result.rawFactors).toBeNull();
      expect(result.activeSourceCount).toBe(0);
    });
  });

  describe('Raw Factors Output', () => {
    it('should include raw normalized factors for UI breakdown', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: 3.0, // 50
          trafficFlow: 75,
          footTrafficCount: 60,
          garageOccupancy: 80,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.rawFactors).toEqual({
        uber: 50,
        traffic: 75,
        foot: 60,
        garage: 80,
      });
    });

    it('should use 0 for null factors in raw output', () => {
      const result = calculateFrictionScore(
        {
          uberSurge: null,
          trafficFlow: 50,
          footTrafficCount: 50,
          garageOccupancy: null,
        },
        trafficHistoricalMax,
        footHistoricalMax
      );
      expect(result.rawFactors?.uber).toBe(0);
      expect(result.rawFactors?.garage).toBe(0);
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
