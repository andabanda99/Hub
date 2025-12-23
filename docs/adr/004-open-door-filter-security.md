# ADR-004: Open Door Filter Security

**Status:** Accepted
**Date:** December 2024
**Decision Makers:** Solo Developer

## Context

The "Open Door" filter is the flagship feature: show venues where users can get in quickly. However, this creates a security concern:

**The Scraping Problem**: If the client receives all venue data and filters locally, a competitor or malicious actor could:
1. Intercept network traffic
2. Extract full venue occupancy data
3. Reconstruct real-time demand patterns for all venues

This would violate venue privacy agreements and expose competitive intelligence.

## Decision

Implement **Server-Side Filtering** with versioned client fallback.

### Architecture

```
┌────────────┐     GET /venues?filter=open_door     ┌────────────┐
│   Client   │ ─────────────────────────────────▶   │   Server   │
│            │                                      │            │
│            │ ◀───────────────────────────────     │  (filters) │
└────────────┘   Only qualifying venues returned    └────────────┘
```

### Filter Rules

A venue qualifies as "Open Door" if:
```
Wait_Time < max_wait_minutes (default: 15)
AND Friction_Score < max_friction (default: 80)
AND Status ≠ "Private Event"
AND State_Confidence ∈ allowed_confidence (default: [live, recent])
```

### Client Fallback (Offline Mode)

When offline, the client applies the same filter using cached `filter_rules`:

```json
{
  "filter_rules_version": "1.0.0",
  "filter_rules": {
    "open_door": {
      "max_wait_minutes": 15,
      "max_friction": 80,
      "allowed_confidence": ["live", "recent"]
    }
  }
}
```

### Version Drift Prevention

The client stores `filter_rules_version` (SemVer). On reconnect:
- **Minor version change**: Apply new rules silently
- **Major version change**: Show "Update app for accurate Open Door"

## Consequences

### Positive
- Venue data never exposed to unauthorized parties
- Filter logic can be updated server-side without app release
- Client fallback maintains offline functionality

### Negative
- Server must compute filters (slight latency)
- Dual implementation (server + client fallback)
- Version management complexity

### Security Properties
- **Data Minimization**: Client only receives qualifying venues
- **Server Authority**: Filter thresholds controlled centrally
- **Audit Trail**: Server logs who requested filtered data

## Implementation

Server (Supabase Function):
```sql
CREATE FUNCTION get_open_door_venues(hub_id TEXT)
RETURNS SETOF venues AS $$
  SELECT * FROM venues
  WHERE hub_id = $1
    AND current_wait_minutes < 15
    AND friction_score < 80
    AND is_private_event = false
    AND state_confidence IN ('live', 'recent');
$$ LANGUAGE sql;
```

Client Fallback:
```typescript
// src/algorithms/openDoorFilter.ts
function isOpenDoor(venue: Venue, rules: FilterRules): boolean {
  return venue.waitMinutes < rules.maxWaitMinutes
    && venue.frictionScore < rules.maxFriction
    && !venue.isPrivateEvent
    && rules.allowedConfidence.includes(venue.stateConfidence);
}
```

## Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Client-only filtering | Exposes all venue data |
| Server-only (no fallback) | Breaks offline mode |
| Encrypted payloads | Complexity, key management |

## Related

- [src/algorithms/openDoorFilter.ts](../../src/algorithms/openDoorFilter.ts)
- [CLAUDE.md Section 4.B](../../CLAUDE.md)
