/**
 * State Confidence Algorithm Tests
 * Per DOMAIN_RULES.md Section 4
 */

import {
  calculateStateConfidence,
  isOpenDoorEligible,
  getConfidenceUITreatment,
  formatStalenessMessage,
} from '../stateConfidence';

describe('calculateStateConfidence', () => {
  const now = Date.now();

  it('should return "live" for data < 5 minutes old', () => {
    const timestamp = now - 4 * 60 * 1000; // 4 minutes ago
    expect(calculateStateConfidence(timestamp, now)).toBe('live');
  });

  it('should return "recent" for data 5-30 minutes old', () => {
    const timestamp = now - 15 * 60 * 1000; // 15 minutes ago
    expect(calculateStateConfidence(timestamp, now)).toBe('recent');
  });

  it('should return "stale" for data 30-60 minutes old', () => {
    const timestamp = now - 45 * 60 * 1000; // 45 minutes ago
    expect(calculateStateConfidence(timestamp, now)).toBe('stale');
  });

  it('should return "historical" for data > 60 minutes old', () => {
    const timestamp = now - 90 * 60 * 1000; // 90 minutes ago
    expect(calculateStateConfidence(timestamp, now)).toBe('historical');
  });

  it('should handle edge case at exactly 5 minutes', () => {
    const timestamp = now - 5 * 60 * 1000; // exactly 5 minutes
    expect(calculateStateConfidence(timestamp, now)).toBe('recent');
  });

  it('should handle edge case at exactly 30 minutes', () => {
    const timestamp = now - 30 * 60 * 1000; // exactly 30 minutes
    expect(calculateStateConfidence(timestamp, now)).toBe('stale');
  });

  it('should handle edge case at exactly 60 minutes', () => {
    const timestamp = now - 60 * 60 * 1000; // exactly 60 minutes
    expect(calculateStateConfidence(timestamp, now)).toBe('historical');
  });
});

describe('isOpenDoorEligible', () => {
  it('should return true for "live" confidence', () => {
    expect(isOpenDoorEligible('live')).toBe(true);
  });

  it('should return true for "recent" confidence', () => {
    expect(isOpenDoorEligible('recent')).toBe(true);
  });

  it('should return false for "stale" confidence', () => {
    expect(isOpenDoorEligible('stale')).toBe(false);
  });

  it('should return false for "historical" confidence', () => {
    expect(isOpenDoorEligible('historical')).toBe(false);
  });

  it('should respect custom allowed confidence levels', () => {
    expect(isOpenDoorEligible('stale', ['live', 'recent', 'stale'])).toBe(true);
    expect(isOpenDoorEligible('live', ['recent'])).toBe(false);
  });
});

describe('getConfidenceUITreatment', () => {
  it('should return normal display for "live"', () => {
    const treatment = getConfidenceUITreatment('live');
    expect(treatment.prefix).toBe('');
    expect(treatment.opacity).toBe(1.0);
    expect(treatment.showPredictedLabel).toBe(false);
  });

  it('should return "~" prefix for "recent"', () => {
    const treatment = getConfidenceUITreatment('recent');
    expect(treatment.prefix).toBe('~');
    expect(treatment.opacity).toBe(0.9);
  });

  it('should return reduced opacity for "stale"', () => {
    const treatment = getConfidenceUITreatment('stale');
    expect(treatment.opacity).toBe(0.7);
    expect(treatment.showPredictedLabel).toBe(false);
  });

  it('should return predicted label for "historical"', () => {
    const treatment = getConfidenceUITreatment('historical');
    expect(treatment.opacity).toBe(0.5);
    expect(treatment.showPredictedLabel).toBe(true);
  });
});

describe('formatStalenessMessage', () => {
  const now = Date.now();

  it('should return null for "live" data', () => {
    const timestamp = now - 2 * 60 * 1000; // 2 minutes ago
    expect(formatStalenessMessage(timestamp, now)).toBeNull();
  });

  it('should return null for "recent" data', () => {
    const timestamp = now - 10 * 60 * 1000; // 10 minutes ago
    expect(formatStalenessMessage(timestamp, now)).toBeNull();
  });

  it('should return "Last updated X min ago" for "stale" data', () => {
    const timestamp = now - 45 * 60 * 1000; // 45 minutes ago
    const message = formatStalenessMessage(timestamp, now);
    expect(message).toBe('Last updated 45 min ago');
  });

  it('should return "Predicted" message for "historical" data under 2 hours', () => {
    const timestamp = now - 90 * 60 * 1000; // 90 minutes ago
    const message = formatStalenessMessage(timestamp, now);
    expect(message).toBe('Predicted (90 min old)');
  });

  it('should return hours format for very old data', () => {
    const timestamp = now - 180 * 60 * 1000; // 3 hours ago
    const message = formatStalenessMessage(timestamp, now);
    expect(message).toBe('Predicted (3h old)');
  });
});
