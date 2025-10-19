import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { FavoritesService } from '../../services/favorites';
import { Chat } from '../../components/chat';
import { ChatMessage } from '../../types';
import { t } from '../../utils/i18n';

export class DiscussHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private favoritesService: FavoritesService;
  private chat: Chat | null;
  private shadowRoot: ShadowRoot;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService,
    favoritesService: FavoritesService
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.favoritesService = favoritesService;
    this.chat = geminiService ? new Chat(geminiService, storageService, favoritesService) : null;
    
    if (this.chat) {
      this.setupChatCallbacks();
    }
  }

  public async handleSendMessage(text: string): Promise<void> {
    if (!this.chat) {
      this.showError(t('api.missingKey'));
      return;
    }

    if (!text.trim()) {
      this.showError(t('common.noTextSelected'));
      return;
    }

    const chatInput = this.shadowRoot.querySelector('#chat-input') as HTMLTextAreaElement;
    const sendButton = this.shadowRoot.querySelector('#btn-send-chat') as HTMLButtonElement;

    try {
      this.showLoading(sendButton, chatInput);
      
      await this.chat.sendMessageWithStream(text, (chunk: string) => {
        this.updateChatUI();
      });
      
      this.updateChatUI();
      this.clearInput(chatInput);
      
      // Dispatch event для показа кнопки Favorites
      const event = new CustomEvent('resultReady', { 
        detail: { type: 'discuss' },
        bubbles: true,
        composed: true
      });
      this.shadowRoot.dispatchEvent(event);
    } catch (error) {
      console.error('Discuss error:', error);
      const base = t('errors.summarizeFailed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const reason = t('errors.withReason', { reason: errorMessage });
      this.showError(`${base}. ${reason}`);
    } finally {
      this.restoreButton(sendButton, chatInput);
    }
  }

  private setupChatCallbacks(): void {
    if (!this.chat) return;
    
    this.chat.setMessageUpdateCallback((message) => {
      this.updateChatUI();
    });
    
    this.chat.setStreamCompleteCallback((message) => {
      this.updateChatUI();
    });
  }

  private updateChatUI(): void {
    if (!this.chat) return;

    const chatMessages = this.shadowRoot.querySelector('#chat-messages') as HTMLElement;
    if (!chatMessages) return;

    const messages = this.chat.getMessages();
    chatMessages.innerHTML = messages.map(message => `
      <div class="chat-message ${message.role}">
        <div class="message-content">${message.content}</div>
        <div class="message-time">${new Date(message.timestamp || Date.now()).toLocaleTimeString()}</div>
      </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  private async saveToHistory(originalText: string, response: string): Promise<void> {
    try {
      await this.storageService.saveToHistory({
        type: 'discuss',
        prompt: originalText,
        response: response,
        metadata: {
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  public updateServices(geminiService: GeminiService | null): void {
    this.geminiService = geminiService;
    this.chat = geminiService ? new Chat(geminiService, this.storageService, this.favoritesService) : null;
    
    if (this.chat) {
      this.setupChatCallbacks();
    }
  }

  private showLoading(button: HTMLButtonElement, input: HTMLTextAreaElement): void {
    button.disabled = true;
    button.textContent = t('status.summarizing');
    input.disabled = true;
  }

  private showError(message: string): void {
    const chatMessages = this.shadowRoot.querySelector('#chat-messages') as HTMLElement;
    
    if (chatMessages) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'chat-message error';
      errorMessage.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
      `;
      chatMessages.appendChild(errorMessage);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  private restoreButton(button: HTMLButtonElement, input: HTMLTextAreaElement): void {
    button.disabled = false;
    button.textContent = '➤';
    input.disabled = false;
  }

  private clearInput(input: HTMLTextAreaElement): void {
    input.value = '';
    input.focus();
  }
}
