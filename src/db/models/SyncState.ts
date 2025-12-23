import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

/**
 * SyncState Model
 *
 * Tracks sync progress and last event IDs for WebSocket reconnection.
 * Per CLAUDE.md Section 6: WebSocket Connection Lifecycle.
 *
 * Key-value store for sync metadata:
 * - last_event_id: For delta sync on reconnect
 * - last_sync_timestamp: When we last synced with server
 * - manifest_version: Current hub manifest version
 * - filter_rules_version: Current filter rules version (SemVer)
 */
export default class SyncState extends Model {
  static table = 'sync_state';

  @text('key') key!: string;
  @text('value') value!: string;
  @field('updated_at') updatedAt!: number;

  /**
   * Parse value as JSON if applicable
   */
  getValueAsJson<T>(): T | null {
    try {
      return JSON.parse(this.value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Parse value as number if applicable
   */
  getValueAsNumber(): number | null {
    const num = Number(this.value);
    return isNaN(num) ? null : num;
  }

  /**
   * Check if this sync state entry is stale
   * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
   */
  isStale(maxAgeMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this.updatedAt > maxAgeMs;
  }
}

/**
 * Well-known sync state keys
 * Use these constants to ensure consistency
 */
export const SyncStateKeys = {
  /** Last event ID received from WebSocket for delta sync */
  LAST_EVENT_ID: 'last_event_id',

  /** Timestamp of last successful sync with server */
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',

  /** Current hub manifest version (e.g., "2024.1.15") */
  MANIFEST_VERSION: 'manifest_version',

  /** Current filter rules version (SemVer, e.g., "1.2.0") */
  FILTER_RULES_VERSION: 'filter_rules_version',

  /** Current connection state (for debugging) */
  CONNECTION_STATE: 'connection_state',

  /** Number of failed reconnection attempts */
  RETRY_COUNT: 'retry_count',

  /** Timestamp when polling fallback was activated */
  POLLING_STARTED_AT: 'polling_started_at',
} as const;

export type SyncStateKey = (typeof SyncStateKeys)[keyof typeof SyncStateKeys];
