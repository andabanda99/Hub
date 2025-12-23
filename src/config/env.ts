/**
 * Environment Configuration
 *
 * In production, these should come from environment variables.
 * For development, you can use a .env file with expo-constants.
 */

export const ENV = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // Ably (WebSockets)
  ABLY_API_KEY: process.env.EXPO_PUBLIC_ABLY_API_KEY || '',

  // Mapbox
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',

  // Feature flags
  ENABLE_OFFLINE_MODE: true,
  ENABLE_3D_BUILDINGS: true,

  // Debug
  DEBUG_MODE: __DEV__,
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'ABLY_API_KEY',
    'MAPBOX_ACCESS_TOKEN',
  ] as const;

  const missing = required.filter(
    (key) => !ENV[key as keyof typeof ENV]
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}
