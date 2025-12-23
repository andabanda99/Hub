# ADR-003: State Confidence Levels

**Status:** Accepted
**Date:** December 2024
**Decision Makers:** Solo Developer

## Context

The original design had a binary approach: either data was "live" (show it) or "historical" (hide from Open Door filter). This created a critical failure mode:

**The Stadium Egress Problem**: A user exits Amalie Arena at 10:15 PM during a Lightning game. Network is dead. The app has data from 8 minutes ago. Under the old rules:
1. Data age > 5 min → mark as "historical"
2. "historical" data → excluded from Open Door filter
3. User sees **nothing**

The flagship feature fails precisely when users need it most.

## Decision

Implement a **4-tier State Confidence system** with a Staleness Tolerance Window:

| Level | Data Age | Open Door | UI Treatment |
|-------|----------|-----------|--------------|
| `live` | < 5 min | Eligible | Normal display |
| `recent` | 5–30 min | Eligible | "~" prefix on wait times |
| `stale` | 30–60 min | Not eligible | "Last updated X min ago" |
| `historical` | > 60 min | Not eligible | "Predicted" label, grey tint |

### Key Insight

"Recent" data (5-30 minutes old) is still **actionable** in nightlife contexts. Venue states don't change that rapidly—a bar that was "Social" 10 minutes ago is likely still "Social."

## Consequences

### Positive
- Open Door works during network degradation
- Users have context about data freshness
- Graceful degradation (never a blank screen)

### Negative
- UI complexity (4 visual states)
- Potential for showing slightly stale data

### Risk Mitigation
- "~" prefix on wait times clearly indicates uncertainty
- Stale/Historical data is visually distinct (grey tint)

## Implementation

```typescript
function calculateStateConfidence(stateTimestamp: number): StateConfidence {
  const ageMs = Date.now() - stateTimestamp;

  if (ageMs < 5 * 60 * 1000) return { level: 'live', ... };
  if (ageMs < 30 * 60 * 1000) return { level: 'recent', ... };
  if (ageMs < 60 * 60 * 1000) return { level: 'stale', ... };
  return { level: 'historical', ... };
}
```

## Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Binary (live/historical) | Fails Stadium Egress scenario |
| No confidence indicator | Users can't assess data quality |
| Continuous decay (0-100) | Harder to translate to UI, less intuitive |

## Related

- [src/algorithms/stateConfidence.ts](../../src/algorithms/stateConfidence.ts)
- [ADR-001: Offline-First Architecture](./001-offline-first-architecture.md)
