/**
 * WatermelonDB Database Setup
 * Per ARCHITECTURE_OFFLINE.md
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { modelClasses } from './models';

// Create the adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'thehub',
  jsi: true, // Enable JSI for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Create the database
export const database = new Database({
  adapter,
  modelClasses,
});

// Export collections for easy access
export const hubsCollection = database.get('hubs');
export const venuesCollection = database.get('venues');
export const zonesCollection = database.get('zones');

export { schema } from './schema';
export * from './models';
