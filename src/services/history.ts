import { HistoryItem } from '../types';
import { StorageService } from './storage';

export interface HistoryFilter {
  type?: 'summarize' | 'rephrase' | 'translate' | 'discuss';
  dateFrom?: number;
  dateTo?: number;
  searchText?: string;
}

export interface HistoryStats {
  total: number;
  byType: {
    summarize: number;
    rephrase: number;
    translate: number;
    discuss: number;
  };
  lastActivity: number | null;
}

export class HistoryService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  async getHistory(filter?: HistoryFilter): Promise<HistoryItem[]> {
    try {
      const allHistory = await this.storageService.getHistory();
      
      if (!filter) {
        return allHistory;
      }

      return allHistory.filter(item => {
        if (filter.type && item.type !== filter.type) {
          return false;
        }

        if (filter.dateFrom && item.timestamp < filter.dateFrom) {
          return false;
        }

        if (filter.dateTo && item.timestamp > filter.dateTo) {
          return false;
        }

        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase();
          const promptMatch = item.prompt.toLowerCase().includes(searchLower);
          const responseMatch = item.response.toLowerCase().includes(searchLower);
          const originalTextMatch = item.originalText?.toLowerCase().includes(searchLower);
          
          if (!promptMatch && !responseMatch && !originalTextMatch) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error getting filtered history:', error);
      return [];
    }
  }

  async addToHistory(
    type: 'summarize' | 'rephrase' | 'translate' | 'discuss',
    prompt: string,
    response: string,
    originalText?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const historyItem: Omit<HistoryItem, 'id' | 'timestamp'> = {
        type,
        prompt,
        response,
        originalText,
        metadata
      };

      return await this.storageService.saveToHistory(historyItem);
    } catch (error) {
      console.error('Error adding to history:', error);
      return false;
    }
  }

  async removeFromHistory(itemId: string): Promise<boolean> {
    try {
      return await this.storageService.removeFromHistory(itemId);
    } catch (error) {
      console.error('Error removing from history:', error);
      return false;
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      return await this.storageService.clearHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  async getHistoryStats(): Promise<HistoryStats> {
    try {
      const history = await this.storageService.getHistory();
      
      const stats: HistoryStats = {
        total: history.length,
        byType: {
          summarize: 0,
          rephrase: 0,
          translate: 0,
          discuss: 0
        },
        lastActivity: null
      };

      let lastTimestamp = 0;

      history.forEach(item => {
        stats.byType[item.type]++;
        if (item.timestamp > lastTimestamp) {
          lastTimestamp = item.timestamp;
        }
      });

      stats.lastActivity = lastTimestamp > 0 ? lastTimestamp : null;

      return stats;
    } catch (error) {
      console.error('Error getting history stats:', error);
      return {
        total: 0,
        byType: { summarize: 0, rephrase: 0, translate: 0, discuss: 0 },
        lastActivity: null
      };
    }
  }

  async searchHistory(query: string): Promise<HistoryItem[]> {
    try {
      const allHistory = await this.storageService.getHistory();
      const queryLower = query.toLowerCase();

      return allHistory.filter(item => {
        const promptMatch = item.prompt.toLowerCase().includes(queryLower);
        const responseMatch = item.response.toLowerCase().includes(queryLower);
        const originalTextMatch = item.originalText?.toLowerCase().includes(queryLower);
        
        return promptMatch || responseMatch || originalTextMatch;
      });
    } catch (error) {
      console.error('Error searching history:', error);
      return [];
    }
  }

  async getRecentByType(type: 'summarize' | 'rephrase' | 'translate', limit: number = 5): Promise<HistoryItem[]> {
    try {
      const history = await this.getHistory({ type });
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent by type:', error);
      return [];
    }
  }

  async exportHistory(): Promise<string> {
    try {
      const history = await this.storageService.getHistory();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        items: history
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting history:', error);
      throw new Error('Failed to export history');
    }
  }

  async importHistory(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.items || !Array.isArray(importData.items)) {
        throw new Error('Invalid import data format');
      }

      const currentHistory = await this.storageService.getHistory();
      const mergedHistory = [...importData.items, ...currentHistory]
        .sort((a, b) => b.timestamp - a.timestamp);

      return await this.storageService.setHistory(mergedHistory);
    } catch (error) {
      console.error('Error importing history:', error);
      return false;
    }
  }
}
