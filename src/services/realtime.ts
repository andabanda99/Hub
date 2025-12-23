/**
 * Real-Time WebSocket Service using Ably
 * Per CLAUDE.md Section 6 - WebSocket Connection Lifecycle
 */

import Ably from 'ably';
import { ENV } from '../config/env';
import type { VenueStateDelta, SyncResponse } from '../types';

// Connection states per CLAUDE.md
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'suspended';

// Reconnection strategy per CLAUDE.md
const RECONNECT_CONFIG = {
  initialRetryDelay: 1000, // 1 second
  backoffMultiplier: 2,
  maxBackoff: 30000, // 30 seconds
  maxRetries: 5,
  pollingInterval: 30000, // 30s fallback polling
} as const;

type StateChangeCallback = (delta: VenueStateDelta) => void;
type ConnectionStateCallback = (state: ConnectionState) => void;

class RealtimeService {
  private client: Ably.Realtime | null = null;
  private channel: Ably.RealtimeChannel | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private lastEventId: string | null = null;
  private retryCount = 0;
  private currentHubId: string | null = null;
  private messageQueue: VenueStateDelta[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;

  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();

  /**
   * Initialize the Ably client
   */
  initialize(): void {
    if (this.client) return;

    this.client = new Ably.Realtime({
      key: ENV.ABLY_API_KEY,
      echoMessages: false,
      autoConnect: false, // Manual connection control per battery protocol
    });

    this.setupConnectionListeners();
  }

  /**
   * Set up connection state listeners
   */
  private setupConnectionListeners(): void {
    if (!this.client) return;

    this.client.connection.on('connected', () => {
      this.updateConnectionState('connected');
      this.retryCount = 0;
      this.stopPolling();

      // Request delta sync if we have a last event ID
      if (this.lastEventId && this.channel) {
        this.requestDeltaSync();
      }
    });

    this.client.connection.on('disconnected', () => {
      this.updateConnectionState('disconnected');
      this.handleDisconnect();
    });

    this.client.connection.on('suspended', () => {
      this.updateConnectionState('suspended');
      this.startPollingFallback();
    });

    this.client.connection.on('failed', () => {
      this.updateConnectionState('disconnected');
      this.handleConnectionFailed();
    });
  }

  /**
   * Connect to a hub's real-time channel
   * Per CLAUDE.md: Stage 3 (Live) - WebSocket connection ONLY when app is foregrounded inside the Zone
   */
  async connect(hubId: string): Promise<void> {
    if (!this.client) {
      this.initialize();
    }

    this.currentHubId = hubId;
    this.updateConnectionState('connecting');

    // Connect to Ably
    this.client!.connect();

    // Subscribe to hub channel
    this.channel = this.client!.channels.get(`hub:${hubId}`);

    this.channel.subscribe('venue_state', (message) => {
      const delta = message.data as VenueStateDelta;
      this.lastEventId = message.id;
      this.notifyStateChange(delta);
    });

    // Subscribe to sync responses
    this.channel.subscribe('sync', (message) => {
      const syncResponse = message.data as SyncResponse;
      this.handleSyncResponse(syncResponse);
    });
  }

  /**
   * Graceful disconnect
   * Per CLAUDE.md: App backgrounded -> Graceful disconnect after 10 seconds
   */
  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.client) {
      this.client.close();
    }

    this.stopPolling();
    this.updateConnectionState('disconnected');
  }

  /**
   * Handle disconnect with retry logic
   */
  private handleDisconnect(): void {
    if (this.retryCount >= RECONNECT_CONFIG.maxRetries) {
      this.startPollingFallback();
      return;
    }

    const delay = Math.min(
      RECONNECT_CONFIG.initialRetryDelay *
        Math.pow(RECONNECT_CONFIG.backoffMultiplier, this.retryCount),
      RECONNECT_CONFIG.maxBackoff
    );

    this.retryCount++;

    setTimeout(() => {
      if (this.currentHubId && this.connectionState === 'disconnected') {
        this.connect(this.currentHubId);
      }
    }, delay);
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailed(): void {
    this.startPollingFallback();
  }

  /**
   * Start polling fallback after 5 failed retries
   * Per CLAUDE.md: Fall back to polling mode (30s interval)
   */
  private startPollingFallback(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      // Poll for updates via HTTP
      this.pollForUpdates();
    }, RECONNECT_CONFIG.pollingInterval);
  }

  /**
   * Stop polling fallback
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for updates (HTTP fallback)
   */
  private async pollForUpdates(): Promise<void> {
    // This would call the HTTP API to get latest venue states
    // Implementation depends on your API structure
    console.log('Polling for updates...');
  }

  /**
   * Request delta sync on reconnect
   * Per CLAUDE.md: Reconnect with `last_event_id` header for delta sync
   */
  private requestDeltaSync(): void {
    if (!this.channel || !this.lastEventId) return;

    this.channel.publish('request_sync', {
      lastEventId: this.lastEventId,
    });
  }

  /**
   * Handle sync response from server
   */
  private handleSyncResponse(response: SyncResponse): void {
    this.lastEventId = response.lastEventId;

    // Process all deltas
    for (const delta of response.deltas) {
      this.notifyStateChange(delta);
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionStateCallbacks.forEach((callback) => callback(state));
  }

  /**
   * Notify listeners of state changes
   */
  private notifyStateChange(delta: VenueStateDelta): void {
    this.stateChangeCallbacks.forEach((callback) => callback(delta));
  }

  /**
   * Subscribe to venue state changes
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);
    return () => this.connectionStateCallbacks.delete(callback);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get last event ID for sync purposes
   */
  getLastEventId(): string | null {
    return this.lastEventId;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
