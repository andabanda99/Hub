import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

/**
 * NavigationEdge Model
 *
 * Graph edges for offline pathfinding per ARCHITECTURE_OFFLINE.md.
 * Connects navigation nodes to form walkable paths within a hub.
 */
export default class NavigationEdge extends Model {
  static table = 'navigation_edges';

  static associations = {
    hubs: { type: 'belongs_to' as const, key: 'hub_id' },
    from_node: { type: 'belongs_to' as const, key: 'from_node_id' },
    to_node: { type: 'belongs_to' as const, key: 'to_node_id' },
  };

  @text('hub_id') hubId!: string;
  @text('from_node_id') fromNodeId!: string;
  @text('to_node_id') toNodeId!: string;
  @field('distance_meters') distanceMeters!: number;
  @field('is_walkable') isWalkable!: boolean;
  @field('created_at') createdAt!: number;

  @relation('hubs', 'hub_id') hub: any;

  /**
   * Get the estimated walk time in seconds
   * Assumes average walking speed of 1.4 m/s (5 km/h)
   */
  get walkTimeSeconds(): number {
    const WALKING_SPEED_MS = 1.4;
    return Math.round(this.distanceMeters / WALKING_SPEED_MS);
  }

  /**
   * Get the estimated walk time in minutes
   */
  get walkTimeMinutes(): number {
    return Math.round(this.walkTimeSeconds / 60);
  }

  /**
   * Check if this edge can be used for routing
   */
  get isRoutable(): boolean {
    return this.isWalkable && this.distanceMeters > 0;
  }
}
