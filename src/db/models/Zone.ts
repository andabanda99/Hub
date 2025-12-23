import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';
import type { Coordinates } from '../../types';

export type ZoneType = 'walkable' | 'restricted' | 'parking';

export default class Zone extends Model {
  static table = 'zones';

  static associations = {
    hubs: { type: 'belongs_to' as const, key: 'hub_id' },
  };

  @text('zone_id') zoneId!: string;
  @text('hub_id') hubId!: string;
  @text('name') name!: string;
  @text('polygon') polygonJson!: string;
  @text('zone_type') zoneType!: ZoneType;

  @relation('hubs', 'hub_id') hub: any;

  get polygon(): Coordinates[] {
    try {
      return JSON.parse(this.polygonJson);
    } catch {
      return [];
    }
  }
}
