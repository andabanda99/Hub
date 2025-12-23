# ADR-002: Friction Score Algorithm

**Status:** Accepted
**Date:** December 2024
**Decision Makers:** Solo Developer

## Context

Users need a single metric to understand "how hard is it to get into this venue right now?" This encompasses multiple factors: ride availability, traffic, parking, and venue-specific wait times.

## Decision

Implement a **Friction Score** (0-100) that aggregates multiple data sources with weighted averaging and graceful degradation.

### Formula

```
Friction = (F_uber × 1.5 + F_traffic × 1.2 + F_garage × 1.0) / 3.7
```

Where each input is normalized to 0-100:
- `F_uber = (surge - 1.0) / 4.0 × 100` (1.0x–5.0x range)
- `F_traffic = flow / historical_max × 100`
- `F_garage = occupancy` (already 0-100)

### Fallback Waterfall

When data sources fail, weights redistribute proportionally:

| Scenario | Uber | Traffic | Garage |
|----------|------|---------|--------|
| All Up | 1.5 | 1.2 | 1.0 |
| Uber Down | 0 | 1.8 | 1.35 |
| Traffic Down | 2.25 | 0 | 1.5 |
| Only Garage | 0 | 0 | 3.7 |
| All Down | Return `null` |

## Consequences

### Positive
- Single, intuitive metric for users
- Graceful degradation (never returns NaN)
- Weights are tunable per-hub if needed

### Negative
- Requires all input normalizations to be correct
- Weight selection is somewhat arbitrary (needs A/B testing)

### Trade-offs
- **Simplicity vs Accuracy**: A more complex model (ML-based) could be more accurate but harder to debug and explain
- **Real-time vs Historical**: We prioritize real-time inputs; historical patterns are fallback only

## Implementation Notes

- Friction Score is computed server-side and cached in `friction_inputs` table
- Client receives pre-computed score, not raw inputs (security)
- Score is recalculated every 2 minutes or on significant input change

## Test Coverage

45+ unit tests cover:
- All normalization functions
- All 8 fallback scenarios
- Edge cases (0, 100, negative values)
- Clamping behavior

## Related

- [src/algorithms/frictionScore.ts](../../src/algorithms/frictionScore.ts)
- [DOMAIN_RULES.md](../../DOMAIN_RULES.md)
