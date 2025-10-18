import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { FavoriteItem } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  messageType?: 'chat' | 'summary';
}

export interface ChatConfig {
  systemPrompt?: string;
  maxHistory?: number;
  temperature?: number;
  maxTokens?: number;
}

export class Chat {
  private geminiService: GeminiService;
  private storageService: StorageService;
  private messages: ChatMessage[] = [];
  private config: ChatConfig;
  private onMessageUpdate?: (message: ChatMessage) => void;
  private onStreamComplete?: (message: ChatMessage) => void;

  constructor(
    geminiService: GeminiService, 
    storageService: StorageService,
    config?: ChatConfig
  ) {
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.config = {
      systemPrompt: 'Ты полезный AI-ассистент, который помогает с анализом и суммаризацией текста.',
      maxHistory: 20,
      temperature: 0.7,
      maxTokens: 2048,
      ...config
    };
  }

  setMessageUpdateCallback(callback: (message: ChatMessage) => void): void {
    this.onMessageUpdate = callback;
  }

  setStreamCompleteCallback(callback: (message: ChatMessage) => void): void {
    this.onStreamComplete = callback;
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    return this.sendMessageInternal(content);
  }

  async sendMessageWithStream(
    content: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatMessage> {
    return this.sendMessageInternal(content, onChunk);
  }

  async addToFavorites(messageId: string, messageType: 'chat' | 'summary' = 'chat'): Promise<void> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.role !== 'assistant') {
      throw new Error('Only assistant messages can be added to favorites');
    }

    const userMessage = this.messages[this.messages.indexOf(message) - 1];
    if (!userMessage || userMessage.role !== 'user') {
      throw new Error('User message not found for this assistant response');
    }

    const tags = message.messageType === 'summary' || messageType === 'summary' ? ['summary'] : ['chat'];

    const favoriteItem: FavoriteItem = {
      id: this.generateId(),
      type: 'summarize',
      prompt: userMessage.content,
      response: message.content,
      timestamp: message.timestamp,
      tags
    };

    await this.storageService.addToFavorites(favoriteItem);
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getLastMessage(): ChatMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  clearHistory(): void {
    this.messages = [];
  }

  loadHistory(messages: ChatMessage[]): void {
    this.messages = [...messages];
  }

  private buildPrompt(): string {
    const systemPrompt = this.config.systemPrompt || '';
    const conversationHistory = this.messages
      .slice(-this.config.maxHistory! * 2)
      .filter(msg => !(msg.role === 'assistant' && msg.isStreaming && msg.content === ''))
      .map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content}`)
      .join('\n\n');

    return `${systemPrompt}\n\nИстория разговора:\n${conversationHistory}`;
  }

  private trimHistory(): void {
    if (this.messages.length > this.config.maxHistory! * 2) {
      this.messages = this.messages.slice(-this.config.maxHistory! * 2);
    }
  }

  private async sendMessageInternal(
    content: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatMessage> {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };

    this.messages.push(userMessage);
    this.onMessageUpdate?.(userMessage);

    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    this.messages.push(assistantMessage);
    this.onMessageUpdate?.(assistantMessage);

    try {
      const prompt = this.buildPrompt();
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      })) {
        if (!chunk.isComplete) {
          assistantMessage.content += chunk.text;
        }
        assistantMessage.isStreaming = !chunk.isComplete;
        
        if (onChunk && !chunk.isComplete) {
          onChunk(chunk.text);
        }
        
        this.onMessageUpdate?.(assistantMessage);
      }

      assistantMessage.isStreaming = false;
      this.onMessageUpdate?.(assistantMessage);
      this.onStreamComplete?.(assistantMessage);

      this.trimHistory();
      return assistantMessage;

    } catch (error) {
      console.error('Chat error:', error);
      assistantMessage.content = `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      assistantMessage.isStreaming = false;
      this.onMessageUpdate?.(assistantMessage);
      throw error;
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
