import { PopupUI } from './popup-ui';
import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { FavoritesService } from '../services/favorites';
import { SpeechSynthesisManager } from './speech-utils';
import { RephraseHandler, TranslateHandler, ClipboardHandler, SpeechHandler, SummarizeHandler, DiscussHandler } from './handlers';
import { RephraserConfig, RephraserResult, TranslatorConfig, TranslatorResult, HistoryItem, LanguageCode } from '../types';
import { t } from '../utils/i18n';

export class PopupIntegration {
  private popupUI: PopupUI;
  private geminiService: GeminiService | null = null;
  private storageService: StorageService;
  private favoritesService: FavoritesService;
  private speechManager: SpeechSynthesisManager | null = null;
  private rephraseHandler: RephraseHandler | null = null;
  private translateHandler: TranslateHandler | null = null;
  private speechHandler: SpeechHandler | null = null;
  private summarizeHandler: SummarizeHandler | null = null;
  private discussHandler: DiscussHandler | null = null;
  private isProcessing: boolean = false;
  private isProcessingFavorite: boolean = false;
  private toastTimer: number | null = null;
  private apiKeyValid: boolean = false;
  private abortController: AbortController | null = null;

  constructor(popupUI: PopupUI) {
    this.popupUI = popupUI;
    this.storageService = new StorageService();
    this.favoritesService = new FavoritesService(this.storageService);
    this.initializeServicesAndAttachListeners().catch(console.error);
  }

  private async initializeServicesAndAttachListeners(): Promise<void> {
    await this.initializeServices();
    this.attachEventListeners();
  }

  private async initializeServices(): Promise<void> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (apiKey && apiKey.trim().length > 0) {
        this.geminiService = new GeminiService(apiKey);
        this.apiKeyValid = await this.geminiService.testConnection();
        if (!this.apiKeyValid) {
          console.log('API key is invalid or connection failed');
          this.geminiService = null;
        }
      } else {
        console.log('API key not found. User needs to configure in options.');
        this.apiKeyValid = false;
      }
      
      this.speechManager = new SpeechSynthesisManager();
      if (!this.speechManager.isSupported()) {
        console.warn('Speech synthesis not supported');
        this.speechManager = null;
      }

      // Create handlers after services are ready
      const shadowRoot = this.popupUI.getShadowRoot();
      if (shadowRoot) {
        this.rephraseHandler = new RephraseHandler(shadowRoot, this.geminiService, this.storageService);
        this.translateHandler = new TranslateHandler(shadowRoot, this.geminiService, this.storageService, this.speechManager);
        this.speechHandler = new SpeechHandler(shadowRoot, this.speechManager, this.storageService);
        this.summarizeHandler = new SummarizeHandler(shadowRoot, this.geminiService, this.storageService);
        this.discussHandler = new DiscussHandler(shadowRoot, this.geminiService, this.storageService, this.favoritesService);
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      this.apiKeyValid = false;
    }
  }

  public attachEventListeners(): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) {
      console.error('Shadow root not available for event listeners');
      return;
    }

    // Sync favorite button state when popup is shown
    this.syncFavoriteButtonState();

    // Listen for resultReady events from handlers
    shadowRoot.addEventListener('resultReady', ((event: CustomEvent) => {
      console.log('Result ready for type:', event.detail.type);
      this.showFavoriteButton();
      this.syncFavoriteButtonState();
    }) as EventListener);

    shadowRoot.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.btn') as HTMLElement;
      
      if (!button) return;

      const buttonId = button.id;
      
      if (buttonId === 'btn-rephrase') {
        await this.handleRephraseClick(event);
      } else if (buttonId === 'btn-copy-rephrase') {
        await this.handleCopyClick(event, 'rephrase');
      } else if (buttonId === 'btn-translate') {
        await this.handleTranslateClick(event);
      } else if (buttonId === 'btn-swap-languages') {
        this.handleSwapLanguagesClick(event);
      } else if (buttonId === 'btn-speak-source') {
        await this.handleSpeakClick(event, 'source');
      } else if (buttonId === 'btn-speak-translation') {
        await this.handleSpeakClick(event, 'translation');
      } else if (buttonId === 'btn-copy-translate') {
        await this.handleCopyClick(event, 'translate');
      } else if (buttonId === 'btn-summarize') {
        await this.handleSummarizeClick(event);
      } else if (buttonId === 'btn-copy-summary') {
        await this.handleCopyClick(event, 'summary');
      } else if (buttonId.startsWith('btn-favorite-toggle-')) {
        await this.handleFavoriteToggleClick(event);
      } else if (buttonId === 'btn-send-chat') {
        await this.handleSendChatClick(event);
      }
    });

    // Event listener for the options link
    shadowRoot.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.id === 'open-options') {
        event.preventDefault();
        await chrome.runtime.openOptionsPage();
      }
    });

    // Event listeners for language changes to update speech buttons
    const sourceLanguageSelect = shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    const targetLanguageSelect = shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    
    if (sourceLanguageSelect) {
      sourceLanguageSelect.addEventListener('change', () => {
        this.updateSpeechButtonsForLanguageChange();
      });
    }
    
    if (targetLanguageSelect) {
      targetLanguageSelect.addEventListener('change', () => {
        this.updateSpeechButtonsForLanguageChange();
      });
    }

    // Attach language change listeners to translate handler
    if (this.translateHandler) {
      this.translateHandler.attachLanguageChangeListeners();
    }

    // Listen for tab changes to sync favorite button state
    const tabsComponent = this.popupUI.getTabsComponent();
    if (tabsComponent) {
      tabsComponent.addEventListener('tabChange', () => {
        this.syncFavoriteButtonState();
        this.setupChatInputListener();
      });
    }

    // Setup chat input listener immediately
    this.setupChatInputListener();
    
    // Listen for popup full mode switch
    document.addEventListener('popupFullModeSwitched', () => {
      this.setupChatInputListener();
    });
  }

  private async handleRephraseClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        const shadowRoot = this.popupUI.getShadowRoot();
        const resultContainer = shadowRoot?.querySelector('#rephrase-result') as HTMLElement;
        const resultText = shadowRoot?.querySelector('#rephrase-text') as HTMLElement;
        if (resultContainer && resultText) {
          resultContainer.hidden = false;
          resultText.textContent = t('common.noTextSelected');
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.apiKeyValid) {
        this.showApiKeyError('rephrase-text');
        return;
      }

      if (!this.rephraseHandler) {
        await this.initializeServices();
        if (!this.rephraseHandler || !this.apiKeyValid) {
          this.showApiKeyError('rephrase-text');
          return;
        }
      }

      await this.rephraseHandler.handleRephrase(selectedText);
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        console.log('Rephrase operation was cancelled');
        return;
      }
      if ((error as Error).message?.includes('Could not establish connection') || 
          (error as Error).message?.includes('Receiving end does not exist') ||
          (error as Error).message?.includes('ACTION COMPLETED')) {
        console.log('System message, not showing to user:', (error as Error).message);
        return;
      }
      console.error('Rephrase error:', error);
      if (error instanceof Error && error.message === 'MODEL_NOT_AVAILABLE') {
        this.showModelUnavailableError('rephrase-text');
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }


  private async handleCopyClick(event: Event, type: 'rephrase' | 'translate' | 'summary'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const resultElementId = type === 'summary' ? 'summary-text' : (type === 'rephrase' ? 'rephrase-text' : 'translate-text');
    await ClipboardHandler.handleCopyClick(event, shadowRoot, resultElementId);
  }


  private async handleTranslateClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        const shadowRoot = this.popupUI.getShadowRoot();
        const resultContainer = shadowRoot?.querySelector('#translate-result') as HTMLElement;
        const resultText = shadowRoot?.querySelector('#translate-text') as HTMLElement;
        if (resultContainer && resultText) {
          resultContainer.hidden = false;
          resultText.textContent = t('common.noTextSelected');
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.apiKeyValid) {
        this.showApiKeyError('translate-text');
        return;
      }

      if (!this.translateHandler) {
        await this.initializeServices();
        if (!this.translateHandler || !this.apiKeyValid) {
          this.showApiKeyError('translate-text');
          return;
        }
      }

      await this.translateHandler.handleTranslate(selectedText);
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        console.log('Translation operation was cancelled');
        return;
      }
      if ((error as Error).message?.includes('Could not establish connection') || 
          (error as Error).message?.includes('Receiving end does not exist') ||
          (error as Error).message?.includes('ACTION COMPLETED')) {
        console.log('System message, not showing to user:', (error as Error).message);
        return;
      }
      console.error('Translation error:', error);
      if (error instanceof Error && error.message === 'MODEL_NOT_AVAILABLE') {
        this.showModelUnavailableError('translate-text');
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }


  private handleSwapLanguagesClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.translateHandler) {
      alert(t('common.translationHandlerNotAvailable'));
      return;
    }

    this.translateHandler.handleSwapLanguages();
  }

  private async handleSpeakClick(event: Event, type: 'source' | 'translation'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.speechHandler) {
      alert(t('common.speechHandlerNotAvailable'));
      return;
    }

    if (type === 'source') {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        alert(t('common.noTextSelectedToSpeak'));
        return;
      }
      const translationData = { result: null, originalText: selectedText };
      await this.speechHandler.handleSpeak(type, translationData);
    } else {
      const translationData = this.translateHandler?.getLastTranslation() || { result: null, originalText: null };
      await this.speechHandler.handleSpeak(type, translationData);
    }
  }

  private async handleSummarizeClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        const shadowRoot = this.popupUI.getShadowRoot();
        const resultContainer = shadowRoot?.querySelector('#summary-result') as HTMLElement;
        const resultText = shadowRoot?.querySelector('#summary-text') as HTMLElement;
        if (resultContainer && resultText) {
          resultContainer.hidden = false;
          resultText.textContent = t('common.noTextSelected');
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.apiKeyValid) {
        this.showApiKeyError('summary-text');
        return;
      }

      if (!this.summarizeHandler) {
        await this.initializeServices();
        if (!this.summarizeHandler || !this.apiKeyValid) {
          this.showApiKeyError('summary-text');
          return;
        }
      }

      await this.summarizeHandler.handleSummarize(selectedText);
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        console.log('Summarize operation was cancelled');
        return;
      }
      if ((error as Error).message?.includes('Could not establish connection') || 
          (error as Error).message?.includes('Receiving end does not exist') ||
          (error as Error).message?.includes('ACTION COMPLETED')) {
        console.log('System message, not showing to user:', (error as Error).message);
        return;
      }
      console.error('Summarize error:', error);
      if (error instanceof Error && error.message === 'MODEL_NOT_AVAILABLE') {
        this.showModelUnavailableError('summary-text');
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  private async handleSendChatClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      const shadowRoot = this.popupUI.getShadowRoot();
      const chatInput = shadowRoot?.querySelector('#chat-input') as HTMLTextAreaElement;
      
      if (!chatInput || !chatInput.value.trim()) {
        this.showToast(t('common.noTextSelected'), 'error');
        return;
      }

      if (!this.apiKeyValid) {
        this.showApiKeyError('discuss-text');
        return;
      }

      if (!this.discussHandler) {
        await this.initializeServices();
        if (!this.discussHandler || !this.apiKeyValid) {
          this.showApiKeyError('discuss-text');
          return;
        }
      }

      // Получаем выделенный текст
      const selectedText = this.popupUI.getSelectedText();
      
      // Формируем полное сообщение: выделенный текст + вопрос пользователя
      const fullMessage = selectedText 
        ? `${selectedText}\n\n${chatInput.value}`
        : chatInput.value;

      console.log('fullMessage', fullMessage)

      // Очищаем поле ввода после отправки
      chatInput.value = '';

      await this.discussHandler.handleSendMessage(fullMessage);
      chatInput.focus();
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        console.log('Chat operation was cancelled');
        return;
      }
      if ((error as Error).message?.includes('Could not establish connection') || 
          (error as Error).message?.includes('Receiving end does not exist') ||
          (error as Error).message?.includes('ACTION COMPLETED')) {
        console.log('System message, not showing to user:', (error as Error).message);
        return;
      }
      console.error('Chat error:', error);
      if (error instanceof Error && error.message === 'MODEL_NOT_AVAILABLE') {
        this.showModelUnavailableError('discuss-text');
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  private async handleFavoriteToggleClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessingFavorite) return;
    this.isProcessingFavorite = true;

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const button = event.target as HTMLElement;
    const currentTab = this.popupUI.getCurrentTab();
    
    try {
      const selectedText = this.popupUI.getSelectedText();
      
      // For discuss tab, check if there's a chat response instead of selected text
      if (currentTab.id === 'discuss') {
        const chatMessages = shadowRoot.querySelector('#chat-messages') as HTMLElement;
        const hasResponse = chatMessages && chatMessages.children.length > 0;
        if (!hasResponse) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
      } else if (!selectedText || selectedText.trim().length === 0) {
        this.showToast(t('common.noTextSelectedToSpeak'), 'error');
        return;
      }

      const isCurrentlyFavorite = button.dataset.isFavorite === 'true';
      
      if (isCurrentlyFavorite) {
        await this.handleRemoveFromFavorites(button);
      } else {
        await this.handleAddToFavorites(button, currentTab, shadowRoot, selectedText);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showToast(t('common.errorTogglingFavorite'), 'error');
    } finally {
      this.isProcessingFavorite = false;
    }
  }

  private async handleAddToFavorites(
    button: HTMLElement, 
    currentTab: any, 
    shadowRoot: ShadowRoot, 
    selectedText: string
  ): Promise<void> {
    let prompt = '';
    let response = '';
    let type: 'summarize' | 'rephrase' | 'translate' | 'discuss' = 'summarize';

    switch (currentTab.id) {
      case 'summarize':
        const summaryText = shadowRoot.querySelector('#summary-text') as HTMLElement;
        if (!summaryText || !summaryText.textContent) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
        prompt = 'Summarize this text';
        response = summaryText.textContent;
        type = 'summarize';
        break;
      case 'rephrase':
        const rephraseText = shadowRoot.querySelector('#rephrase-text') as HTMLElement;
        if (!rephraseText || !rephraseText.textContent) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
        const styleSelect = shadowRoot.querySelector('#rephrase-style') as HTMLSelectElement;
        const style = styleSelect?.value || 'casual';
        prompt = `Rephrase in ${style} style`;
        response = rephraseText.textContent;
        type = 'rephrase';
        break;
      case 'translate':
        const translateText = shadowRoot.querySelector('#translate-text') as HTMLElement;
        if (!translateText || !translateText.textContent) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
        const sourceLang = (shadowRoot.querySelector('#source-language') as HTMLSelectElement)?.value || 'auto';
        const targetLang = (shadowRoot.querySelector('#target-language') as HTMLSelectElement)?.value || 'en';
        prompt = `Translate from ${sourceLang} to ${targetLang}`;
        response = translateText.textContent;
        type = 'translate';
        break;
      case 'discuss':
        const chatMessages = shadowRoot.querySelector('#chat-messages') as HTMLElement;
        if (!chatMessages || !chatMessages.textContent || chatMessages.children.length === 0) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
        // Получить последнее сообщение ассистента
        const lastMessage = Array.from(chatMessages.children)
          .reverse()
          .find(el => el.classList.contains('assistant'));
        if (!lastMessage) {
          this.showToast(t('common.noResultToAddToFavorites'), 'error');
          return;
        }
        prompt = 'Discuss this text';
        response = lastMessage.textContent || '';
        type = 'discuss';
        break;
      default:
        this.showToast(t('common.cannotAddToFavoritesFromThisTab'), 'error');
        return;
    }

    const sourceId = this.storageService.generateSourceId(type, prompt, response);
    const success = await this.favoritesService.addToFavorites(
      type,
      prompt,
      response,
      selectedText,
      undefined,
      { sourceId }
    );

    if (success) {
      const found = await this.favoritesService.findBySourceId(sourceId);
      if (found) {
        button.dataset.sourceId = found.metadata?.sourceId || sourceId;
      }
      this.updateFavoriteButtonState(button, true);
    } else {
      this.showToast(t('common.failedToAddToFavorites'), 'error');
    }
  }

  private async handleRemoveFromFavorites(button: HTMLElement): Promise<void> {
    const sourceId = button.dataset.sourceId;
    
    if (!sourceId) {
      this.showToast(t('common.noFavoriteIdFound'), 'error');
      return;
    }

    const success = await this.favoritesService.removeBySourceId(sourceId);
    
    if (success) {
      this.updateFavoriteButtonState(button, false);
    } else {
      this.showToast(t('common.failedToRemoveFromFavorites'), 'error');
    }
  }

  private updateFavoriteButtonState(button: HTMLElement, isFavorite: boolean): void {
    if (isFavorite) {
      button.textContent = t('common.removeFromFavorites');
      button.classList.remove('favorite-active');
      button.classList.add('favorite-active');
      button.dataset.isFavorite = 'true';
    } else {
      button.textContent = t('common.addToFavorites');
      button.classList.remove('favorite-active');
      button.dataset.isFavorite = 'false';
      button.dataset.sourceId = '';
    }
  }

  private async syncFavoriteButtonState(): Promise<void> {
    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const currentTab = this.popupUI.getCurrentTab();
    const button = shadowRoot.querySelector(`#btn-favorite-toggle-${currentTab.id}`) as HTMLElement;
    if (!button) return;

    const selectedText = this.popupUI.getSelectedText();
    
    if (!selectedText || selectedText.trim().length === 0) {
      this.updateFavoriteButtonState(button, false);
      return;
    }

    let prompt = '';
    let response = '';
    let type: 'summarize' | 'rephrase' | 'translate' | 'discuss' = 'summarize';

    switch (currentTab.id) {
      case 'summarize':
        const summaryText = shadowRoot.querySelector('#summary-text') as HTMLElement;
        if (!summaryText || !summaryText.textContent) {
          this.updateFavoriteButtonState(button, false);
          return;
        }
        prompt = 'Summarize this text';
        response = summaryText.textContent;
        type = 'summarize';
        break;
      case 'rephrase':
        const rephraseText = shadowRoot.querySelector('#rephrase-text') as HTMLElement;
        if (!rephraseText || !rephraseText.textContent) {
          this.updateFavoriteButtonState(button, false);
          return;
        }
        const styleSelect = shadowRoot.querySelector('#rephrase-style') as HTMLSelectElement;
        const style = styleSelect?.value || 'casual';
        prompt = `Rephrase in ${style} style`;
        response = rephraseText.textContent;
        type = 'rephrase';
        break;
      case 'translate':
        const translateText = shadowRoot.querySelector('#translate-text') as HTMLElement;
        if (!translateText || !translateText.textContent) {
          this.updateFavoriteButtonState(button, false);
          return;
        }
        const sourceLang = (shadowRoot.querySelector('#source-language') as HTMLSelectElement)?.value || 'auto';
        const targetLang = (shadowRoot.querySelector('#target-language') as HTMLSelectElement)?.value || 'en';
        prompt = `Translate from ${sourceLang} to ${targetLang}`;
        response = translateText.textContent;
        type = 'translate';
        break;
      case 'discuss':
        const chatMessages = shadowRoot.querySelector('#chat-messages') as HTMLElement;
        if (!chatMessages || chatMessages.children.length === 0) {
          this.updateFavoriteButtonState(button, false);
          button.style.display = 'none';
          return;
        }
        const lastMessage = Array.from(chatMessages.children)
          .reverse()
          .find(el => el.classList.contains('assistant'));
        if (!lastMessage) {
          this.updateFavoriteButtonState(button, false);
          button.style.display = 'none';
          return;
        }
        prompt = 'Discuss this text';
        response = lastMessage.textContent || '';
        type = 'discuss';
        break;
      default:
        this.updateFavoriteButtonState(button, false);
        return;
    }

    const sourceId = this.storageService.generateSourceId(type, prompt, response);
    const isFavorite = await this.favoritesService.isFavoriteBySourceId(sourceId);
    
    if (isFavorite) {
      const found = await this.favoritesService.findBySourceId(sourceId);
      if (found) {
        button.dataset.sourceId = found.metadata?.sourceId || sourceId;
      }
    }
    
    this.updateFavoriteButtonState(button, isFavorite);
  }

  private updateSpeechButtonsForLanguageChange(): void {
    if (!this.translateHandler) return;
    this.translateHandler.updateSpeechButtons();
  }

  public showFavoriteButton(): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;
    
    const currentTab = this.popupUI.getCurrentTab();
    const favoriteButton = shadowRoot.querySelector(`#btn-favorite-toggle-${currentTab.id}`) as HTMLElement;
    const copyButton = shadowRoot.querySelector(`#btn-copy-${currentTab.id}`) as HTMLElement;
    
    if (favoriteButton) {
      favoriteButton.classList.add('show');
      favoriteButton.style.display = 'inline-flex';
    }
    
    if (copyButton) {
      copyButton.style.display = 'inline-flex';
    }
  }

  private showApiKeyError(elementId: string): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    const resultText = shadowRoot?.querySelector(`#${elementId}`) as HTMLElement;
    const tabId = elementId.replace('-text', '');
    const resultContainer = shadowRoot?.querySelector(`#${tabId}-result`) as HTMLElement;
    const errorTemplate = shadowRoot?.querySelector(`#api-key-error-${tabId}`) as HTMLElement;
    
    if (resultContainer && resultText && errorTemplate) {
      resultContainer.hidden = false;
      resultText.innerHTML = errorTemplate.innerHTML;
      resultText.className = 'result-text error';
      resultText.style.display = 'block';
    }
  }

  private showModelUnavailableError(elementId: string): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    const resultText = shadowRoot?.querySelector(`#${elementId}`) as HTMLElement;
    
    if (resultText) {
      resultText.innerHTML = t('api.modelUnavailable');
      resultText.className = 'result-text error';
      resultText.style.display = 'block';
    }
    
    this.showToast(t('api.modelUnavailable'), 'error');
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    // Clear previous timer
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    // Reuse existing toast element
    let toast = shadowRoot.querySelector('.toast') as HTMLElement;
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      shadowRoot.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.backgroundColor = type === 'success' ? '#1e8e3e' : '#d93025';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';

    this.toastTimer = window.setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
      }
      this.toastTimer = null;
    }, 3000);
  }

  public isApiKeyValid(): boolean {
    return this.apiKeyValid;
  }

  public cancelCurrentOperation(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isProcessing = false;
  }

  public destroy(): void {
    this.cancelCurrentOperation();
    this.geminiService = null;
    this.rephraseHandler = null;
    this.translateHandler = null;
    this.speechHandler = null;
    this.summarizeHandler = null;
    this.discussHandler = null;
    if (this.speechManager) {
      this.speechManager.stop();
      this.speechManager = null;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private setupChatInputListener(): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const chatInput = shadowRoot.querySelector('#chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      // Remove existing listener to avoid duplicates
      chatInput.removeEventListener('keydown', this.handleChatInputKeydown);
      // Add new listener
      chatInput.addEventListener('keydown', this.handleChatInputKeydown.bind(this));
    }
  }

  private async handleChatInputKeydown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await this.handleSendChatClick(event);
    }
  }
}

