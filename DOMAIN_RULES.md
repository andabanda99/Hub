# DOMAIN RULES: Math, Logic & Privacy

## 1. The Friction Score Algorithm (With Waterfall Fallback)
**Purpose:** Quantify the "Pain of Entry" for a user trying to reach a Hub.

### Input Normalization (REQUIRED)
All inputs MUST be normalized to 0-100 before applying weights:

| Source | Raw Value | Normalization Formula |
|--------|-----------|----------------------|
| Uber Surge | 1.0x - 5.0x | `(surge - 1.0) / 4.0 * 100` |
| Traffic Flow | 0 - max_congestion | `flow / historical_max * 100` |
| Garage Occupancy | 0% - 100% | Already normalized |

### Standard Formula (Clarified):
```
Raw_Score = (Norm_Uber * 1.5) + (Norm_Traffic * 1.2) + (Norm_Garage * 1.0)
Total_Weight = 1.5 + 1.2 + 1.0  // = 3.7
Friction_Score = Raw_Score / Total_Weight  // Output: 0-100
```

### The Fallback Waterfall (Handling Null APIs):
If an API source fails (returns `null` or timeout), the algorithm **must not** return `NaN`. It must re-distribute weights proportionally.

| Scenario | Uber Weight | Traffic Weight | Garage Weight | Divisor |
|----------|-------------|----------------|---------------|---------|
| All Up | 1.5 | 1.2 | 1.0 | 3.7 |
| Uber Down | 0 | 1.8 | 1.35 | 3.15 |
| Traffic Down | 2.25 | 0 | 1.5 | 3.75 |
| Garage Down | 1.85 | 1.48 | 0 | 3.33 |
| Two Sources Down | Use remaining × 3.7 | - | - | 3.7 |
| Total Blackout | Return `null` | - | - | - |

**UI for Total Blackout:** Display "Vibe: Unknown" (Grey Glow).

## 2. The Gravity Well Algorithm
**Purpose:** Calculate the effective "Pull" radius of a venue on the 3D Map.

### Formula (With Cap):
`Effective_Radius = min(Base_Radius + (Ad_Boost * Multiplier), Max_Radius)`

### Constraints:
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Base_Radius | 100m | Default visibility for all venues |
| Max_Radius | 200m | Prevents district domination |
| Ad_Boost Range | 0-40 | Capped to prevent exceeding Max_Radius |
| Multiplier | 2.5m/point | Growth rate per boost point |

### Visual Overlap Rules:
- If two venue radii overlap > 50%, reduce both proportionally
- "Anchor" venues (Sparkman, Predalina) get +20% base radius (120m)
- Non-paying venues remain visible at 80m minimum radius

## 3. Privacy Protocol: "Bucketed Rolling Averages"
**Rule:** To protect user privacy, we **NEVER** store or display raw real-time headcounts.

### Mechanism:
1.  **Ingest:** Real-time sensor data (e.g., "53 people").
2.  **Baseline Comparison:** Compare against the **2-Week Rolling Average** for this hour.
3.  **Bucketing (Quantization):** Map the result to a strict **State ID**.
    * *State 0 (Closed/Empty):* < 10 people (Do not report data).
    * *State 1 (Quiet):* 10-30% Capacity.
    * *State 2 (Social):* 30-75% Capacity.
    * *State 3 (Party):* > 75% Capacity.
4.  **Output:** The API sends ONLY the `state_id` to the client.

### State Transition Debouncing (Anti-Timing Attack)
To prevent competitors from reconstructing granular occupancy data via timing analysis:

1. **Batch Window:** State changes are held for 5-minute windows before broadcast
2. **Jitter:** Add random 0-120 second delay to all state change broadcasts
3. **Threshold Hysteresis:** Require 2 consecutive readings in new state before transition

**Example Timeline:**
```
10:00:00 - Sensor reads 32% (crosses State 2 threshold)
10:00:30 - Sensor reads 29% (back to State 1 range)
10:01:00 - Sensor reads 31% (State 2 again)
10:01:30 - Sensor reads 33% (State 2 confirmed - 2 consecutive)
10:05:00 + random(0-120s) - Broadcast State 2 to clients
```

This prevents correlating exact occupancy changes with broadcast timestamps.

## 4. State Confidence & Staleness Tolerance
**Purpose:** Define how data freshness affects feature availability, especially for offline scenarios.

| Confidence Level | Data Age | Open Door Eligible | UI Treatment |
|------------------|----------|-------------------|--------------|
| `live` | < 5 min | Yes | Normal display |
| `recent` | 5-30 min | Yes | Show "~" prefix on wait times |
| `stale` | 30-60 min | No | Show "Last updated X min ago" |
| `historical` | > 60 min | No | Show "Predicted" label, grey tint |

**Rationale:** The `recent` confidence level solves the Stadium Egress Problem. When users lose cell signal for 5-30 minutes, they can still use Open Door with slightly degraded accuracy rather than losing the feature entirely.

## 5. The "Open Door" Threshold
**Rule:** A venue is "Open" if ALL conditions are met:
1.  `Wait_Time < 15 minutes`
2.  AND `Friction_Score < 80`
3.  AND `Status != "Private Event"`
4.  AND `State_Confidence IN ('live', 'recent')`

**Edge Case - Total Offline:** If `State_Confidence = 'historical'`, the Open Door filter is disabled. UI shows: "Open Door unavailable - showing predicted vibes."