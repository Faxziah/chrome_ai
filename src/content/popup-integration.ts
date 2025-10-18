import { PopupUI } from './popup-ui';
import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { SpeechSynthesisManager } from './speech-utils';
import { RephraseHandler, TranslateHandler, ClipboardHandler, SpeechHandler } from './handlers';
import { RephraserConfig, RephraserResult, TranslatorConfig, TranslatorResult, HistoryItem, LanguageCode } from '../types';

export class PopupIntegration {
  private popupUI: PopupUI;
  private geminiService: GeminiService | null = null;
  private storageService: StorageService;
  private speechManager: SpeechSynthesisManager | null = null;
  private rephraseHandler: RephraseHandler | null = null;
  private translateHandler: TranslateHandler | null = null;
  private speechHandler: SpeechHandler | null = null;
  private isProcessing: boolean = false;

  constructor(popupUI: PopupUI) {
    this.popupUI = popupUI;
    this.storageService = new StorageService();
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
      } else {
        console.log('API key not found. User needs to configure in options.');
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
        this.translateHandler = new TranslateHandler(shadowRoot, this.geminiService, this.storageService);
        this.speechHandler = new SpeechHandler(shadowRoot, this.speechManager);
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }

  public attachEventListeners(): void {
    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) {
      console.error('Shadow root not available for event listeners');
      return;
    }

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
  }

  private async handleRephraseClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        const shadowRoot = this.popupUI.getShadowRoot();
        const resultText = shadowRoot?.querySelector('#rephrase-text') as HTMLElement;
        if (resultText) {
          resultText.textContent = 'No text selected';
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.rephraseHandler) {
        await this.initializeServices();
        if (!this.rephraseHandler) {
          const shadowRoot = this.popupUI.getShadowRoot();
          const resultText = shadowRoot?.querySelector('#rephrase-text') as HTMLElement;
          if (resultText) {
            resultText.innerHTML = 'Please configure API key in <a href="#" id="open-options">extension settings</a>';
            resultText.className = 'result-text error';
          }
          return;
        }
      }

      await this.rephraseHandler.handleRephrase(selectedText);
    } catch (error) {
      console.error('Rephrase error:', error);
    } finally {
      this.isProcessing = false;
    }
  }


  private async handleCopyClick(event: Event, type: 'rephrase' | 'translate'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const resultElementId = type === 'rephrase' ? 'rephrase-text' : 'translate-text';
    await ClipboardHandler.handleCopyClick(event, shadowRoot, resultElementId);
  }


  private async handleTranslateClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        const shadowRoot = this.popupUI.getShadowRoot();
        const resultText = shadowRoot?.querySelector('#translate-text') as HTMLElement;
        if (resultText) {
          resultText.textContent = 'No text selected';
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.translateHandler) {
        await this.initializeServices();
        if (!this.translateHandler) {
          const shadowRoot = this.popupUI.getShadowRoot();
          const resultText = shadowRoot?.querySelector('#translate-text') as HTMLElement;
          if (resultText) {
            resultText.innerHTML = 'Please configure API key in <a href="#" id="open-options">extension settings</a>';
            resultText.className = 'result-text error';
          }
          return;
        }
      }

      await this.translateHandler.handleTranslate(selectedText);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      this.isProcessing = false;
    }
  }


  private handleSwapLanguagesClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.translateHandler) {
      alert('Translation handler not available');
      return;
    }

    this.translateHandler.handleSwapLanguages();
  }

  private async handleSpeakClick(event: Event, type: 'source' | 'translation'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.speechHandler) {
      alert('Speech handler not available');
      return;
    }

    const translationData = this.translateHandler?.getLastTranslation() || { result: null, originalText: null };
    await this.speechHandler.handleSpeak(type, translationData);
  }

  public destroy(): void {
    this.geminiService = null;
    this.rephraseHandler = null;
    this.translateHandler = null;
    this.speechHandler = null;
    if (this.speechManager) {
      this.speechManager.stop();
      this.speechManager = null;
    }
  }
}
