# THE HUB - Project Constitution

## 1. Project Vision & Philosophy
**The Hub** is a "Digital Twin" operating system for nightlife districts. It bridges the information gap between venues and users in real-time.
- **Core Value:** "Situation Awareness" for users; "Volume Control" for venues.
- **Design Principle:** "Ambient Presence." Use light, color, and 3D architecture to communicate "Vibe." Avoid text heaviness. No social feeds.
- **User Promise:** "The Open Door." We prioritize helping users find immediate access over "popular" spots.
- **Scalability:** The system is City-Agnostic. Tampa (Water Street) is just Instance 001.

## 2. Architecture & Tech Stack
- **Frontend:** React Native (Expo).
- **Maps:** Mapbox GL JS / Mapbox Mobile SDK (Custom "Midnight" Style).
    - *Key Feature:* Instanced Rendering for 3D Buildings with dynamic shader support (Glow effects).
- **Backend:** Supabase (PostgreSQL + PostGIS).
- **Real-Time:** Ably (WebSockets) for live "Vibe" state updates.
- **Offline Logic:** WatermelonDB (Local-First Architecture).
    - *Rule:* The app must fully function (Navigation + Map Rendering) without cell service.

## 3. The Domain Model (Strict Hierarchy)
1.  **Metro:** (e.g., Tampa Bay)
2.  **Hub (Container):** (e.g., Water Street). Defined by a strict Polygon Geofence.
    - *Global State:* Tracks "Event Phase" (e.g., Lightning Game Egress).
3.  **Venue (Node):** (e.g., Predalina). Belongs to ONE Hub.
    - *Dynamic State:* Venues do not have static profiles. They have **Sensor-Driven States** (Quiet, Social, Party).
    - *Per-Venue Friction:* Each venue tracks its own friction score with 4-factor breakdown (Uber, Traffic, Foot, Garage).

## 4. Core Algorithms (The "Brain")

### A. The Friction Score (4-Factor Algorithm)
Calculate "Resistance" to entry with **Graceful Degradation** and per-venue tracking.

- **Formula (Standard Mode):**
  ```
  Friction = (Uber*0.15) + (Traffic*0.25) + (Foot*0.4) + (Garage*0.2)
  ```
  - **Uber Surge:** 15% weight (Quaternary signal - demand indicator)
  - **Traffic Flow:** 25% weight (Secondary signal - road congestion)
  - **Foot Traffic:** 40% weight (PRIMARY signal - direct venue congestion)
  - **Garage Occupancy:** 20% weight (Tertiary signal - parking difficulty)

- **Formula (Degraded Mode - when Foot Traffic unavailable):**
  ```
  Friction = (Uber*0.20) + (Traffic*0.35) + (Foot*0.05) + (Garage*0.4)
  ```
  - **Confidence Penalty:** When primary source (foot traffic) is down, weights automatically redistribute
  - System enters "degraded mode" with `is_degraded_mode: true` flag
  - Garage weight increases to 40% (becomes primary signal)

- **Resilience:** Implements a "Fallback Waterfall." If any API is down/null, weights automatically rebalance. Supports 1-4 active sources. Returns `null` only on total blackout (all sources down).

- **Per-Venue Storage:** Each venue stores:
  - `score_friction`: Final 0-100 score
  - `raw_uber_factor`, `raw_traffic_factor`, `raw_foot_factor`, `raw_garage_factor`: Normalized 0-100 values for UI breakdown
  - `is_degraded_mode`: Boolean indicating if calculated without primary source
  - `friction_calculated_at`: Timestamp of last calculation

### B. The "Open Door" Filter (Server-Side)
**SECURITY CRITICAL:** Filtering happens at the Edge, not the Client.
- **Mechanism:** Client requests `GET /venues?filter=open_door`.
- **Logic:** Server returns ONLY venues where:
    1. `Wait_Time < 15m`
    2. `Friction < 80`
    3. `Status != Private`
- **Why:** Prevents users/competitors from scraping data on hidden/full venues.

### C. Gravity Well (Business Logic)
- **Concept:** Venues pay for **Visibility**, not "Flash Sales."
- **Mechanism:** "Ad Boost" increases the glowing radius of the building on the 3D map.

## 5. Coding Standards & Performance Rules
- **Battery Protocol:**
    - **Stage 1 (Dormant):** Significant Location Change only.
    - **Stage 2 (Wake-Up):** Fetch JSON State Packet upon Geofence Entry.
    - **Stage 3 (Live):** WebSocket connection ONLY when app is foregrounded inside the Zone.
- **3D Optimization:**
    - Use low-poly base models for "Filler" buildings.
    - Use High-Fidelity models only for "Anchor" venues.
    - Strict memory management for Mapbox textures.

## 6. WebSocket Connection Lifecycle
**Purpose:** Define explicit behavior for real-time connection management.

### Connection States
```
DISCONNECTED -> CONNECTING -> CONNECTED -> SUSPENDED -> DISCONNECTED
                    |                          ^
                    +--- (auth fail) ----------+
```

### Reconnection Strategy
| Parameter | Value |
|-----------|-------|
| Initial retry delay | 1 second |
| Backoff multiplier | 2x |
| Max backoff | 30 seconds |
| Max retries before fallback | 5 |

After 5 failed retries, fall back to polling mode (30s interval) until network stability improves.

### Background/Foreground Handling
| Event | Action |
|-------|--------|
| App backgrounded | Graceful disconnect after 10 seconds |
| App foregrounded (in zone) | Immediate reconnect attempt |
| Network lost | Enter SUSPENDED state, queue outbound messages |
| Network restored | Reconnect with `last_event_id` header for delta sync |

### State Reconciliation on Reconnect
On reconnect, client sends `last_event_id`. Server responds with delta:
```json
{
  "type": "sync",
  "last_event_id": "evt_12345",
  "deltas": [
    {"venue_id": "v1", "state_id": 2, "confidence": "live", "timestamp": 1703001234},
    {"venue_id": "v3", "state_id": 1, "confidence": "live", "timestamp": 1703001256}
  ]
}
```
Client merges deltas into local WatermelonDB, updating `state_confidence` based on timestamp age.

## 7. Commands
- `npm run start` - Start Expo development server.
- `supabase start` - Spin up local backend containers.
- `test:algo` - Run unit tests for Friction Score calculation.

## 8. Operational Protocols & Macros

### 💾 The "Checkpoint" Protocol
**Trigger:** When user says **"Checkpoint"** or **"Save Project"**.
**Action:** Strictly perform the following:
1.  **Scan:** Read the current project directory structure.
2.  **Generate:** Overwrite/Create `docs/PROJECT_STATUS.md`.
3.  **Content Requirement:**
    - **Timestamp:** Current date/time.
    - **Tree:** A visual tree of key folders (exclude `node_modules`).
    - **Task Ledger:** A checklist of [Completed] vs [Pending] tasks based on chat history.
    - **Next Step:** A one-sentence recommendation for the immediate next action.
4.  **Execute:** Do not ask permission. Generate the file and confirm "Project State Saved."

### 🧠 Plan Mode
**Trigger:** When user says **"Plan: [Feature Name]"**.
**Action:** You must NOT write code yet. Instead:
1.  **Analyze:** Scan relevant files to understand impact.
2.  **Design:** Output a pseudo-code architectural plan.
3.  **Verify:** Ask 3 clarifying questions about edge cases (e.g., "What if the user is offline?").
4.  **Wait:** Do not generate code until user says "Execute".

### 🚑 Debug Mode
**Trigger:** When user says **"Fix: [Error Message]"**.
**Action:**
1.  **Root Cause:** Do not suggest a fix immediately. Explain *why* the error happened.
2.  **Isolate:** Propose the SMALLEST possible change to fix it.
3.  **One Variable:** Do not refactor unrelated code "while you're at it." Fix the bug, nothing else.

## 8. Strict Coding Constraints

### ⚡ The "No-Lazy" Rule
- **FULL CODE ONLY:** Never use comments like `// ... rest of code` or `// ... implement logic`. You must write every single line of code, every time.
- **No Placeholders:** If editing a file, output the *entire* modified function or component, not just the changed lines, so I can copy-paste safely.

### 🛡️ Stack Guards
- **Routing:** Use **Expo Router** (File-based routing). DO NOT use `react-navigation` syntax manually.
- **Styling:** Use **NativeWind** (Tailwind). DO NOT use `StyleSheet.create` unless explicitly asked.
- **State:** Use **WatermelonDB** observables. DO NOT use Redux or Context for database data.
- **Imports:** Always check `package.json` before importing a new library. If it's not there, ask permission to install it.