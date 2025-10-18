import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storage';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockChromeStorage: any;

  beforeEach(() => {
    mockChromeStorage = {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve())
    };

    global.chrome = {
      storage: {
        local: mockChromeStorage
      }
    } as any;

    storageService = new StorageService();
  });

  it('should get API key from storage', async () => {
    const apiKey = 'test-api-key';
    mockChromeStorage.get.mockResolvedValueOnce({ gemini_api_key: apiKey });

    const result = await storageService.getApiKey();

    expect(result).toBe(apiKey);
    expect(mockChromeStorage.get).toHaveBeenCalledWith('gemini_api_key');
  });

  it('should set API key in storage', async () => {
    const apiKey = 'test-api-key';

    await storageService.setApiKey(apiKey);

    expect(mockChromeStorage.set).toHaveBeenCalledWith({ gemini_api_key: apiKey });
  });

  it('should validate API key before setting', async () => {
    const result = await storageService.setApiKey('');
    expect(result).toBe(false);
    expect(mockChromeStorage.set).not.toHaveBeenCalled();
  });

  it('should save item to history', async () => {
    const historyItem = {
      type: 'rephrase' as const,
      prompt: 'test',
      response: 'rephrased',
      metadata: { style: 'casual' }
    };

    await storageService.saveToHistory(historyItem);

    expect(mockChromeStorage.set).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_history: expect.arrayContaining([
          expect.objectContaining({
            type: 'rephrase',
            prompt: 'test',
            response: 'rephrased',
            id: expect.any(String),
            timestamp: expect.any(Number)
          })
        ])
      })
    );
  });

  it('should generate unique IDs for history items', async () => {
    const item1 = { type: 'rephrase' as const, prompt: 'test1', response: 'result1' };
    const item2 = { type: 'translate' as const, prompt: 'test2', response: 'result2' };

    await storageService.saveToHistory(item1);
    await storageService.saveToHistory(item2);

    const setCalls = mockChromeStorage.set.mock.calls;
    const history1 = setCalls[0][0].chat_history[0];
    const history2 = setCalls[1][0].chat_history[0];

    expect(history1.id).not.toBe(history2.id);
  });

  it('should retrieve history from storage', async () => {
    const mockHistory = [
      { id: '1', type: 'rephrase', prompt: 'test', response: 'result', timestamp: Date.now() }
    ];
    mockChromeStorage.get.mockResolvedValueOnce({ chat_history: mockHistory });

    const result = await storageService.getHistory();

    expect(result).toEqual(mockHistory);
    expect(mockChromeStorage.get).toHaveBeenCalledWith('chat_history');
  });

  it('should add item to favorites', async () => {
    const favoriteItem = {
      type: 'rephrase' as const,
      prompt: 'test',
      response: 'result',
      metadata: { style: 'casual' }
    };

    await storageService.addToFavorites(favoriteItem);

    expect(mockChromeStorage.set).toHaveBeenCalledWith(
      expect.objectContaining({
        favorites: expect.arrayContaining([
          expect.objectContaining({
            type: 'rephrase',
            prompt: 'test',
            response: 'result',
            id: expect.any(String),
            timestamp: expect.any(Number)
          })
        ])
      })
    );
  });

  it('should remove item from history', async () => {
    const existingHistory = [
      { id: '1', type: 'rephrase', prompt: 'test1', response: 'result1' },
      { id: '2', type: 'translate', prompt: 'test2', response: 'result2' }
    ];
    mockChromeStorage.get.mockResolvedValueOnce({ chat_history: existingHistory });

    await storageService.removeFromHistory('1');

    expect(mockChromeStorage.set).toHaveBeenCalledWith({
      chat_history: [{ id: '2', type: 'translate', prompt: 'test2', response: 'result2' }]
    });
  });

  it('should clear all history', async () => {
    await storageService.clearHistory();

    expect(mockChromeStorage.set).toHaveBeenCalledWith({ chat_history: [] });
  });

  it('should clear all favorites', async () => {
    await storageService.clearFavorites();

    expect(mockChromeStorage.set).toHaveBeenCalledWith({ favorites: [] });
  });

  it('should handle storage errors gracefully', async () => {
    const error = new Error('Storage error');
    mockChromeStorage.get.mockRejectedValueOnce(error);

    const result = await storageService.getHistory();
    expect(result).toEqual([]);
  });
});
