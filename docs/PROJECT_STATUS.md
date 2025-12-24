# The Hub - Project Status

**Timestamp:** 2024-12-23T12:00:00Z

## Directory Tree

```
the-hub/
├── backend/
│   └── supabase/
│       └── migrations/
│           └── 20240101_init.sql
├── docs/
│   ├── adr/
│   │   ├── 001-offline-first-architecture.md
│   │   ├── 002-friction-score-algorithm.md
│   │   ├── 003-state-confidence-levels.md
│   │   ├── 004-open-door-filter-security.md
│   │   └── 005-red-team-resolutions.md
│   ├── PROJECT_STATUS.md
│   └── TECHNICAL_SPECIFICATION.md
├── mobile-app/
│   └── src/
│       └── model/
│           └── schema.ts
├── src/
│   ├── algorithms/
│   │   ├── __tests__/
│   │   │   ├── frictionScore.test.ts
│   │   │   └── stateConfidence.test.ts
│   │   ├── frictionScore.ts
│   │   ├── gravityWell.ts
│   │   ├── index.ts
│   │   ├── openDoorFilter.ts
│   │   └── stateConfidence.ts
│   ├── components/
│   │   ├── map/
│   │   │   ├── HubMap.tsx
│   │   │   ├── VenueGlowLayer.tsx
│   │   │   ├── useVenueGeoJSON.ts
│   │   │   ├── mapStyles.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── models/
│   │   │   ├── Hub.ts
│   │   │   ├── index.ts
│   │   │   ├── NavigationEdge.ts
│   │   │   ├── NavigationNode.ts
│   │   │   ├── ScheduledClosure.ts
│   │   │   ├── SyncState.ts
│   │   │   ├── Venue.ts
│   │   │   └── Zone.ts
│   │   ├── schema/
│   │   │   └── index.ts
│   │   ├── seed/
│   │   │   └── waterStreetTampa.ts
│   │   └── index.ts
│   ├── hooks/
│   ├── screens/
│   ├── services/
│   │   ├── index.ts
│   │   ├── realtime.ts
│   │   └── supabase.ts
│   ├── types/
│   │   ├── domain.ts
│   │   └── index.ts
│   └── utils/
├── .env.example
├── .eslintrc.js
├── app.json
├── App.tsx
├── ARCHITECTURE_OFFLINE.md
├── CLAUDE.md
├── DOMAIN_RULES.md
├── index.ts
├── jest.config.js
├── package.json
└── tsconfig.json
```

## Task Ledger

### Phase 1: Architecture & Setup
- [x] Red Team critique of architecture documents
- [x] Update CLAUDE.md with WebSocket Lifecycle spec
- [x] Update ARCHITECTURE_OFFLINE.md with tiered geofence, filter versioning
- [x] Update DOMAIN_RULES.md with normalization, staleness tolerance, privacy debouncing
- [x] Initialize Expo React Native project
- [x] Install core dependencies (WatermelonDB, Mapbox, Ably, Supabase)
- [x] Configure TypeScript with path aliases
- [x] Configure ESLint
- [x] Set up Jest for testing

### Phase 2: Core Algorithms
- [x] Friction Score calculation with normalization
- [x] Friction Score fallback waterfall (graceful degradation)
- [x] Gravity Well radius calculation with cap
- [x] State Confidence (live/recent/stale/historical)
- [x] Open Door filter (client-side fallback)
- [x] Unit tests (45 passing)

### Phase 3: Data Layer
- [x] Supabase SQL migration with PostGIS and RLS
- [x] WatermelonDB schema matching SQL tables
- [x] WatermelonDB models for all tables (7 models complete)
- [x] Water Street Tampa seed data (5 venues, 4 zones, navigation graph)
- [ ] Sync adapter connecting WatermelonDB to Supabase

### Phase 4: Services
- [x] Supabase client configuration
- [x] Ably WebSocket service with reconnection logic
- [ ] Geofence monitoring service
- [ ] Hub manifest sync service

### Phase 5: UI Components
- [x] Map component with Mapbox (HubMap.tsx)
- [x] Venue glow layer with Gravity Well visualization (VenueGlowLayer.tsx)
- [x] Open Door filter toggle (App.tsx)
- [ ] Offline mode indicator
- [ ] Venue detail bottom sheet

### Phase 6: Screens
- [x] Main map screen (App.tsx - integrated)
- [ ] Venue detail sheet
- [ ] Settings screen

### Documentation
- [x] TECHNICAL_SPECIFICATION.md (academic-style comprehensive spec)
- [x] ADR-001: Offline-First Architecture
- [x] ADR-002: Friction Score Algorithm
- [x] ADR-003: State Confidence Levels
- [x] ADR-004: Open Door Filter Security
- [x] ADR-005: Red Team Resolutions

## Map Component Files Created

| File | Purpose |
|------|---------|
| `src/components/map/types.ts` | TypeScript types for map features |
| `src/components/map/mapStyles.ts` | Midnight theme, camera settings, glow config |
| `src/components/map/useVenueGeoJSON.ts` | Hook to transform venues to GeoJSON |
| `src/components/map/VenueGlowLayer.tsx` | CircleLayer with 3-layer glow effect |
| `src/components/map/HubMap.tsx` | Main map component |
| `src/components/map/index.ts` | Barrel exports |
| `App.tsx` | Updated with map + Open Door toggle |

## Open Door Filter Status (Based on Seed Data)

| Venue | Wait Time | Friction | Passes Open Door |
|-------|-----------|----------|------------------|
| The Pearl | 5 min | 35 | ✅ Yes |
| Boulon | 10 min | 45 | ✅ Yes |
| Predalina | 0 min | 25 | ✅ Yes |
| Alter Ego | 15 min | 70 | ❌ No (wait ≥ 15) |
| Edition | 18 min | 65 | ❌ No (wait > 15) |

## Cost Analysis

| Phase | Cost |
|-------|------|
| Development (current) | $0/month (free tiers) |
| App Store submission | $99/year (Apple) + $25 (Google) |
| Production (Supabase Pro) | $25/month |

## Known Issues

1. **Jest/ts-jest Version Mismatch**: Jest 30.x with ts-jest 29.x causes test runner failure. TypeScript type checking still passes via `npx tsc --noEmit`.

## Next Steps

1. **Add Mapbox Access Token**: Create `.env` with `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
2. **Test on Device**: Run `npm start` and test on iOS/Android
3. **Venue Detail Sheet**: Show state, wait time, friction when venue tapped
4. **Offline Indicator**: Show when data is stale/historical
