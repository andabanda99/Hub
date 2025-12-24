import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';
import type { Coordinates, StateConfidence, VenueStateId } from '../../types';

export default class Venue extends Model {
  static table = 'venues';

  static associations = {
    hubs: { type: 'belongs_to' as const, key: 'hub_id' },
  };

  @text('venue_id') venueId!: string;
  @text('hub_id') hubId!: string;
  @text('name') name!: string;
  @text('coordinates') coordinatesJson!: string;
  @field('base_popularity_score') basePopularityScore!: number;
  @text('historical_wait_avg') historicalWaitAvgJson!: string;
  @field('is_anchor') isAnchor!: boolean;
  @field('ad_boost') adBoost!: number;
  @text('scheduled_closures') scheduledClosuresJson!: string;
  @field('last_known_state_id') lastKnownStateId!: VenueStateId;
  @field('state_timestamp') stateTimestamp!: number;
  @text('state_confidence') stateConfidence!: StateConfidence;

  // Friction Score fields (4-factor algorithm)
  @field('score_friction') scoreFriction?: number;
  @field('raw_uber_factor') rawUberFactor?: number;
  @field('raw_traffic_factor') rawTrafficFactor?: number;
  @field('raw_foot_factor') rawFootFactor?: number;
  @field('raw_garage_factor') rawGarageFactor?: number;
  @field('is_degraded_mode') isDegradedMode?: boolean;
  @field('friction_calculated_at') frictionCalculatedAt?: number;

  @relation('hubs', 'hub_id') hub: any;

  get coordinates(): Coordinates {
    try {
      return JSON.parse(this.coordinatesJson);
    } catch {
      return { lat: 0, lng: 0 };
    }
  }

  get historicalWaitAvg(): Record<string, number> {
    try {
      return JSON.parse(this.historicalWaitAvgJson);
    } catch {
      return {};
    }
  }

  get scheduledClosures(): number[] {
    try {
      return JSON.parse(this.scheduledClosuresJson);
    } catch {
      return [];
    }
  }

  /**
   * Check if venue is currently closed based on scheduled closures
   */
  isCurrentlyClosed(currentTime: number = Date.now()): boolean {
    return this.scheduledClosures.some((closeTime) => {
      // Assuming closures are stored as start timestamps
      // and last for a reasonable duration (e.g., until end of day)
      return currentTime >= closeTime && currentTime < closeTime + 24 * 60 * 60 * 1000;
    });
  }

  /**
   * Get historical wait time for current day/hour
   */
  getHistoricalWait(date: Date = new Date()): number | null {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const day = days[date.getDay()];
    const hour = date.getHours().toString().padStart(2, '0') + '00';
    const key = `${day}_${hour}`;

    return this.historicalWaitAvg[key] ?? null;
  }
}
