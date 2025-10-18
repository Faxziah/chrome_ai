import { StorageService } from '../services/storage';
import { HistoryService } from '../services/history';
import { FavoritesService } from '../services/favorites';
import { GeminiService } from '../services/gemini-api';
import { HistoryItem, FavoriteItem } from '../types';

class OptionsPage {
  private readonly storageService: StorageService;
  private historyService: HistoryService;
  private favoritesService: FavoritesService;
  private currentTab: string = 'history';
  private currentFilter: string = 'all';

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  constructor() {
    this.storageService = new StorageService();
    this.historyService = new HistoryService(this.storageService);
    this.favoritesService = new FavoritesService(this.storageService);
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadApiKey();
    await this.loadGeminiConfig();
    await this.loadShortcuts();
    await this.loadHistory();
    await this.loadFavorites();
    await this.loadStats();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // API Key events
    document.getElementById('save-api-key')?.addEventListener('click', () => this.saveApiKey());
    document.getElementById('test-api-key')?.addEventListener('click', () => this.testApiKey());
    document.getElementById('toggle-api-visibility')?.addEventListener('click', () => this.toggleApiVisibility());

    // Gemini Model Configuration events
    document.getElementById('save-gemini-config')?.addEventListener('click', () => this.saveGeminiConfig());
    document.getElementById('reset-gemini-config')?.addEventListener('click', () => this.resetGeminiConfig());
    document.getElementById('gemini-temperature')?.addEventListener('input', (e) => this.updateTemperatureDisplay(e));

    // Shortcuts events
    document.getElementById('change-shortcuts')?.addEventListener('click', () => this.changeShortcuts());

    // Tab switching
    document.querySelectorAll('.md-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.switchTab(target.dataset.tab!);
      });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.setFilter(target.dataset.filter!);
      });
    });

    // Search functionality
    document.getElementById('history-search')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.searchHistory(target.value);
    });

    document.getElementById('favorites-search')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.searchFavorites(target.value);
    });

    // Data management buttons
    document.getElementById('clear-history')?.addEventListener('click', () => this.clearHistory());
    document.getElementById('clear-favorites')?.addEventListener('click', () => this.clearFavorites());
    document.getElementById('export-history')?.addEventListener('click', () => this.exportHistory());
    document.getElementById('export-favorites')?.addEventListener('click', () => this.exportFavorites());
    document.getElementById('import-history')?.addEventListener('click', () => this.importHistory());
    document.getElementById('import-favorites')?.addEventListener('click', () => this.importFavorites());

    // Global actions
    document.getElementById('export-all')?.addEventListener('click', () => this.exportAllData());
    document.getElementById('import-all')?.addEventListener('click', () => this.importAllData());
    document.getElementById('clear-all-data')?.addEventListener('click', () => this.clearAllData());

    // Delegated event listeners for data lists
    document.getElementById('history-list')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button) {
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (action === 'view' && id) {
          this.viewItem(id, 'history');
        } else if (action === 'remove' && id) {
          this.removeFromHistory(id);
        }
      }
    });

    document.getElementById('favorites-list')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button) {
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (action === 'view' && id) {
          this.viewItem(id, 'favorites');
        } else if (action === 'remove' && id) {
          this.removeFromFavorites(id);
        }
      }
    });
  }

  private async loadApiKey(): Promise<void> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (apiKey) {
        const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        apiKeyInput.value = apiKey;
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  private async loadShortcuts(): Promise<void> {
    try {
      const commands = await chrome.commands.getAll();
      const highlightCommand = commands.find(cmd => cmd.name === 'highlight-keywords');
      const clearCommand = commands.find(cmd => cmd.name === 'clear-highlights');

      if (highlightCommand?.shortcut) {
        const highlightDisplay = document.getElementById('highlight-shortcut-display');
        if (highlightDisplay) {
          highlightDisplay.textContent = highlightCommand.shortcut;
        }
      }

      if (clearCommand?.shortcut) {
        const clearDisplay = document.getElementById('clear-shortcut-display');
        if (clearDisplay) {
          clearDisplay.textContent = clearCommand.shortcut;
        }
      }
    } catch (error) {
      console.error('Error loading shortcuts:', error);
    }
  }

  private async saveApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showStatus('api-status', 'Введите API ключ', 'error');
      return;
    }

    try {
      const success = await this.storageService.setApiKey(apiKey);
      if (success) {
        this.showStatus('api-status', 'API ключ успешно сохранен', 'success');
      } else {
        this.showStatus('api-status', 'Ошибка при сохранении API ключа', 'error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      this.showStatus('api-status', 'Ошибка при сохранении API ключа', 'error');
    }
  }

  private async testApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showStatus('api-status', 'Введите API ключ для проверки', 'error');
      return;
    }

    try {
      this.showStatus('api-status', 'Проверка API ключа...', 'success');
      
      const geminiService = new GeminiService(apiKey);
      const isValid = await geminiService.testConnection();

      if (isValid) {
        this.showStatus('api-status', 'API ключ действителен', 'success');
      } else {
        this.showStatus('api-status', 'API ключ недействителен или недоступен', 'error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      if (error instanceof Error && error.message.includes('Invalid API key format')) {
        this.showStatus('api-status', 'Неверный формат API ключа', 'error');
      } else {
        this.showStatus('api-status', 'Ошибка при проверке API ключа. Проверьте подключение к интернету', 'error');
      }
    }
  }

  private toggleApiVisibility(): void {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const toggleBtn = document.getElementById('toggle-api-visibility') as HTMLButtonElement;
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = 'Скрыть';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = 'Показать';
    }
  }

  private changeShortcuts(): void {
    try {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    } catch (error) {
      console.error('Error opening shortcuts page:', error);
      this.showStatus('api-status', 'Ошибка при открытии страницы горячих клавиш', 'error');
    }
  }

  private switchTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll('.md-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update tab content
    document.querySelectorAll('.md-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    this.currentTab = tabName;

    if (tabName === 'history') {
      this.loadHistory();
    } else if (tabName === 'favorites') {
      this.loadFavorites();
    } else if (tabName === 'stats') {
      this.loadStats();
    }
  }

  private setFilter(filter: string): void {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

    this.currentFilter = filter;

    if (this.currentTab === 'history') {
      this.loadHistory();
    } else if (this.currentTab === 'favorites') {
      this.loadFavorites();
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await this.historyService.getHistory();
      this.displayHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      this.displayHistory([]);
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      const favorites = await this.favoritesService.getFavorites();
      this.displayFavorites(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.displayFavorites([]);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const [historyStats, favoritesStats] = await Promise.all([
        this.historyService.getHistoryStats(),
        this.favoritesService.getFavoritesStats()
      ]);

      document.getElementById('total-history')!.textContent = historyStats.total.toString();
      document.getElementById('total-favorites')!.textContent = favoritesStats.total.toString();
      document.getElementById('summarize-count')!.textContent = 
        (historyStats.byType.summarize + favoritesStats.byType.summarize).toString();
      document.getElementById('rephrase-count')!.textContent = 
        (historyStats.byType.rephrase + favoritesStats.byType.rephrase).toString();
      document.getElementById('translate-count')!.textContent = 
        (historyStats.byType.translate + favoritesStats.byType.translate).toString();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  private displayHistory(history: HistoryItem[]): void {
    const container = document.getElementById('history-list')!;
    
    if (history.length === 0) {
      container.innerHTML = '<div class="empty-state">История пуста</div>';
      return;
    }

    const filteredHistory = this.filterData(history, this.currentFilter);
    const searchTerm = (document.getElementById('history-search') as HTMLInputElement)?.value || '';
    const searchFiltered = searchTerm ? 
      filteredHistory.filter(item => 
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.originalText?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : filteredHistory;

    container.innerHTML = searchFiltered.map(item => `
      <div class="data-item">
        <div class="data-content">
          <div><strong>${this.escapeHtml(this.getTypeLabel(item.type))}</strong></div>
          <div>${this.escapeHtml(this.truncateText(item.prompt, 100))}</div>
          <div class="data-meta">
            ${this.escapeHtml(new Date(item.timestamp).toLocaleString('ru-RU'))}
          </div>
        </div>
        <div class="data-actions">
          <button class="btn btn-small" data-action="view" data-id="${this.escapeHtml(item.id)}">Просмотр</button>
          <button class="btn btn-small btn-danger" data-action="remove" data-id="${this.escapeHtml(item.id)}">Удалить</button>
        </div>
      </div>
    `).join('');
  }

  private displayFavorites(favorites: FavoriteItem[]): void {
    const container = document.getElementById('favorites-list')!;
    
    if (favorites.length === 0) {
      container.innerHTML = '<div class="empty-state">Избранное пусто</div>';
      return;
    }

    const filteredFavorites = this.filterData(favorites, this.currentFilter);
    const searchTerm = (document.getElementById('favorites-search') as HTMLInputElement)?.value || '';
    const searchFiltered = searchTerm ? 
      filteredFavorites.filter(item => 
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.originalText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : filteredFavorites;

    container.innerHTML = searchFiltered.map(item => `
      <div class="data-item">
        <div class="data-content">
          <div><strong>${this.escapeHtml(this.getTypeLabel(item.type))}</strong></div>
          <div>${this.escapeHtml(this.truncateText(item.prompt, 100))}</div>
          <div class="data-meta">
            ${this.escapeHtml(new Date(item.timestamp).toLocaleString('ru-RU'))}
            ${item.tags && item.tags.length > 0 ? ` • Теги: ${this.escapeHtml(item.tags.join(', '))}` : ''}
          </div>
        </div>
        <div class="data-actions">
          <button class="btn btn-small" data-action="view" data-id="${this.escapeHtml(item.id)}">Просмотр</button>
          <button class="btn btn-small btn-danger" data-action="remove" data-id="${this.escapeHtml(item.id)}">Удалить</button>
        </div>
      </div>
    `).join('');
  }

  private filterData<T extends { type: string }>(data: T[], filter: string): T[] {
    if (filter === 'all') return data;
    return data.filter(item => item.type === filter);
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'summarize': 'Суммаризация',
      'rephrase': 'Перефразирование',
      'translate': 'Перевод'
    };
    return labels[type] || type;
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private async searchHistory(query: string): Promise<void> {
    if (!query.trim()) {
      await this.loadHistory();
      return;
    }

    try {
      const results = await this.historyService.searchHistory(query);
      this.displayHistory(results);
    } catch (error) {
      console.error('Error searching history:', error);
    }
  }

  private async searchFavorites(query: string): Promise<void> {
    if (!query.trim()) {
      await this.loadFavorites();
      return;
    }

    try {
      const results = await this.favoritesService.searchFavorites(query);
      this.displayFavorites(results);
    } catch (error) {
      console.error('Error searching favorites:', error);
    }
  }

  private async clearHistory(): Promise<void> {
    if (!confirm('Вы уверены, что хотите очистить всю историю?')) {
      return;
    }

    try {
      const success = await this.historyService.clearHistory();
      if (success) {
        this.showStatus('api-status', 'История очищена', 'success');
        await this.loadHistory();
        await this.loadStats();
      } else {
        this.showStatus('api-status', 'Ошибка при очистке истории', 'error');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      this.showStatus('api-status', 'Ошибка при очистке истории', 'error');
    }
  }

  private async clearFavorites(): Promise<void> {
    if (!confirm('Вы уверены, что хотите очистить все избранное?')) {
      return;
    }

    try {
      const success = await this.favoritesService.clearAllFavorites();
      if (success) {
        this.showStatus('api-status', 'Избранное очищено', 'success');
        await this.loadFavorites();
        await this.loadStats();
      } else {
        this.showStatus('api-status', 'Ошибка при очистке избранного', 'error');
      }
    } catch (error) {
      console.error('Error clearing favorites:', error);
      this.showStatus('api-status', 'Ошибка при очистке избранного', 'error');
    }
  }

  private async removeFromHistory(itemId: string): Promise<void> {
    try {
      const success = await this.historyService.removeFromHistory(itemId);
      if (success) {
        this.showStatus('api-status', 'Элемент удален из истории', 'success');
        await this.loadHistory();
        await this.loadStats();
      } else {
        this.showStatus('api-status', 'Ошибка при удалении элемента', 'error');
      }
    } catch (error) {
      console.error('Error removing from history:', error);
      this.showStatus('api-status', 'Ошибка при удалении элемента', 'error');
    }
  }

  private async removeFromFavorites(itemId: string): Promise<void> {
    try {
      const success = await this.favoritesService.removeFromFavorites(itemId);
      if (success) {
        this.showStatus('api-status', 'Элемент удален из избранного', 'success');
        await this.loadFavorites();
        await this.loadStats();
      } else {
        this.showStatus('api-status', 'Ошибка при удалении элемента', 'error');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      this.showStatus('api-status', 'Ошибка при удалении элемента', 'error');
    }
  }

  private viewItem(itemId: string, type: 'history' | 'favorites'): void {
    // Open item in a modal or new window
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
      align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3>Просмотр элемента</h3>
        <div id="item-content"></div>
        <button class="modal-close" style="margin-top: 15px;">Закрыть</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for modal close
    const closeButton = modal.querySelector('.modal-close') as HTMLButtonElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // Close modal when clicking on backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Load item content
    this.loadItemContent(itemId, type);
  }

  private async loadItemContent(itemId: string, type: 'history' | 'favorites'): Promise<void> {
    try {
      let item: HistoryItem | FavoriteItem | null;
      
      if (type === 'history') {
        const history = await this.historyService.getHistory();
        item = history.find(h => h.id === itemId) || null;
      } else {
        const favorites = await this.favoritesService.getFavorites();
        item = favorites.find(f => f.id === itemId) || null;
      }

      if (item) {
        const content = document.getElementById('item-content');
        if (content) {
          content.innerHTML = `
            <p><strong>Тип:</strong> ${this.escapeHtml(this.getTypeLabel(item.type))}</p>
            <p><strong>Запрос:</strong> ${this.escapeHtml(item.prompt)}</p>
            <p><strong>Ответ:</strong> ${this.escapeHtml(item.response)}</p>
            ${item.originalText ? `<p><strong>Исходный текст:</strong> ${this.escapeHtml(item.originalText)}</p>` : ''}
            <p><strong>Дата:</strong> ${this.escapeHtml(new Date(item.timestamp).toLocaleString('ru-RU'))}</p>
            ${'tags' in item && item.tags ? `<p><strong>Теги:</strong> ${this.escapeHtml(item.tags.join(', '))}</p>` : ''}
          `;
        }
      }
    } catch (error) {
      console.error('Error loading item content:', error);
    }
  }

  private async exportHistory(): Promise<void> {
    try {
      const data = await this.historyService.exportHistory();
      this.downloadFile(data, 'history-export.json', 'application/json');
      this.showStatus('api-status', 'История экспортирована', 'success');
    } catch (error) {
      console.error('Error exporting history:', error);
      this.showStatus('api-status', 'Ошибка при экспорте истории', 'error');
    }
  }

  private async exportFavorites(): Promise<void> {
    try {
      const data = await this.favoritesService.exportFavorites();
      this.downloadFile(data, 'favorites-export.json', 'application/json');
      this.showStatus('api-status', 'Избранное экспортировано', 'success');
    } catch (error) {
      console.error('Error exporting favorites:', error);
      this.showStatus('api-status', 'Ошибка при экспорте избранного', 'error');
    }
  }

  private async importHistory(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = await this.historyService.importHistory(text);
          if (success) {
            this.showStatus('api-status', 'История импортирована', 'success');
            await this.loadHistory();
            await this.loadStats();
          } else {
            this.showStatus('api-status', 'Ошибка при импорте истории', 'error');
          }
        } catch (error) {
          console.error('Error importing history:', error);
          this.showStatus('api-status', 'Ошибка при импорте истории', 'error');
        }
      }
    };
    input.click();
  }

  private async importFavorites(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = await this.favoritesService.importFavorites(text);
          if (success) {
            this.showStatus('api-status', 'Избранное импортировано', 'success');
            await this.loadFavorites();
            await this.loadStats();
          } else {
            this.showStatus('api-status', 'Ошибка при импорте избранного', 'error');
          }
        } catch (error) {
          console.error('Error importing favorites:', error);
          this.showStatus('api-status', 'Ошибка при импорте избранного', 'error');
        }
      }
    };
    input.click();
  }

  private async exportAllData(): Promise<void> {
    try {
      const [history, favorites] = await Promise.all([
        this.historyService.exportHistory(),
        this.favoritesService.exportFavorites()
      ]);

      const allData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        history: JSON.parse(history),
        favorites: JSON.parse(favorites)
      };

      this.downloadFile(JSON.stringify(allData, null, 2), 'ai-text-tools-export.json', 'application/json');
      this.showStatus('api-status', 'Все данные экспортированы', 'success');
    } catch (error) {
      console.error('Error exporting all data:', error);
      this.showStatus('api-status', 'Ошибка при экспорте данных', 'error');
    }
  }

  private async importAllData(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          let success = true;
          if (data.history) {
            success = await this.historyService.importHistory(JSON.stringify(data.history)) && success;
          }
          if (data.favorites) {
            success = await this.favoritesService.importFavorites(JSON.stringify(data.favorites)) && success;
          }

          if (success) {
            this.showStatus('api-status', 'Данные импортированы', 'success');
            await this.loadHistory();
            await this.loadFavorites();
            await this.loadStats();
          } else {
            this.showStatus('api-status', 'Ошибка при импорте данных', 'error');
          }
        } catch (error) {
          console.error('Error importing all data:', error);
          this.showStatus('api-status', 'Ошибка при импорте данных', 'error');
        }
      }
    };
    input.click();
  }

  private async clearAllData(): Promise<void> {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
      return;
    }

    try {
      const success = await this.storageService.clearAllData();
      if (success) {
        this.showStatus('api-status', 'Все данные удалены', 'success');
        await this.loadHistory();
        await this.loadFavorites();
        await this.loadStats();
      } else {
        this.showStatus('api-status', 'Ошибка при удалении данных', 'error');
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      this.showStatus('api-status', 'Ошибка при удалении данных', 'error');
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private showStatus(elementId: string, message: string, type: 'success' | 'error'): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `status-message status-${type}`;
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.display = 'none';
      }, 5000);
    }
  }

  private async loadGeminiConfig(): Promise<void> {
    try {
      const config = await this.storageService.getApiConfig();
      if (config) {
        const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
        const temperatureSlider = document.getElementById('gemini-temperature') as HTMLInputElement;
        const maxTokensInput = document.getElementById('gemini-max-tokens') as HTMLInputElement;
        
        if (modelSelect && config.model) {
          modelSelect.value = config.model;
        }
        
        if (temperatureSlider && config.temperature !== undefined) {
          temperatureSlider.value = config.temperature.toString();
          this.updateTemperatureDisplay({ target: temperatureSlider } as unknown as Event);
        }
        
        if (maxTokensInput && config.maxTokens) {
          maxTokensInput.value = config.maxTokens.toString();
        }
      }
    } catch (error) {
      console.error('Error loading Gemini config:', error);
    }
  }

  private async saveGeminiConfig(): Promise<void> {
    try {
      const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
      const temperatureSlider = document.getElementById('gemini-temperature') as HTMLInputElement;
      const maxTokensInput = document.getElementById('gemini-max-tokens') as HTMLInputElement;
      
      const config = {
        model: modelSelect?.value || 'gemini-pro',
        temperature: parseFloat(temperatureSlider?.value || '0.7'),
        maxTokens: parseInt(maxTokensInput?.value || '2048')
      };
      
      const success = await this.storageService.setApiConfig(config);
      if (success) {
        this.showStatus('gemini-config-status', 'Настройки модели сохранены', 'success');
      } else {
        this.showStatus('gemini-config-status', 'Ошибка при сохранении настроек', 'error');
      }
    } catch (error) {
      console.error('Error saving Gemini config:', error);
      this.showStatus('gemini-config-status', 'Ошибка при сохранении настроек', 'error');
    }
  }

  private async resetGeminiConfig(): Promise<void> {
    try {
      const defaultConfig = {
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 2048
      };
      
      const success = await this.storageService.setApiConfig(defaultConfig);
      if (success) {
        await this.loadGeminiConfig();
        this.showStatus('gemini-config-status', 'Настройки сброшены к умолчанию', 'success');
      } else {
        this.showStatus('gemini-config-status', 'Ошибка при сбросе настроек', 'error');
      }
    } catch (error) {
      console.error('Error resetting Gemini config:', error);
      this.showStatus('gemini-config-status', 'Ошибка при сбросе настроек', 'error');
    }
  }

  private updateTemperatureDisplay(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const displayElement = document.getElementById('temperature-value');
    if (displayElement) {
      displayElement.textContent = value;
    }
  }
}

// Initialize the options page
new OptionsPage();