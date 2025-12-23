import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';
import type { Coordinates } from '../../types';

/**
 * NavigationNode Model
 *
 * Graph nodes for offline pathfinding per ARCHITECTURE_OFFLINE.md.
 * Represents intersections, entrances, and waypoints within a hub.
 */
export default class NavigationNode extends Model {
  static table = 'navigation_nodes';

  static associations = {
    hubs: { type: 'belongs_to' as const, key: 'hub_id' },
  };

  @text('node_id') nodeId!: string;
  @text('hub_id') hubId!: string;
  @text('coordinates') coordinatesJson!: string;
  @text('node_type') nodeType!: 'intersection' | 'entrance' | 'waypoint';
  @field('created_at') createdAt!: number;

  @relation('hubs', 'hub_id') hub: any;

  /**
   * Parse coordinates from JSON string
   */
  get coordinates(): Coordinates {
    try {
      return JSON.parse(this.coordinatesJson);
    } catch {
      return { lat: 0, lng: 0 };
    }
  }

  /**
   * Check if this node is an entrance to a venue
   */
  get isEntrance(): boolean {
    return this.nodeType === 'entrance';
  }

  /**
   * Check if this node is a walkable intersection
   */
  get isIntersection(): boolean {
    return this.nodeType === 'intersection';
  }
}
