import { FavoriteItem } from '../types';
import { StorageService } from './storage';

export interface FavoritesFilter {
  type?: 'summarize' | 'rephrase' | 'translate' | 'discuss';
  tags?: string[];
  searchText?: string;
}

export interface FavoritesStats {
  total: number;
  byType: {
    summarize: number;
    rephrase: number;
    translate: number;
    discuss: number;
  };
  byTags: Record<string, number>;
  lastAdded: number | null;
}

export class FavoritesService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  async getFavorites(filter?: FavoritesFilter): Promise<FavoriteItem[]> {
    try {
      const allFavorites = await this.storageService.getFavorites();
      
      if (!filter) {
        return allFavorites;
      }

      return allFavorites.filter(item => {
        if (filter.type && item.type !== filter.type) {
          return false;
        }

        if (filter.tags && filter.tags.length > 0) {
          const hasMatchingTag = filter.tags.some(tag => 
            item.tags?.includes(tag)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase();
          const promptMatch = item.prompt.toLowerCase().includes(searchLower);
          const responseMatch = item.response.toLowerCase().includes(searchLower);
          const originalTextMatch = item.originalText?.toLowerCase().includes(searchLower);
          const tagsMatch = item.tags?.some(tag => 
            tag.toLowerCase().includes(searchLower)
          );
          
          if (!promptMatch && !responseMatch && !originalTextMatch && !tagsMatch) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error getting filtered favorites:', error);
      return [];
    }
  }

  async addToFavorites(
    type: 'summarize' | 'rephrase' | 'translate' | 'discuss',
    prompt: string,
    response: string,
    originalText?: string,
    tags?: string[],
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const favoriteItem: Omit<FavoriteItem, 'id' | 'timestamp'> = {
        type,
        prompt,
        response,
        originalText,
        tags: tags || [],
        metadata
      };

      return await this.storageService.addToFavorites(favoriteItem);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  async removeFromFavorites(itemId: string): Promise<boolean> {
    try {
      return await this.storageService.removeFromFavorites(itemId);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  async updateFavorite(
    itemId: string, 
    updates: Partial<Omit<FavoriteItem, 'id' | 'timestamp'>>
  ): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      const favorite = favorites.find(item => item.id === itemId);
      
      if (!favorite) {
        return false;
      }

      const updatedFavorite = { ...favorite, ...updates };
      return await this.storageService.updateFavorite(itemId, updatedFavorite);
    } catch (error) {
      console.error('Error updating favorite:', error);
      return false;
    }
  }

  async addTags(itemId: string, tags: string[]): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      const favorite = favorites.find(item => item.id === itemId);
      
      if (!favorite) {
        return false;
      }

      const existingTags = favorite.tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];
      
      return await this.updateFavorite(itemId, { tags: newTags });
    } catch (error) {
      console.error('Error adding tags:', error);
      return false;
    }
  }

  async removeTags(itemId: string, tagsToRemove: string[]): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      const favorite = favorites.find(item => item.id === itemId);
      
      if (!favorite) {
        return false;
      }

      const existingTags = favorite.tags || [];
      const newTags = existingTags.filter(tag => !tagsToRemove.includes(tag));
      
      return await this.updateFavorite(itemId, { tags: newTags });
    } catch (error) {
      console.error('Error removing tags:', error);
      return false;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const favorites = await this.storageService.getFavorites();
      const allTags = new Set<string>();
      
      favorites.forEach(favorite => {
        favorite.tags?.forEach(tag => allTags.add(tag));
      });
      
      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error getting all tags:', error);
      return [];
    }
  }

  async getFavoritesStats(): Promise<FavoritesStats> {
    try {
      const favorites = await this.storageService.getFavorites();
      
      const stats: FavoritesStats = {
        total: favorites.length,
        byType: {
          summarize: 0,
          rephrase: 0,
          translate: 0,
          discuss: 0
        },
        byTags: {},
        lastAdded: null
      };

      let lastTimestamp = 0;

      favorites.forEach(item => {
        stats.byType[item.type]++;
        
        if (item.tags) {
          item.tags.forEach(tag => {
            stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
          });
        }
        
        if (item.timestamp > lastTimestamp) {
          lastTimestamp = item.timestamp;
        }
      });

      stats.lastAdded = lastTimestamp > 0 ? lastTimestamp : null;

      return stats;
    } catch (error) {
      console.error('Error getting favorites stats:', error);
      return {
        total: 0,
        byType: { summarize: 0, rephrase: 0, translate: 0, discuss: 0 },
        byTags: {},
        lastAdded: null
      };
    }
  }

  async searchFavorites(query: string): Promise<FavoriteItem[]> {
    try {
      const allFavorites = await this.storageService.getFavorites();
      const queryLower = query.toLowerCase();

      return allFavorites.filter(item => {
        const promptMatch = item.prompt.toLowerCase().includes(queryLower);
        const responseMatch = item.response.toLowerCase().includes(queryLower);
        const originalTextMatch = item.originalText?.toLowerCase().includes(queryLower);
        const tagsMatch = item.tags?.some(tag => 
          tag.toLowerCase().includes(queryLower)
        );
        
        return promptMatch || responseMatch || originalTextMatch || tagsMatch;
      });
    } catch (error) {
      console.error('Error searching favorites:', error);
      return [];
    }
  }

  async isFavorite(itemId: string): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      return favorites.some(item => item.id === itemId);
    } catch (error) {
      console.error('Error checking if favorite:', error);
      return false;
    }
  }

  async isFavoriteBySourceId(sourceId: string): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      return favorites.some(f => f.metadata?.sourceId === sourceId || f.id === sourceId);
    } catch (error) {
      console.error('Error checking if favorite by source ID:', error);
      return false;
    }
  }

  async removeBySourceId(sourceId: string): Promise<boolean> {
    try {
      const favorites = await this.storageService.getFavorites();
      const favoriteToRemove = favorites.find(f => f.metadata?.sourceId === sourceId);
      
      if (favoriteToRemove) {
        return await this.storageService.removeFromFavorites(favoriteToRemove.id);
      }
      
      return false;
    } catch (error) {
      console.error('Error removing favorite by source ID:', error);
      return false;
    }
  }

  async findBySourceId(sourceId: string): Promise<FavoriteItem | null> {
    try {
      const favorites = await this.storageService.getFavorites();
      return favorites.find(f => f.metadata?.sourceId === sourceId) || null;
    } catch (error) {
      console.error('Error finding favorite by source ID:', error);
      return null;
    }
  }

  async exportFavorites(): Promise<string> {
    try {
      const favorites = await this.storageService.getFavorites();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        items: favorites
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting favorites:', error);
      throw new Error('Failed to export favorites');
    }
  }

  async importFavorites(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.items || !Array.isArray(importData.items)) {
        throw new Error('Invalid import data format');
      }

      const currentFavorites = await this.storageService.getFavorites();
      const mergedFavorites = [...importData.items, ...currentFavorites]
        .sort((a, b) => b.timestamp - a.timestamp);

      return await this.storageService.setFavorites(mergedFavorites);
    } catch (error) {
      console.error('Error importing favorites:', error);
      return false;
    }
  }

  async clearAllFavorites(): Promise<boolean> {
    try {
      return await this.storageService.clearFavorites();
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
}
