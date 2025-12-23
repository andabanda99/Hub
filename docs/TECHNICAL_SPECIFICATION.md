# The Hub: A Digital Twin Operating System for Nightlife Districts

**Technical Specification v1.0**

*Author: [Your Name]*
*Date: December 2024*

---

## Abstract

The Hub is a mobile-first platform that provides real-time situational awareness for nightlife districts. By aggregating heterogeneous data sources—ride-share surge pricing, traffic flow sensors, parking garage occupancy, and venue-reported states—the system computes a unified **Friction Score** that quantifies the "resistance" a user faces when attempting to access a venue. The platform implements an **Offline-First Architecture** using WatermelonDB, ensuring full functionality during network degradation scenarios common at high-density events (e.g., stadium egress). This specification documents the core algorithms, data models, and architectural decisions that enable real-time venue state synchronization with sub-second latency while maintaining battery efficiency on mobile devices.

---

## 1. Introduction

### 1.1 Problem Statement

Urban nightlife districts face an information asymmetry problem: users lack visibility into venue states (capacity, wait times, atmosphere), while venues lack tools to manage demand dynamically. Traditional solutions—social media feeds, static profiles, crowd-sourced reviews—fail during high-demand scenarios where information becomes stale within minutes.

### 1.2 Solution Overview

The Hub addresses this through a **Digital Twin** model where each physical venue is represented by a real-time virtual counterpart. Key innovations include:

1. **Sensor-Driven States**: Venues are classified into discrete states (Quiet, Social, Party) based on occupancy thresholds, not user reviews.
2. **The Open Door Filter**: A server-side filter that surfaces only venues meeting user-defined criteria for immediate access.
3. **Gravity Well Visualization**: A 3D map where venue visibility (glow radius) is a function of both popularity and paid promotion.
4. **Graceful Degradation**: All features maintain functionality during network outages through local data caching and staleness-aware rendering.

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Mobile Client | React Native (Expo) | Cross-platform, rapid iteration |
| Local Database | WatermelonDB | Offline-first, Observable queries |
| Backend | Supabase (PostgreSQL + PostGIS) | Managed infra, geospatial queries |
| Real-Time | Ably WebSockets | Pub/sub with reconnection |
| Maps | Mapbox GL | 3D buildings, custom styling |

### 2.2 Domain Model Hierarchy

```
Metro (Tampa Bay)
  └── Hub (Water Street)
        ├── Venue (Sparkman Wharf)
        │     └── State {id: 2, confidence: "live", wait: 5min}
        ├── Zone (Main Promenade)
        └── NavigationGraph
              ├── Node (intersection)
              └── Edge (walkable path)
```

### 2.3 Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External APIs  │     │   Supabase      │     │  Mobile Client  │
│  (Uber, Traffic)│────▶│   Backend       │────▶│  WatermelonDB   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Ably Channels  │────▶│  UI Observables │
                        └─────────────────┘     └─────────────────┘
```

---

## 3. Core Algorithms

### 3.1 Friction Score Algorithm

The Friction Score quantifies the "resistance" to venue access on a normalized 0-100 scale.

#### 3.1.1 Input Normalization

All inputs must be normalized before weight application:

| Source | Raw Range | Normalization Formula |
|--------|-----------|----------------------|
| Uber Surge | 1.0x – 5.0x | `F_uber = (surge - 1.0) / 4.0 × 100` |
| Traffic Flow | 0 – max | `F_traffic = flow / historical_max × 100` |
| Garage Occupancy | 0% – 100% | `F_garage = occupancy` (already normalized) |

#### 3.1.2 Weighted Aggregation

```
W_uber = 1.5, W_traffic = 1.2, W_garage = 1.0
W_total = W_uber + W_traffic + W_garage = 3.7

Friction = (F_uber × W_uber + F_traffic × W_traffic + F_garage × W_garage) / W_total
```

#### 3.1.3 Graceful Degradation (Fallback Waterfall)

When data sources are unavailable, weights are redistributed proportionally:

| Scenario | Available Sources | Redistributed Weights |
|----------|-------------------|----------------------|
| All Up | Uber, Traffic, Garage | 1.5, 1.2, 1.0 |
| Uber Down | Traffic, Garage | 1.8, 1.35 |
| Traffic Down | Uber, Garage | 2.25, 1.5 |
| Two Down | Single source | 3.7 (full weight) |
| All Down | None | Return `null` |

The system never returns `NaN`. If all sources fail, the Friction Score is marked as unavailable.

### 3.2 State Confidence Algorithm

Venue state freshness is classified into confidence levels:

| Level | Data Age | Open Door Eligible | UI Treatment |
|-------|----------|-------------------|--------------|
| `live` | < 5 min | Yes | Normal display |
| `recent` | 5 – 30 min | Yes | "~" prefix on wait times |
| `stale` | 30 – 60 min | No | "Last updated X min ago" |
| `historical` | > 60 min | No | "Predicted" label, grey tint |

This solves the **Stadium Egress Problem**: users exiting Amalie Arena during network congestion still see "recent" data rather than a blank screen.

### 3.3 Gravity Well Algorithm

Venue visibility radius on the 3D map is computed as:

```
Base_Radius = 100m (default)
Anchor_Bonus = isAnchor ? 0.20 : 0
Ad_Multiplier = 2.5 m/point

Effective_Radius = min(
  Base_Radius × (1 + Anchor_Bonus) + (Ad_Boost × Ad_Multiplier),
  200m  // Hard cap to prevent district domination
)
```

#### 3.3.1 Overlap Resolution

When two venue radii overlap > 50%, both are reduced proportionally:

```
Overlap_Ratio = intersection_area / min(area_A, area_B)
if Overlap_Ratio > 0.5:
  Reduction_Factor = 1 - ((Overlap_Ratio - 0.5) × 0.4)
  Radius_A = Radius_A × Reduction_Factor
  Radius_B = Radius_B × Reduction_Factor
```

### 3.4 Open Door Filter

A venue qualifies as "Open Door" if:

```
Wait_Time < 15 minutes
AND Friction_Score < 80
AND Status ≠ "Private Event"
AND State_Confidence ∈ {live, recent}
```

**Security Note**: Filtering is performed server-side to prevent data scraping. The client receives only qualifying venues, never the full dataset.

---

## 4. Offline-First Architecture

### 4.1 Sync Strategy: Tiered Geofence

| Tier | Radius | Trigger | Action |
|------|--------|---------|--------|
| Outer | 5 km | Significant Location Change | Queue sync |
| Inner | 1 km | Region Enter | Background sync |
| Core | 200 m | High accuracy | WebSocket connect |

### 4.2 Local Storage Schema

WatermelonDB tables mirror the Supabase schema:

- `metros` – Top-level geographic containers
- `hubs` – Nightlife districts with geofence polygons
- `venues` – Individual venues with state tracking
- `zones` – Walkable/restricted areas
- `navigation_nodes` – Graph nodes for pathfinding
- `navigation_edges` – Walkable connections
- `scheduled_closures` – Planned venue closures
- `friction_inputs` – Cached friction calculation inputs
- `sync_state` – Sync progress and last event IDs

### 4.3 WebSocket Lifecycle

```
States: DISCONNECTED → CONNECTING → CONNECTED → SUSPENDED
```

| Event | Action |
|-------|--------|
| App backgrounded | Disconnect after 10s |
| App foregrounded | Immediate reconnect |
| Network lost | Enter SUSPENDED, queue messages |
| Network restored | Reconnect with `last_event_id` |

Reconnection uses exponential backoff (1s → 2s → 4s → ... → 30s max).

---

## 5. Privacy Protocol

### 5.1 Bucketed State Reporting

Venue occupancy is never exposed as exact counts. States are bucketed:

| State | Occupancy Range |
|-------|-----------------|
| 0 (Closed) | < 10 people |
| 1 (Quiet) | 10 – 30% capacity |
| 2 (Social) | 30 – 70% capacity |
| 3 (Party) | > 70% capacity |

### 5.2 State Transition Debouncing

To prevent timing analysis attacks:

1. **Batch Window**: State changes held for 5-minute windows
2. **Jitter**: Random 0–120 second delay on broadcasts
3. **Hysteresis**: Require 2 consecutive readings before transition

---

## 6. Data Model

### 6.1 Entity Relationship Diagram

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Metro  │──1:N─│   Hub   │──1:N─│  Venue  │
└─────────┘      └─────────┘      └─────────┘
                      │                │
                      │ 1:N            │ 1:N
                      ▼                ▼
                 ┌─────────┐    ┌──────────────┐
                 │  Zone   │    │ScheduledClose│
                 └─────────┘    └──────────────┘
                      │
                      │ 1:N
                      ▼
              ┌───────────────┐
              │NavigationNode │
              └───────────────┘
                      │
                      │ N:N
                      ▼
              ┌───────────────┐
              │NavigationEdge │
              └───────────────┘
```

### 6.2 Key Attributes

**Venue**
- `venue_id`: Human-readable identifier
- `last_known_state_id`: Current state (0-3)
- `state_timestamp`: When state was last updated
- `state_confidence`: Staleness level
- `current_wait_minutes`: Reported wait time
- `is_anchor`: Major destination flag
- `ad_boost`: Paid visibility boost (0-40)

**Hub**
- `geofence`: Polygon coordinates (JSON)
- `filter_rules_version`: SemVer for client compatibility
- `filter_rules`: Open Door thresholds (JSON)
- `manifest_version`: For sync conflict resolution

---

## 7. Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Friction Score | Complete | 45+ unit tests |
| State Confidence | Complete | Staleness tolerance implemented |
| Gravity Well | Complete | 200m cap, overlap resolution |
| Open Door Filter | Complete | Server + client fallback |
| WatermelonDB Models | Complete | 7 models |
| Supabase Schema | Complete | PostGIS + RLS |
| Ably Realtime | Complete | Reconnection logic |
| Map UI | Pending | Phase 5 |
| Screens | Pending | Phase 6 |

---

## 8. References

1. CLAUDE.md – Project Constitution
2. ARCHITECTURE_OFFLINE.md – Offline-First Specification
3. DOMAIN_RULES.md – Algorithm Specifications
4. docs/adr/ – Architecture Decision Records

---

## Appendix A: Algorithm Implementations

See source files:
- `src/algorithms/frictionScore.ts`
- `src/algorithms/stateConfidence.ts`
- `src/algorithms/gravityWell.ts`
- `src/algorithms/openDoorFilter.ts`

## Appendix B: Seed Data

Water Street Tampa POC includes:
- 5 venues (Sparkman Wharf, Predalina, JW Marriott, American Social, The Sail)
- 4 zones (Main Promenade, Waterfront Park, Sparkman Plaza, Meridian Garage)
- 8 navigation nodes with bidirectional edges

See: `src/db/seed/waterStreetTampa.ts`
