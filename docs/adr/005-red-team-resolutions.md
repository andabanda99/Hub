# ADR-005: Red Team Architecture Critique Resolutions

**Status:** Accepted
**Date:** December 2024
**Decision Makers:** Solo Developer

## Context

Before implementation, a comprehensive Red Team critique was conducted to identify architectural contradictions, security vulnerabilities, and edge cases that would cause production incidents. This ADR summarizes the 7 issues identified and their resolutions.

## Issues Identified

### Issue #1: Offline + Open Door Contradiction (CRITICAL)

**Problem**: The Open Door filter required `State_Confidence != 'historical'`, meaning the flagship feature was disabled precisely when users needed it most (stadium egress with dead network).

**Resolution**: Introduced 4-tier State Confidence with "recent" as Open Door eligible. See [ADR-003](./003-state-confidence-levels.md).

---

### Issue #2: Friction Score Normalization Ambiguity (CRITICAL)

**Problem**: The original formula didn't specify input ranges or whether division was implied, leading to potential implementation drift.

**Resolution**: Documented explicit normalization formulas:
- Uber: `(surge - 1.0) / 4.0 × 100`
- Traffic: `flow / historical_max × 100`
- Garage: Already 0-100

See [ADR-002](./002-friction-score-algorithm.md).

---

### Issue #3: Server/Client Filter Drift (HIGH)

**Problem**: Server-side Open Door filter and client-side fallback would drift when thresholds changed, showing incorrect results.

**Resolution**: Versioned filter rules with SemVer. Client checks `filter_rules_version` on reconnect; major version mismatch shows "Update app" warning.

See [ADR-004](./004-open-door-filter-security.md).

---

### Issue #4: Privacy Timing Attack (HIGH)

**Problem**: Competitors could track exact state transition moments to reconstruct granular occupancy data.

**Resolution**: Implemented State Transition Debouncing:
1. Batch Window: 5-minute state change batching
2. Jitter: Random 0-120 second broadcast delay
3. Hysteresis: 2 consecutive readings required before transition

---

### Issue #5: Geofence Battery Drain (MEDIUM)

**Problem**: 5km geofence radius would trigger constant wake-ups for users living downtown, causing iOS throttling.

**Resolution**: Tiered Geofence Strategy:
- 5km: Significant Location Change only (battery-efficient)
- 1km: Region Enter (background sync)
- 200m: High accuracy (WebSocket prep)

Sync throttling: Max 1 sync per hub per 30 minutes.

See [ADR-001](./001-offline-first-architecture.md).

---

### Issue #6: WebSocket Lifecycle Underspecified (MEDIUM)

**Problem**: No defined behavior for backgrounding, signal loss, or reconnection.

**Resolution**: Explicit lifecycle specification:
- States: DISCONNECTED → CONNECTING → CONNECTED → SUSPENDED
- Backoff: 1s → 2s → 4s → ... → 30s max
- Background: Disconnect after 10s
- Reconnect: Send `last_event_id` for delta sync

---

### Issue #7: Gravity Well Radius Uncapped (LOW)

**Problem**: Max radius of 350m could obscure entire districts if a venue paid for max Ad Boost.

**Resolution**: Hard cap at 200m, with overlap resolution reducing both radii proportionally when intersection > 50%.

---

## Validation

All resolutions were validated by:
1. Updating architecture documents (CLAUDE.md, ARCHITECTURE_OFFLINE.md, DOMAIN_RULES.md)
2. Implementing algorithms in TypeScript
3. Writing 45+ unit tests covering edge cases
4. Creating this decision trail for future reference

## Impact Summary

| Issue | Severity | Status | Implementation |
|-------|----------|--------|----------------|
| Offline+OpenDoor | Critical | Resolved | stateConfidence.ts |
| Friction normalization | Critical | Resolved | frictionScore.ts |
| Filter drift | High | Resolved | Schema + algorithm |
| Privacy timing | High | Resolved | Server-side |
| Battery drain | Medium | Resolved | Tiered geofence spec |
| WebSocket lifecycle | Medium | Resolved | realtime.ts |
| Gravity cap | Low | Resolved | gravityWell.ts |

## Related

- [CLAUDE.md](../../CLAUDE.md) - Updated constitution
- [ARCHITECTURE_OFFLINE.md](../../ARCHITECTURE_OFFLINE.md) - Offline specification
- [DOMAIN_RULES.md](../../DOMAIN_RULES.md) - Algorithm rules
- Previous ADRs in this series
