import { dbService } from './database';
import { env } from '../config/env';

const API_KEY_SETTING = 'openai_api_key';

export class ApiKeyService {
  private static instance: ApiKeyService;
  private cachedApiKey: string | null = null;

  private constructor() {}

  static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * Get the current OpenAI API key
   * Priority: User's stored key > Environment variable
   */
  async getApiKey(): Promise<string> {
    try {
      // Try to get user's stored API key first
      const userApiKey = await dbService.getSetting(API_KEY_SETTING);
      if (userApiKey && userApiKey.trim() !== '') {
        this.cachedApiKey = userApiKey;
        console.log('Using user-stored API key');
        return userApiKey;
      }
    } catch (error) {
      console.warn('Failed to get user API key from database:', error);
    }

    // Fall back to environment variable
    const envApiKey = env.OPENAI_API_KEY;
    this.cachedApiKey = envApiKey;

    if (envApiKey) {
      console.log('Using environment API key');
    } else {
      console.warn('No API key found in environment or user settings');
    }

    return envApiKey;
  }

  /**
   * Save the user's API key to IndexedDB
   */
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      await dbService.saveSetting(API_KEY_SETTING, apiKey);
      this.cachedApiKey = apiKey;
      console.log('API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  }

  /**
   * Clear the user's stored API key
   */
  async clearApiKey(): Promise<void> {
    try {
      await dbService.deleteSetting(API_KEY_SETTING);
      this.cachedApiKey = null;
      console.log('API key cleared successfully');
    } catch (error) {
      console.error('Failed to clear API key:', error);
      throw error;
    }
  }

  /**
   * Get the stored user API key (without fallback to env)
   */
  async getUserApiKey(): Promise<string | null> {
    try {
      return await dbService.getSetting(API_KEY_SETTING);
    } catch (error) {
      console.warn('Failed to get user API key:', error);
      return null;
    }
  }

  /**
   * Check if OpenAI API key is configured (either user or env)
   */
  async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!apiKey && apiKey.trim() !== '';
  }

  /**
   * Clear cached API key (force refresh from database on next call)
   */
  clearCache(): void {
    this.cachedApiKey = null;
  }
}

// Export singleton instance
export const apiKeyService = ApiKeyService.getInstance();
