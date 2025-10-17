import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { Summarizer } from '../components/summarizer';
import { Chat } from '../components/chat';
import { ChatMessage } from '../components/chat';

class PopupApp {
  private geminiService: GeminiService;
  private storageService: StorageService;
  private summarizer: Summarizer;
  private chat: Chat;
  private currentTab: string = 'summarize';
  private lastAssistantMessageId: string | null = null;

  constructor() {
    this.geminiService = new GeminiService();
    this.storageService = new StorageService();
    this.summarizer = new Summarizer(this.geminiService);
    this.chat = new Chat(this.geminiService, this.storageService);
    
    this.initializeApp();
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
      tab.addEventListener('click', () => {
        const tabId = tab.id.replace('-tab', '');
        this.switchTab(tabId);
      });
    });

    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const favoriteBtn = document.getElementById('favorite-btn') as HTMLButtonElement;

    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
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
    try {
      const history = await this.storageService.getHistory();
      if (history.length > 0) {
        const chatMessages: ChatMessage[] = history.map(item => ({
          id: item.id,
          role: 'assistant' as const,
          content: item.response,
          timestamp: item.timestamp
        }));
        this.chat.loadHistory(chatMessages);
        this.updateChatUI();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  private switchTab(tabId: string): void {
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
      this.handleSummarizeTab();
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
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});
