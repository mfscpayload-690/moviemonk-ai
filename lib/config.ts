/**
 * Centralized configuration for the application.
 * Handles environment variable access safely across different environments (Vite, Jest, etc.)
 */

const getEnv = (key: string, defaultValue = ''): string => {
  // @ts-ignore - Vite uses import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // @ts-ignore - Fallback for Jest/Node
  return process.env[key] || defaultValue;
};

export const API_BASE_URL = getEnv('VITE_API_BASE_URL');
export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');
export const IS_DEV = getEnv('DEV') === 'true' || getEnv('MODE') === 'development';
export const IS_PROD = getEnv('PROD') === 'true' || getEnv('MODE') === 'production';
export const PERF_DEBUG = getEnv('VITE_PERF_DEBUG') === 'true';
