import { Model } from '@nozbe/watermelondb';
import { field, text, json, children } from '@nozbe/watermelondb/decorators';
import type { Coordinates, FilterRules } from '../../types';

export default class Hub extends Model {
  static table = 'hubs';

  static associations = {
    venues: { type: 'has_many' as const, foreignKey: 'hub_id' },
    zones: { type: 'has_many' as const, foreignKey: 'hub_id' },
    navigation_nodes: { type: 'has_many' as const, foreignKey: 'hub_id' },
    navigation_edges: { type: 'has_many' as const, foreignKey: 'hub_id' },
  };

  @text('hub_id') hubId!: string;
  @text('name') name!: string;
  @text('metro_id') metroId!: string;
  @text('polygon') polygonJson!: string;
  @text('event_phase') eventPhase!: string | null;
  @text('manifest_version') manifestVersion!: string;
  @text('filter_rules_version') filterRulesVersion!: string;
  @text('filter_rules') filterRulesJson!: string;
  @field('last_sync_timestamp') lastSyncTimestamp!: number;

  @children('venues') venues: any;
  @children('zones') zones: any;

  get polygon(): Coordinates[] {
    try {
      return JSON.parse(this.polygonJson);
    } catch {
      return [];
    }
  }

  get filterRules(): FilterRules {
    try {
      return JSON.parse(this.filterRulesJson);
    } catch {
      return {
        openDoor: {
          maxWaitMinutes: 15,
          maxFriction: 80,
          allowedConfidence: ['live', 'recent'],
        },
      };
    }
  }
}
