import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { HistoryService } from '../services/history';
import { FavoritesService } from '../services/favorites';
import { Summarizer } from '../components/summarizer';
import { Rephraser } from '../components/rephraser';
import { Translator } from '../components/translator';
import { Chat, ChatMessage } from '../components/chat';

class PopupApp {
  private readonly geminiService: GeminiService;
  private readonly storageService: StorageService;
  private readonly historyService: HistoryService;
  private readonly favoritesService: FavoritesService;
  private readonly summarizer: Summarizer;
  private readonly rephraser: Rephraser;
  private readonly translator: Translator;
  private readonly chat: Chat;
  private currentTab: string = 'summarize';
  private lastAssistantMessageId: string | null = null;

  constructor() {
    this.geminiService = new GeminiService();
    this.storageService = new StorageService();
    this.historyService = new HistoryService(this.storageService);
    this.favoritesService = new FavoritesService(this.storageService);
    this.summarizer = new Summarizer(this.geminiService, this.historyService);
    this.rephraser = new Rephraser(this.geminiService, this.historyService);
    this.translator = new Translator(this.geminiService, this.historyService);
    this.chat = new Chat(this.geminiService, this.storageService, this.favoritesService);
    
    this.initializeApp().catch(console.error);
  }

  private async initializeApp(): Promise<void> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (apiKey) {
        this.geminiService.setApiKey(apiKey);
      } else {
        this.showStatus('API ключ не настроен. Перейдите в настройки.', 'error');
        return;
      }

      this.setupEventListeners();
      this.setupChatCallbacks();
      await this.loadChatHistory();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showStatus('Ошибка инициализации', 'error');
    }
  }

  private setupEventListeners(): void {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const tabId = tab.id.replace('-tab', '');
        await this.switchTab(tabId);
      });
    });

    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const favoriteBtn = document.getElementById('favorite-btn') as HTMLButtonElement;

    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', async () => await this.sendMessage());
      
      chatInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          await this.sendMessage();
        }
      });

      chatInput.addEventListener('input', () => {
        this.autoResizeTextarea(chatInput);
      });
    }

    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => this.addToFavorites());
    }

    const rephraseBtn = document.getElementById('rephrase-btn') as HTMLButtonElement;
    const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
    const highlightBtn = document.getElementById('highlight-btn') as HTMLButtonElement;

    if (rephraseBtn) {
      rephraseBtn.addEventListener('click', () => this.sendMessageToContentScript('REPHRASE'));
    }

    if (translateBtn) {
      translateBtn.addEventListener('click', () => this.sendMessageToContentScript('TRANSLATE'));
    }

    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => this.sendMessageToContentScript('HIGHLIGHT_KEYWORDS'));
    }

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
  }

  private setupChatCallbacks(): void {
    this.chat.setMessageUpdateCallback((message: ChatMessage) => {
      this.updateChatUI();
    });

    this.chat.setStreamCompleteCallback((message: ChatMessage) => {
      this.lastAssistantMessageId = message.id;
      this.updateFavoriteButton();
    });
  }

  private async loadChatHistory(): Promise<void> {
    // Skip loading operation history into chat to avoid confusing context
    // Chat should only contain actual conversation messages, not operation results
    // Operation history is displayed separately in the history tab
  }

  private async switchTab(tabId: string): Promise<void> {
    this.currentTab = tabId;
    
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeTab = document.getElementById(`${tabId}-tab`);
    const activeContent = document.getElementById(`${tabId}-content`);
    
    if (activeTab && activeContent) {
      activeTab.classList.add('active');
      activeContent.classList.add('active');
    }

    if (tabId === 'summarize') {
      await this.handleSummarizeTab();
    } else if (tabId === 'history') {
      await this.loadHistory();
    } else if (tabId === 'favorites') {
      await this.loadFavorites();
    }
  }

  private async handleSummarizeTab(): Promise<void> {
    const selectedText = await this.getSelectedTextFromActiveTab();
    if (selectedText && selectedText.trim().length > 0) {
      this.summarizeSelectedText(selectedText);
    }
  }

  private async summarizeSelectedText(text: string): Promise<void> {
    try {
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        messageType: 'summary'
      };

      this.chat.loadHistory([assistantMessage]);
      this.updateChatUI();

      await this.summarizer.summarizeWithStream(text, {
        style: 'brief',
        language: 'Russian'
      }, (chunk) => {
        assistantMessage.content += chunk;
        assistantMessage.isStreaming = true;
        this.updateChatUI();
      });

      assistantMessage.isStreaming = false;
      this.lastAssistantMessageId = assistantMessage.id;
      this.updateChatUI();
      this.updateFavoriteButton();

    } catch (error) {
      console.error('Error summarizing text:', error);
      this.showStatus('Ошибка суммаризации', 'error');
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async sendMessage(): Promise<void> {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    
    if (!chatInput || !sendBtn) return;

    const message = chatInput.value.trim();
    if (!message) return;

    chatInput.value = '';
    sendBtn.disabled = true;
    this.autoResizeTextarea(chatInput);

    try {
      await this.chat.sendMessageWithStream(message, (chunk) => {
        this.updateChatUI();
      });
    } catch (error) {
      console.error('Error sending message:', error);
      this.showStatus('Ошибка отправки сообщения', 'error');
    } finally {
      sendBtn.disabled = false;
    }
  }

  private updateChatUI(): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messages = this.chat.getMessages();
    messagesContainer.innerHTML = '';

    messages.forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.role}${message.isStreaming ? ' streaming' : ''}`;
      messageDiv.id = `message-${message.id}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.textContent = message.content;
      messageDiv.appendChild(contentDiv);

      if (message.isStreaming) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.style.marginTop = '8px';
        messageDiv.appendChild(loadingDiv);
      }

      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString();
      messageDiv.appendChild(timeDiv);

      messagesContainer.appendChild(messageDiv);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private updateFavoriteButton(): void {
    const favoriteBtn = document.getElementById('favorite-btn') as HTMLButtonElement;
    if (!favoriteBtn) return;

    if (this.lastAssistantMessageId) {
      favoriteBtn.style.display = 'block';
      favoriteBtn.disabled = false;
    } else {
      favoriteBtn.style.display = 'none';
    }
  }

  private async addToFavorites(): Promise<void> {
    if (!this.lastAssistantMessageId) return;

    const favoriteBtn = document.getElementById('favorite-btn') as HTMLButtonElement;
    if (favoriteBtn) {
      favoriteBtn.disabled = true;
    }

    try {
      const messageType = this.currentTab === 'summarize' ? 'summary' : 'chat';
      await this.chat.addToFavorites(this.lastAssistantMessageId, messageType);
      this.showStatus('Добавлено в избранное!', 'success');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      this.showStatus('Ошибка добавления в избранное', 'error');
    } finally {
      if (favoriteBtn) {
        favoriteBtn.disabled = false;
      }
    }
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }

  private showStatus(message: string, type: 'success' | 'error' = 'success'): void {
    const statusDiv = document.getElementById('status') as HTMLDivElement;
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  private async getSelectedTextFromActiveTab(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_SELECTED_TEXT' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting selected text:', chrome.runtime.lastError.message);
              resolve(null);
            } else if (response?.success) {
              resolve(response.text);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  private sendMessageToContentScript(action: string): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
          if (chrome.runtime.lastError) {
            this.showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          } else if (response?.success) {
            this.showStatus('Action completed successfully!');
          } else {
            this.showStatus('No text selected. Please select some text first.', 'error');
          }
        });
      }
    });
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await this.historyService.getHistory();
      await this.renderHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      this.showStatus('Ошибка загрузки истории', 'error');
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      const favorites = await this.favoritesService.getFavorites();
      this.renderFavorites(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.showStatus('Ошибка загрузки избранного', 'error');
    }
  }

  private async renderHistory(history: any[]): Promise<void> {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <h3>История пуста</h3>
          <p>Здесь будут отображаться ваши последние операции</p>
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
          <span class="item-type ${item.type}">${item.type}</span>
          <div class="item-actions">
            <button class="action-btn favorite-btn ${item.isFavorite ? 'favorited' : ''}" data-action="toggle-favorite" data-id="${item.id}">
              ⭐
            </button>
            <button class="action-btn delete-btn" data-action="delete-history" data-id="${item.id}">
              🗑️
            </button>
          </div>
        </div>
        <div class="item-content">${this.escapeHtml(this.truncateText(item.prompt, 100))}</div>
        <div class="item-result">${this.escapeHtml(this.truncateText(item.response, 150))}</div>
        <div class="item-meta">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    // Add event delegation for history list
    this.setupHistoryEventListeners();
  }

  private renderFavorites(favorites: any[]): void {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;

    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <h3>Избранное пусто</h3>
          <p>Добавьте элементы в избранное, нажав на звездочку</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites.map(item => `
      <div class="favorite-item" data-id="${item.id}">
        <div class="item-header">
          <span class="item-type ${item.type}">${item.type}</span>
          <div class="item-actions">
            <button class="action-btn favorite-btn favorited" data-action="remove-favorite" data-id="${item.id}">
              ⭐
            </button>
            <button class="action-btn delete-btn" data-action="delete-favorite" data-id="${item.id}">
              🗑️
            </button>
          </div>
        </div>
        <div class="item-content">${this.escapeHtml(this.truncateText(item.prompt, 100))}</div>
        <div class="item-result">${this.escapeHtml(this.truncateText(item.response, 150))}</div>
        <div class="item-meta">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    // Add event delegation for favorites list
    this.setupFavoritesEventListeners();
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
    if (confirm('Вы уверены, что хотите очистить всю историю?')) {
      try {
        await this.historyService.clearHistory();
        await this.renderHistory([]);
        this.showStatus('История очищена', 'success');
      } catch (error) {
        console.error('Error clearing history:', error);
        this.showStatus('Ошибка очистки истории', 'error');
      }
    }
  }

  private async clearFavorites(): Promise<void> {
    if (confirm('Вы уверены, что хотите очистить все избранное?')) {
      try {
        await this.favoritesService.clearAllFavorites();
        this.renderFavorites([]);
        this.showStatus('Избранное очищено', 'success');
      } catch (error) {
        console.error('Error clearing favorites:', error);
        this.showStatus('Ошибка очистки избранного', 'error');
      }
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private setupHistoryEventListeners(): void {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    // Remove existing listeners to avoid duplicates
    historyList.removeEventListener('click', this.handleHistoryClick);
    
    // Add new listener
    historyList.addEventListener('click', this.handleHistoryClick.bind(this));
  }

  private setupFavoritesEventListeners(): void {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;

    // Remove existing listeners to avoid duplicates
    favoritesList.removeEventListener('click', this.handleFavoritesClick);
    
    // Add new listener
    favoritesList.addEventListener('click', this.handleFavoritesClick.bind(this));
  }

  private async handleHistoryClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('button[data-action]') as HTMLButtonElement;
    
    if (!button) return;

    const action = button.dataset.action;
    const itemId = button.dataset.id;

    if (!itemId) return;

    event.stopPropagation();

    switch (action) {
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
    const button = target.closest('button[data-action]') as HTMLButtonElement;
    
    if (!button) return;

    const action = button.dataset.action;
    const itemId = button.dataset.id;

    if (!itemId) return;

    event.stopPropagation();

    switch (action) {
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
        this.showStatus('Удалено из избранного', 'success');
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
            { ...item.metadata, sourceId: itemId }
          );
          this.showStatus('Добавлено в избранное!', 'success');
        }
      }
      
      // Update the UI
      await this.loadHistory();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showStatus('Ошибка изменения избранного', 'error');
    }
  }

  private async deleteHistoryItem(itemId: string): Promise<void> {
    if (confirm('Удалить этот элемент из истории?')) {
      try {
        await this.historyService.removeFromHistory(itemId);
        await this.loadHistory();
        this.showStatus('Удалено из истории', 'success');
      } catch (error) {
        console.error('Error deleting history item:', error);
        this.showStatus('Ошибка удаления из истории', 'error');
      }
    }
  }

  private async removeFromFavorites(itemId: string): Promise<void> {
    try {
      await this.favoritesService.removeFromFavorites(itemId);
      await this.loadFavorites();
      this.showStatus('Удалено из избранного', 'success');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      this.showStatus('Ошибка удаления из избранного', 'error');
    }
  }

  private async deleteFavoriteItem(itemId: string): Promise<void> {
    if (confirm('Удалить этот элемент из избранного?')) {
      try {
        await this.favoritesService.removeFromFavorites(itemId);
        await this.loadFavorites();
        this.showStatus('Удалено из избранного', 'success');
      } catch (error) {
        console.error('Error deleting favorite item:', error);
        this.showStatus('Ошибка удаления из избранного', 'error');
      }
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  (window as any).popupApp = app;
});
