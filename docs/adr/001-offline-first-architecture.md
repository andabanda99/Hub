# ADR-001: Offline-First Architecture

**Status:** Accepted
**Date:** December 2024
**Decision Makers:** Solo Developer

## Context

The Hub targets nightlife districts where network connectivity is notoriously poor during peak usage (stadium events, concerts, New Year's Eve). Users need the app to function precisely when network conditions are worst.

## Decision

Implement an **Offline-First Architecture** using WatermelonDB as the local database, with Supabase as the sync target.

### Key Choices

1. **WatermelonDB over Realm/SQLite**
   - Native Observable queries for React integration
   - Lazy loading for large datasets
   - Built-in sync primitives
   - MIT license (vs Realm's commercial considerations)

2. **Tiered Geofence Strategy**
   - 5km: Queue sync (battery-efficient)
   - 1km: Background sync (immediate download)
   - 200m: WebSocket connect (real-time)

3. **Staleness Tolerance Window**
   - `live`: < 5 min (full features)
   - `recent`: 5-30 min (Open Door eligible with indicator)
   - `stale`: 30-60 min (display-only)
   - `historical`: > 60 min (predictions)

## Consequences

### Positive
- App functions during complete network outage
- Faster UI responsiveness (local reads)
- Reduced server load (sync on demand)

### Negative
- Increased client complexity
- Potential sync conflicts (resolved via timestamp)
- Larger app bundle size (~2MB for WatermelonDB)

### Risks Mitigated
- **Stadium Egress Problem**: Users exiting Amalie Arena see `recent` data, not blank screen
- **Battery Drain**: Tiered geofence prevents continuous location polling

## Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Redux Persist | No query layer, not designed for relational data |
| Realm | Vendor lock-in concerns, sync complexity |
| PouchDB | Poor React Native support |
| Online-only | Fails core use case (stadium egress) |

## Related

- [ARCHITECTURE_OFFLINE.md](../../ARCHITECTURE_OFFLINE.md)
- [ADR-003: State Confidence Levels](./003-state-confidence-levels.md)
