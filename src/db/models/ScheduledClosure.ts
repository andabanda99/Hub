import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

/**
 * ScheduledClosure Model
 *
 * Represents planned venue closures for offline-aware filtering.
 * Per ARCHITECTURE_OFFLINE.md: Check 1 before showing venue state.
 */
export default class ScheduledClosure extends Model {
  static table = 'scheduled_closures';

  static associations = {
    venues: { type: 'belongs_to' as const, key: 'venue_id' },
  };

  @text('venue_id') venueId!: string;
  @field('start_time') startTime!: number; // Unix timestamp (ms)
  @field('end_time') endTime!: number; // Unix timestamp (ms)
  @text('reason') reason!: string | null;
  @field('created_at') createdAt!: number;

  @relation('venues', 'venue_id') venue: any;

  /**
   * Check if the closure is currently active
   * @param now - Current timestamp (defaults to Date.now())
   */
  isActive(now: number = Date.now()): boolean {
    return now >= this.startTime && now <= this.endTime;
  }

  /**
   * Check if the closure is upcoming (starts within specified hours)
   * @param hours - Hours to look ahead (default 24)
   * @param now - Current timestamp (defaults to Date.now())
   */
  isUpcoming(hours: number = 24, now: number = Date.now()): boolean {
    const lookAheadMs = hours * 60 * 60 * 1000;
    return this.startTime > now && this.startTime <= now + lookAheadMs;
  }

  /**
   * Get the duration of the closure in hours
   */
  get durationHours(): number {
    return (this.endTime - this.startTime) / (60 * 60 * 1000);
  }

  /**
   * Get a human-readable description of the closure
   */
  get displayText(): string {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };

    const startStr = start.toLocaleDateString('en-US', dateOptions);
    const endStr = end.toLocaleDateString('en-US', dateOptions);

    if (this.reason) {
      return `Closed ${startStr} - ${endStr}: ${this.reason}`;
    }
    return `Closed ${startStr} - ${endStr}`;
  }
}
