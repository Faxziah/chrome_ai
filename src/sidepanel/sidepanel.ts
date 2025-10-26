import {StorageService} from '../services/storage';
import {HistoryService} from '../services/history';
import {FavoritesService} from '../services/favorites';
import {setLocale, t} from '../utils/i18n';
import {truncateText, escapeHtml, formatMarkdown} from '../utils/utils';

// Material Design Utils
declare global {
  interface Window {
    MaterialDesignUtils: any;
  }
}

class SidePanelApp {
  private readonly storageService: StorageService;
  private readonly historyService: HistoryService;
  private readonly favoritesService: FavoritesService;
  private historyClickHandler: (event: Event) => void;
  private favoritesClickHandler: (event: Event) => void;

  constructor() {
    this.storageService = new StorageService();
    this.historyService = new HistoryService(this.storageService);
    this.favoritesService = new FavoritesService(this.storageService);

    // Bind event handlers once
    this.historyClickHandler = this.handleHistoryClick.bind(this);
    this.favoritesClickHandler = this.handleFavoritesClick.bind(this);

    // Initialize language
    this.initializeLanguage();

    this.initializeApp().catch(() => {});
  }

  private async initializeLanguage(): Promise<void> {
    try {
      const language = await this.storageService.getLanguage();
      if (language) {
        setLocale(language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }

  private async initializeApp(): Promise<void> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (apiKey) {
        this.hideApiWarning();
      } else {
        this.showApiWarning();
        // Setup API warning handlers when showing the warning
        this.setupApiWarningHandlers();
        this.localizeElements();
        return;
      }

      this.setupEventListeners();
      this.setupApiWarningHandlers();
      this.localizeElements();

      // Load history by default
      await this.loadHistory();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showStatus(t('status.errorSavingSettings'), 'error');
    }
  }

  private setupEventListeners(): void {
    const tabs = document.querySelectorAll('.md-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const tabId = tab.id.replace('-tab', '');
        await this.switchTab(tabId);
      });
    });


    // History and Favorites event listeners
    const historyFilter = document.getElementById('history-filter') as HTMLSelectElement;
    const historySearch = document.getElementById('history-search') as HTMLInputElement;
    const clearHistoryBtn = document.getElementById('clear-history-btn') as HTMLButtonElement;
    const favoritesFilter = document.getElementById('favorites-filter') as HTMLSelectElement;
    const favoritesSearch = document.getElementById('favorites-search') as HTMLInputElement;
    const clearFavoritesBtn = document.getElementById('clear-favorites-btn') as HTMLButtonElement;

    if (historyFilter) {
      historyFilter.addEventListener('change', () => this.filterHistory());
    }

    if (historySearch) {
      historySearch.addEventListener('input', () => this.filterHistory());
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    if (favoritesFilter) {
      favoritesFilter.addEventListener('change', () => this.filterFavorites());
    }

    if (favoritesSearch) {
      favoritesSearch.addEventListener('input', () => this.filterFavorites());
    }

    if (clearFavoritesBtn) {
      clearFavoritesBtn.addEventListener('click', () => this.clearFavorites());
    }

    // Listen for storage changes to update content in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.chat_history) {
          // History was updated, reload if we're on history tab
          const historyTab = document.getElementById('history-tab');
          if (historyTab?.classList.contains('active')) {
            this.loadHistory();
          }
        }
        if (changes.favorites) {
          // Favorites were updated, reload if we're on favorites tab
          const favoritesTab = document.getElementById('favorites-tab');
          if (favoritesTab?.classList.contains('active')) {
            this.loadFavorites();
          }
        }
      }
    });
  }

  private async switchTab(tabId: string): Promise<void> {
    const tabs = document.querySelectorAll('.md-tab');
    const tabContents = document.querySelectorAll('.md-tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const activeTab = document.getElementById(`${tabId}-tab`);
    const activeContent = document.getElementById(`${tabId}-content`);

    if (activeTab && activeContent) {
      activeTab.classList.add('active');
      activeContent.classList.add('active');

      if (window.MaterialDesignUtils) {
        window.MaterialDesignUtils.animateElement(activeContent, 'fadeIn');
      }
    }

    if (tabId === 'history') {
      await this.loadHistory();
    } else if (tabId === 'favorites') {
      await this.loadFavorites();
    }

    // Load history by default when the app starts
    if (tabId === 'history' || !tabId) {
      await this.loadHistory();
    }
  }

  private showStatus(message: string, type: 'success' | 'error' = 'success'): void {
    if (window.MaterialDesignUtils) {
      window.MaterialDesignUtils.showToast(message, type, 3000);
    } else {
      const statusDiv = document.getElementById('status') as HTMLDivElement;
      if (!statusDiv) return;

      statusDiv.textContent = message;
      statusDiv.className = `status ${type}`;
      statusDiv.style.display = 'block';

      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  private showApiWarning(): void {
    const apiSetupContainer = document.getElementById('api-setup-container') as HTMLDivElement;
    const mainTabs = document.getElementById('main-tabs') as HTMLDivElement;
    const content = document.querySelector('.content') as HTMLDivElement;

    if (apiSetupContainer) {
      apiSetupContainer.style.display = 'block';
    }
    if (mainTabs) {
      mainTabs.style.display = 'none';
    }
    if (content) {
      content.style.display = 'none';
    }
  }

  private hideApiWarning(): void {
    const apiSetupContainer = document.getElementById('api-setup-container') as HTMLDivElement;
    const mainTabs = document.getElementById('main-tabs') as HTMLDivElement;
    const content = document.querySelector('.content') as HTMLDivElement;

    if (apiSetupContainer) {
      apiSetupContainer.style.display = 'none';
    }
    if (mainTabs) {
      mainTabs.style.display = 'flex';
    }
    if (content) {
      content.style.display = 'flex';
    }
  }

  private setupApiWarningHandlers(): void {
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;

    if (saveApiKeyBtn && apiKeyInput) {
      saveApiKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
          this.showStatus('Please enter your API key', 'error');
          return;
        }

        try {
          const success = await this.storageService.setApiKey(apiKey);

          if (success) {
            this.showStatus('API key saved successfully!', 'success');
            this.hideApiWarning();
            // Reload the app to show the main interface
            setTimeout(() => {
              this.initializeApp();
            }, 1000);
          } else {
            this.showStatus('Failed to save API key', 'error');
          }
        } catch (error) {
          console.error('Error saving API key:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.showStatus(`Error saving API key: ${errorMessage}`, 'error');
        }
      });

      // Allow saving with Enter key
      apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveApiKeyBtn.click();
        }
      });
    }
  }

  private localizeElements(): void {
    // Localize elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = t(key);
      }
    });

    // Localize elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key && element instanceof HTMLInputElement) {
        element.placeholder = t(key);
      }
    });
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await this.historyService.getHistory();
      await this.renderHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      this.showStatus(t('status.errorClearingHistory'), 'error');
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      const favorites = await this.favoritesService.getFavorites();
      this.renderFavorites(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.showStatus(t('status.errorClearingFavorites'), 'error');
    }
  }

  private async renderHistory(history: any[]): Promise<void> {
    const historyList = document.getElementById('history-items');
    if (!historyList) return;

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <h3>${t('empty.history')}</h3>
          <p>${t('empty.loadingHistory')}</p>
        </div>
      `;
      return;
    }

    // Check favorite status for each item
    const historyWithFavorites = await Promise.all(
      history.map(async (item) => ({
        ...item,
        isFavorite: await this.favoritesService.isFavoriteBySourceId(item.id)
      }))
    );

    historyList.innerHTML = historyWithFavorites.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="item-header">
          <span class="item-type ${item.type}">${this.getTypeLabel(item.type)}</span>
          <div class="item-actions">
            <button class="action-btn view-btn" data-action="view-item" data-id="${item.id}">
              ${t('common.view')}
            </button>
            <button class="action-btn favorite-btn ${item.isFavorite ? 'favorited' : ''}" data-action="toggle-favorite" data-id="${item.id}">
              ⭐
            </button>
            <button class="action-btn delete-btn" data-action="delete-history" data-id="${item.id}">
              🗑️
            </button>
          </div>
        </div>
        <div class="item-content">${escapeHtml(truncateText(item.prompt, 100))}</div>
        <div class="item-result">${item.type === 'discuss' ? formatMarkdown(truncateText(item.response, 150)) as string : escapeHtml(truncateText(item.response, 150))}</div>
        <div class="item-meta">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    // Add event delegation for history list
    this.setupHistoryEventListeners();
  }

  private renderFavorites(favorites: any[]): void {
    const favoritesList = document.getElementById('favorites-items');
    if (!favoritesList) return;

    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <h3>${t('empty.favorites')}</h3>
          <p>${t('empty.loadingFavorites')}</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites.map(item => `
      <div class="favorite-item" data-id="${item.id}">
        <div class="item-header">
          <span class="item-type ${item.type}">${this.getTypeLabel(item.type)}</span>
          <div class="item-actions">
            <button class="action-btn view-btn" data-action="view-item" data-id="${item.id}">
              ${t('common.view')}
            </button>
            <button class="action-btn favorite-btn favorited" data-action="remove-favorite" data-id="${item.id}">
              ⭐
            </button>
            <button class="action-btn delete-btn" data-action="delete-favorite" data-id="${item.id}">
              🗑️
            </button>
          </div>
        </div>
        <div class="item-content">${escapeHtml(truncateText(item.prompt, 100))}</div>
        <div class="item-result">${item.type === 'discuss' ? formatMarkdown(truncateText(item.response, 150)) as string : escapeHtml(truncateText(item.response, 150))}</div>
        <div class="item-meta">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    // Add event delegation for favorites list
    this.setupFavoritesEventListeners();
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'summarize': t('options.summarize'),
      'rephrase': t('options.rephrase'),
      'translate': t('options.translate'),
      'discuss': t('common.discuss')
    };
    return labels[type] || type;
  }

  private async filterHistory(): Promise<void> {
    try {
      const filterSelect = document.getElementById('history-filter') as HTMLSelectElement;
      const searchInput = document.getElementById('history-search') as HTMLInputElement;

      const filter: any = {};
      if (filterSelect.value) {
        filter.type = filterSelect.value;
      }
      if (searchInput.value.trim()) {
        filter.searchText = searchInput.value.trim();
      }

      const history = await this.historyService.getHistory(filter);
      await this.renderHistory(history);
    } catch (error) {
      console.error('Error filtering history:', error);
    }
  }

  private async filterFavorites(): Promise<void> {
    try {
      const filterSelect = document.getElementById('favorites-filter') as HTMLSelectElement;
      const searchInput = document.getElementById('favorites-search') as HTMLInputElement;

      const filter: any = {};
      if (filterSelect.value) {
        filter.type = filterSelect.value;
      }
      if (searchInput.value.trim()) {
        filter.searchText = searchInput.value.trim();
      }

      const favorites = await this.favoritesService.getFavorites(filter);
      this.renderFavorites(favorites);
    } catch (error) {
      console.error('Error filtering favorites:', error);
    }
  }

  private async clearHistory(): Promise<void> {
    try {
      await this.historyService.clearHistory();
      await this.renderHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      this.showStatus(t('status.errorClearingHistory'), 'error');
    }
  }

  private async clearFavorites(): Promise<void> {
    try {
      await this.favoritesService.clearAllFavorites();
      this.renderFavorites([]);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      this.showStatus(t('status.errorClearingFavorites'), 'error');
    }
  }

  private setupHistoryEventListeners(): void {
    const historyList = document.getElementById('history-items');
    if (!historyList) return;

    // Remove existing listeners to avoid duplicates
    historyList.removeEventListener('click', this.historyClickHandler);

    // Add new listener
    historyList.addEventListener('click', this.historyClickHandler);
  }

  private setupFavoritesEventListeners(): void {
    const favoritesList = document.getElementById('favorites-items');
    if (!favoritesList) return;

    // Remove existing listeners to avoid duplicates
    favoritesList.removeEventListener('click', this.favoritesClickHandler);

    // Add new listener
    favoritesList.addEventListener('click', this.favoritesClickHandler);
  }

  private async handleHistoryClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;

    let itemId: string | undefined;
    let action: string = 'view-item';

    if (target.classList.contains('action-btn')) {
      action = target.dataset.action!;
      itemId = target.dataset.id;
    } else {
      if (target.classList.contains('history-item')) {
        itemId = target.dataset.id;
      } else {
        const parentElement: HTMLButtonElement | null = target.closest('.history-item');
        itemId = parentElement?.dataset.id;
      }
    }

    if (!itemId) return;

    event.stopPropagation();

    switch (action) {
      case 'view-item':
        await this.showItemDetails(itemId, 'history');
        break;
      case 'toggle-favorite':
        await this.toggleFavorite(itemId);
        break;
      case 'delete-history':
        await this.deleteHistoryItem(itemId);
        break;
    }
  }

  private async handleFavoritesClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;

    let itemId: string | undefined;
    let action: string = 'view-item';

    if (target.classList.contains('action-btn')) {
      action = target.dataset.action!;
      itemId = target.dataset.id;
    } else {
      if (target.classList.contains('favorite-item')) {
        itemId = target.dataset.id;
      } else {
        const parentElement: HTMLButtonElement | null = target.closest('.favorite-item');
        itemId = parentElement?.dataset.id;
      }
    }

    if (!itemId) return;

    switch (action) {
      case 'view-item':
        await this.showItemDetails(itemId, 'favorites');
        break;
      case 'remove-favorite':
        await this.removeFromFavorites(itemId);
        break;
      case 'delete-favorite':
        await this.deleteFavoriteItem(itemId);
        break;
    }
  }

  private async toggleFavorite(itemId: string): Promise<void> {
    try {
      const isFavorite = await this.favoritesService.isFavoriteBySourceId(itemId);

      if (isFavorite) {
        await this.favoritesService.removeBySourceId(itemId);
      } else {
        const history = await this.historyService.getHistory();
        const item = history.find(h => h.id === itemId);
        if (item) {
          await this.favoritesService.addToFavorites(
            item.type,
            item.prompt,
            item.response,
            item.originalText,
            [],
            {...item.metadata, sourceId: itemId}
          );
        }
      }

      // Update the UI
      await this.loadHistory();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showStatus(t('common.errorTogglingFavorite'), 'error');
    }
  }

  private async deleteHistoryItem(itemId: string): Promise<void> {
    try {
      await this.historyService.removeFromHistory(itemId);
      await this.loadHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
      this.showStatus(t('status.errorRemovingItem'), 'error');
    }
  }

  private async removeFromFavorites(itemId: string): Promise<void> {
    try {
      await this.favoritesService.removeFromFavorites(itemId);
      await this.loadFavorites();
    } catch (error) {
      console.error('Error removing from favorites:', error);
      this.showStatus(t('common.failedToRemoveFromFavorites'), 'error');
    }
  }

  private async deleteFavoriteItem(itemId: string): Promise<void> {
    try {
      await this.favoritesService.removeFromFavorites(itemId);
      await this.loadFavorites();
    } catch (error) {
      console.error('Error deleting favorite item:', error);
      this.showStatus(t('common.failedToRemoveFromFavorites'), 'error');
    }
  }

  private async showItemDetails(itemId: string, type: 'history' | 'favorites'): Promise<void> {
    try {
      // Check if modal already exists
      const existingModal = document.querySelector('.modal-overlay');
      if (existingModal) {
        return;
      }

      let item;
      if (type === 'history') {
        const history = await this.historyService.getHistory();
        item = history.find(h => h.id === itemId);
      } else {
        const favorites = await this.favoritesService.getFavorites();
        item = favorites.find(f => f.id === itemId);
      }

      if (!item) {
        this.showStatus(t('common.itemNotFound'), 'error');
        return;
      }

      // Create modal overlay
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${t('common.view')} - ${this.getTypeLabel(item.type)}</h3>
            <button class="modal-close" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <h4>${t('common.originalText')}</h4>
              <div class="detail-content">${escapeHtml(item.prompt)}</div>
            </div>
            <div class="detail-section">
              <h4>${t('common.result')}</h4>
              <div class="detail-content">${item.type === 'discuss' ? formatMarkdown(item.response) as string : escapeHtml(item.response)}</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add event listeners
      const closeBtn = modal.querySelector('.modal-close');
      const overlay = modal.querySelector('.modal-overlay');

      const closeModal = () => {
        document.body.removeChild(modal);
      };

      closeBtn?.addEventListener('click', closeModal);
      overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      // Close on Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

    } catch (error) {
      console.error('Error showing item details:', error);
      this.showStatus(t('common.errorLoadingDetails'), 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  (window as any).sidePanelApp = new SidePanelApp();
});
