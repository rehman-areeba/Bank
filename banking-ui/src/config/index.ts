/**
 * Application Configuration
 * Centralized configuration management using environment variables
 */

interface AppConfig {
  apiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  mode: string;
}

/**
 * Validates that required environment variables are set
 */
const validateConfig = (): void => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl && import.meta.env.PROD) {
    console.warn(
      '[Config Warning] VITE_API_URL is not set in production. Using fallback URL.'
    );
  }
};

/**
 * Application configuration object
 * All environment variables should be accessed through this object
 */
export const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5245',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE || 'development',
};

// Validate configuration on module load
validateConfig();

// Log configuration in development
if (config.isDevelopment) {
  console.log('[App Config]', {
    apiUrl: config.apiUrl,
    mode: config.mode,
  });
}

export default config;
