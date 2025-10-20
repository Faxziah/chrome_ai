import { HistoryItem, FavoriteItem, ApiConfig } from '../types';
import { validateApiKey } from './utils';

export class StorageService {
  private static readonly STORAGE_KEYS = {
    API_KEY: 'gemini_api_key',
    HISTORY: 'chat_history',
    FAVORITES: 'favorites',
    API_CONFIG: 'api_config',
    LANGUAGE: 'interface_language'
  } as const;

  public static readonly HISTORY_LIMIT = 20;

  async getApiKey(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(StorageService.STORAGE_KEYS.API_KEY);
      return result[StorageService.STORAGE_KEYS.API_KEY] || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      if (!validateApiKey(apiKey)) {
        throw new Error('Invalid API key format');
      }
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.API_KEY]: apiKey
      });
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }

  async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await chrome.storage.local.get(StorageService.STORAGE_KEYS.HISTORY);
      const history = result[StorageService.STORAGE_KEYS.HISTORY] || [];
      
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  async saveToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now()
      };

      const updatedHistory = [newItem, ...history].slice(0, StorageService.HISTORY_LIMIT);
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.HISTORY]: updatedHistory
      });
      
      return true;
    } catch (error) {
      console.error('Error saving to history:', error);
      return false;
    }
  }

  async removeFromHistory(itemId: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(item => item.id !== itemId);
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.HISTORY]: updatedHistory
      });
      
      return true;
    } catch (error) {
      console.error('Error removing from history:', error);
      return false;
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.HISTORY]: []
      });
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const result = await chrome.storage.local.get(StorageService.STORAGE_KEYS.FAVORITES);
      const favorites = result[StorageService.STORAGE_KEYS.FAVORITES] || [];
      
      return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addToFavorites(item: Omit<FavoriteItem, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      
      // Check for duplicates by sourceId or content
      const isDuplicate = favorites.some(f => 
        (item.metadata?.sourceId && f.metadata?.sourceId === item.metadata.sourceId) ||
        (f.type === item.type && f.prompt === item.prompt && f.response === item.response)
      );
      
      if (isDuplicate) {
        return true; // Already exists, no need to add
      }
      
      const newFavorite: FavoriteItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now()
      };

      const updatedFavorites = [newFavorite, ...favorites];
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.FAVORITES]: updatedFavorites
      });
      
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  async removeFromFavorites(itemId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(item => item.id !== itemId);
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.FAVORITES]: updatedFavorites
      });
      
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  async updateFavorite(itemId: string, updates: Partial<FavoriteItem>): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.FAVORITES]: updatedFavorites
      });
      
      return true;
    } catch (error) {
      console.error('Error updating favorite:', error);
      return false;
    }
  }

  async getApiConfig(): Promise<ApiConfig | null> {
    try {
      const result = await chrome.storage.local.get(StorageService.STORAGE_KEYS.API_CONFIG);
      return result[StorageService.STORAGE_KEYS.API_CONFIG] || null;
    } catch (error) {
      console.error('Error getting API config:', error);
      return null;
    }
  }

  async setApiConfig(config: Partial<ApiConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getApiConfig() || {};
      const updatedConfig = { ...currentConfig, ...config };
      
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.API_CONFIG]: updatedConfig
      });
      
      return true;
    } catch (error) {
      console.error('Error setting API config:', error);
      return false;
    }
  }

  async setHistory(items: HistoryItem[]): Promise<boolean> {
    try {
      const limitedItems = items.slice(0, StorageService.HISTORY_LIMIT);
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.HISTORY]: limitedItems
      });
      return true;
    } catch (error) {
      console.error('Error setting history:', error);
      return false;
    }
  }

  async setFavorites(items: FavoriteItem[]): Promise<boolean> {
    try {
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.FAVORITES]: items
      });
      return true;
    } catch (error) {
      console.error('Error setting favorites:', error);
      return false;
    }
  }

  async clearFavorites(): Promise<boolean> {
    try {
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.FAVORITES]: []
      });
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }

  async getLanguage(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(StorageService.STORAGE_KEYS.LANGUAGE);
      return result[StorageService.STORAGE_KEYS.LANGUAGE] || 'en';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'en';
    }
  }

  async setLanguage(language: string): Promise<boolean> {
    try {
      await chrome.storage.local.set({
        [StorageService.STORAGE_KEYS.LANGUAGE]: language
      });
      return true;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  public generateSourceId(type: string, prompt: string, response: string): string {
    const content = `${type}|${prompt}|${response}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
