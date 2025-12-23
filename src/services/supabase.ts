/**
 * Supabase Client Configuration
 * Per CLAUDE.md Section 2 - Backend: Supabase (PostgreSQL + PostGIS)
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';
import type { HubManifest } from '../types';

// Create Supabase client
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Fetch the HubManifest for a specific hub
 * Per ARCHITECTURE_OFFLINE.md Phase A
 */
export async function fetchHubManifest(hubId: string): Promise<HubManifest | null> {
  try {
    const { data, error } = await supabase
      .from('hub_manifests')
      .select('*')
      .eq('hub_id', hubId)
      .single();

    if (error) {
      console.error('Error fetching hub manifest:', error);
      return null;
    }

    return data as HubManifest;
  } catch (error) {
    console.error('Error fetching hub manifest:', error);
    return null;
  }
}

/**
 * Fetch venues with Open Door filter (server-side)
 * Per CLAUDE.md Section 4.B - SECURITY CRITICAL
 */
export async function fetchOpenDoorVenues(hubId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('hub_id', hubId)
      .eq('filter', 'open_door'); // Server applies the filter

    if (error) {
      console.error('Error fetching open door venues:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching open door venues:', error);
    return [];
  }
}

/**
 * Fetch friction score inputs from external APIs
 * This is typically handled server-side to aggregate Uber, Traffic, Parking data
 */
export async function fetchFrictionInputs(hubId: string): Promise<{
  uberSurge: number | null;
  trafficFlow: number | null;
  garageOccupancy: number | null;
  historicalMax: number;
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-friction-inputs', {
      body: { hubId },
    });

    if (error) {
      console.error('Error fetching friction inputs:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching friction inputs:', error);
    return null;
  }
}
