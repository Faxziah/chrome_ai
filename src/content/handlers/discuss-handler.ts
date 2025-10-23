import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { FavoritesService } from '../../services/favorites';
import { Chat } from '../../components/chat';
import { t } from '../../utils/i18n';
import { formatMarkdown } from '../../utils/utils';

export class DiscussHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private favoritesService: FavoritesService;
  private chat: Chat | null;
  private shadowRoot: ShadowRoot;
  private selectedText: string;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService,
    favoritesService: FavoritesService,
    selectedText: string
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.favoritesService = favoritesService;
    this.selectedText = selectedText;
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
      
      // Dispatch event для показа кнопки Favorites
      const event = new CustomEvent('resultReady', { 
        detail: { type: 'discuss' },
        bubbles: true,
        composed: true
      });
      this.shadowRoot.dispatchEvent(event);
    } catch (error) {
      if ((error as Error).message?.includes('Could not establish connection') || 
          (error as Error).message?.includes('Receiving end does not exist') ||
          (error as Error).message?.includes('ACTION COMPLETED')) {
        console.log('System message, not showing to user:', (error as Error).message);
        return;
      }
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
    
    this.chat.setStreamCompleteCallback(async (message) => {
      this.updateChatUI();

      // Save to history when stream is complete
      if (message.role === 'assistant') {
        const messages = this.chat!.getMessages();
        const userMessage = messages.find(m => m.role === 'user');
        if (userMessage) {
          // Собираем весь диалог для сохранения
          const fullDialogue = messages.map(msg => {
            const role = msg.role === 'user' ? 'Пользователь' : 'ИИ';
            let content = msg.content;
            
            // Убираем выделенный текст из первого сообщения пользователя
            if (msg.role === 'user') {
              const selectedText = this.extractSelectedText(msg.content);
              if (content.includes(selectedText)) {
                const originalTextIndex = content.indexOf(selectedText);
                if (originalTextIndex !== -1) {
                  content = content.substring(originalTextIndex + selectedText.length).trim();
                }
              }
            }
            
            return `${role}\n${content}`;
          }).join('\n\n');
          
          // Получаем выделенный текст из первого сообщения пользователя
          const firstUserMessage = messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            // Извлекаем выделенный текст из первого сообщения
            const selectedText = this.extractSelectedText(firstUserMessage.content);
            await this.saveToHistory(selectedText, fullDialogue);
          }
        }
      }
    });
  }

  private updateChatUI(): void {
    if (!this.chat) return;

    const chatMessages = this.shadowRoot.querySelector('#chat-messages') as HTMLElement;
    if (!chatMessages) return;

    const messages = this.chat.getMessages();
    chatMessages.innerHTML = messages.map(message => `
      <div class="chat-message ${message.role}">
        <div class="message-header">
          <span class="message-role">${message.role === 'user' ? t('chat.user') : t('chat.ai')}</span>
        </div>
        <div class="message-content">${message.role === 'assistant' ? formatMarkdown(message.content) : message.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  private extractSelectedText(userMessage: string): string {
    // Если в сообщении есть выделенный текст (обычно в начале), извлекаем его
    // Выделенный текст обычно заканчивается перед вопросом или новой строкой
    const lines = userMessage.split('\n');
    if (lines.length > 1) {
      // Берем первую строку как выделенный текст
      return lines[0].trim();
    }
    
    // Если нет переносов строк, ищем паттерн выделенного текста
    // Обычно выделенный текст - это первая часть до знака вопроса или точки
    const match = userMessage.match(/^([^?]*?)(?:\?|$)/);
    if (match && match[1].trim().length > 0) {
      return match[1].trim();
    }
    
    // Если ничего не найдено, возвращаем все сообщение
    return userMessage.trim();
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
    input.disabled = true;
  }

  private showError(message: string): void {
    const chatMessages = this.shadowRoot.querySelector('#chat-messages') as HTMLElement;
    
    if (chatMessages) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'chat-message error';
      errorMessage.innerHTML = `
        <div class="message-content">${message}</div>
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
}
