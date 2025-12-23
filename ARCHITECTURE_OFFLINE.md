# ARCHITECTURE: Offline-First Resilience Protocol
**Goal:** The app must provide full navigation and discovery value even with 0 bars of cell signal (e.g., during a packed Stadium Egress event).

## 1. The Stack
- **Database:** WatermelonDB (SQLite under the hood).
- **Sync Engine:** SyncAdapter pattern connecting to Supabase PostgreSQL.

## 2. The "Geofence Handshake" Sync Strategy
We do not sync the entire world. We sync strictly based on **Proximity**.

### Tiered Radius Approach (Battery Optimized)
| Tier | Radius | Trigger Type | Action |
|------|--------|--------------|--------|
| Outer | 5km | Significant Location Change | Queue sync for next opportunity |
| Inner | 1km | Region Enter (CLCircularRegion) | Immediate background sync |
| Core | 200m | High accuracy check | Enable WebSocket prep |

**iOS Optimization Rules:**
- Use `CLLocationManager.significantLocationChangeMonitoring` for Outer tier only
- Use `CLCircularRegion` for Inner tier (max 20 regions system-wide)
- NEVER request continuous location updates in background

**Sync Throttling:**
- Max 1 HubManifest sync per hub per 30 minutes
- Skip sync if last manifest < 15 min old AND app was foregrounded since

### Phase A: The "Dormant" Pre-Fetch
*Trigger:* User enters the 1km (Inner tier) radius of a Hub.
*Action:*
1.  **Silent Sync:** App wakes up in background.
2.  **Payload:** Downloads the `HubManifest` JSON.
    ```json
    {
      "hub_id": "water-street",
      "manifest_version": "2024.1.15",
      "filter_rules_version": "1.2.0",
      "filter_rules": {
        "open_door": {
          "max_wait_minutes": 15,
          "max_friction": 80,
          "allowed_confidence": ["live", "recent"]
        }
      },
      "venues": [...],
      "zones": [...],
      "navigation_graph": {...},
      "scheduled_closures": [...]
    }
    ```
    - **Crucial:** This data is written to WatermelonDB immediately.
3.  **Asset Caching:** Checks if 3D Building Models (GLB files) are cached.

### Filter Version Handling
**Client Behavior:**
- Store `filter_rules` and `filter_rules_version` in WatermelonDB
- On offline filter request, use stored rules (not hardcoded logic)
- On reconnect, compare `filter_rules_version`
- If major version differs: show "Update app for accurate Open Door"

### Phase B: The "Dead Zone" Fallback (No Network)
*Scenario:* User opens app at 10:15 PM outside Amalie Arena. Network is dead.
*Behavior:*
1.  **Map Engine:** Loads 3D buildings from local cache.
2.  **Navigation:** Calculates walking paths using local `NavigationGraph`.
3.  **Vibe Data (The degradation):**
    - **Check 1:** Is there a `ScheduledClosure` for right now? If yes, show "Closed".
    - **Check 2:** If no closure, default to **"Historical Mode"** (Last known Friday average).
    - **UI Indicator:** Show "Offline Mode" icon. Display data as "Predicted Vibe."

## 3. WatermelonDB Schema Structure
```javascript
// Hub-level settings (including filter rules)
tableSchema({
  name: 'hubs',
  columns: [
    { name: 'hub_id', type: 'string', isIndexed: true },
    { name: 'name', type: 'string' },
    { name: 'manifest_version', type: 'string' },
    { name: 'filter_rules_version', type: 'string' },  // SemVer for drift detection
    { name: 'filter_rules', type: 'string' },  // JSON: { open_door: { max_wait_minutes, ... } }
    { name: 'last_sync_timestamp', type: 'number' }
  ]
})

// Venue records
tableSchema({
  name: 'venues',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'hub_id', type: 'string', isIndexed: true },
    { name: 'coordinates', type: 'string' }, // JSON stringified {lat, lng}
    { name: 'base_popularity_score', type: 'number' },
    { name: 'historical_wait_avg', type: 'string' }, // JSON { "fri_2000": 45 }
    // RESILIENCE FIELDS
    { name: 'scheduled_closures', type: 'string' }, // JSON array of unix timestamps
    { name: 'last_known_state_id', type: 'number' },
    { name: 'state_timestamp', type: 'number' },  // Unix timestamp of last state update
    { name: 'state_confidence', type: 'string' } // 'live' | 'recent' | 'stale' | 'historical'
  ]
})