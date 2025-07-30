// Environment configuration with type safety
export const env = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  NODE_ENV: import.meta.env.MODE || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

// Helper to check if we're in development
export const isDev = env.DEV;
export const isProd = env.PROD;
