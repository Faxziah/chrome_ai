import { PopupUI } from './popup-ui';
import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { Rephraser } from '../components/rephraser';
import { Translator } from '../components/translator';
import { SpeechSynthesisManager } from './speech-utils';
import { RephraserConfig, RephraserResult, TranslatorConfig, TranslatorResult, HistoryItem } from '../types';

export class PopupIntegration {
  private popupUI: PopupUI;
  private geminiService: GeminiService | null = null;
  private storageService: StorageService;
  private rephraser: Rephraser | null = null;
  private translator: Translator | null = null;
  private speechManager: SpeechSynthesisManager | null = null;
  private lastTranslationResult: TranslatorResult | null = null;
  private lastOriginalText: string | null = null;
  private isProcessing: boolean = false;

  constructor(popupUI: PopupUI) {
    this.popupUI = popupUI;
    this.storageService = new StorageService();
    this.initializeServicesAndAttachListeners();
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
        this.rephraser = new Rephraser(this.geminiService);
        this.translator = new Translator(this.geminiService);
      } else {
        console.warn('API key not found. User needs to configure in options.');
      }
      
      this.speechManager = new SpeechSynthesisManager();
      if (!this.speechManager.isSupported()) {
        console.warn('Speech synthesis not supported');
        this.speechManager = null;
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

    shadowRoot.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.btn') as HTMLElement;
      
      if (!button) return;

      const buttonId = button.id;
      
      if (buttonId === 'btn-rephrase') {
        this.handleRephraseClick(event);
      } else if (buttonId === 'btn-copy-rephrase') {
        this.handleCopyClick(event, 'rephrase');
      } else if (buttonId === 'btn-translate') {
        this.handleTranslateClick(event);
      } else if (buttonId === 'btn-swap-languages') {
        this.handleSwapLanguagesClick(event);
      } else if (buttonId === 'btn-speak-source') {
        this.handleSpeakClick(event, 'source');
      } else if (buttonId === 'btn-speak-translation') {
        this.handleSpeakClick(event, 'translation');
      } else if (buttonId === 'btn-copy-translate') {
        this.handleCopyClick(event, 'translate');
      }
    });

    // Event listener for the options link
    shadowRoot.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.id === 'open-options') {
        event.preventDefault();
        chrome.runtime.openOptionsPage();
      }
    });
  }

  private async handleRephraseClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const shadowRoot = this.popupUI.getShadowRoot();
      if (!shadowRoot) return;

      const styleSelect = shadowRoot.querySelector('#rephrase-style') as HTMLSelectElement;
      const rephraseButton = shadowRoot.querySelector('#btn-rephrase') as HTMLButtonElement;
      const resultContainer = shadowRoot.querySelector('#rephrase-result') as HTMLElement;
      const resultText = shadowRoot.querySelector('#rephrase-text') as HTMLElement;

      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        if (resultText) {
          resultText.textContent = 'No text selected';
          resultText.className = 'result-text error';
        }
        return;
      }

      const selectedStyle = styleSelect?.value || 'casual';

      if (!this.geminiService || !this.rephraser) {
        // Try to initialize services once more
        await this.initializeServices();
        
        if (!this.geminiService || !this.rephraser) {
          if (resultText) {
            resultText.innerHTML = 'Please configure API key in <a href="#" id="open-options">extension settings</a>';
            resultText.className = 'result-text error';
          }
          return;
        }
      }

      if (rephraseButton) {
        rephraseButton.disabled = true;
        rephraseButton.textContent = 'Rephrasing...';
      }

      if (resultContainer) {
        resultContainer.removeAttribute('hidden');
      }

      if (resultText) {
        resultText.textContent = 'Processing...';
        resultText.className = 'result-text loading';
      }

      const config: RephraserConfig = {
        style: selectedStyle as RephraserConfig['style'],
        language: 'Russian'
      };

      const result = await this.rephraser.rephrase(selectedText, config);

      if (resultText) {
        resultText.textContent = result.rephrasedText;
        resultText.className = 'result-text';
      }

      this.saveRephraseToHistory(selectedText, result);
    } catch (error) {
      console.error('Rephrase error:', error);
      const shadowRoot = this.popupUI.getShadowRoot();
      const resultText = shadowRoot?.querySelector('#rephrase-text') as HTMLElement;
      if (resultText) {
        resultText.textContent = 'Failed to rephrase text. Please try again.';
        resultText.className = 'result-text error';
      }
    } finally {
      const shadowRoot = this.popupUI.getShadowRoot();
      const rephraseButton = shadowRoot?.querySelector('#btn-rephrase') as HTMLButtonElement;
      if (rephraseButton) {
        rephraseButton.disabled = false;
        rephraseButton.textContent = 'Rephrase';
      }
      this.isProcessing = false;
    }
  }

  private async saveRephraseToHistory(originalText: string, result: RephraserResult): Promise<void> {
    try {
      const historyItem: Omit<HistoryItem, 'id' | 'timestamp'> = {
        type: 'rephrase',
        originalText: originalText,
        prompt: `Rephrase in ${result.style} style`,
        response: result.rephrasedText,
        metadata: {
          style: result.style,
          originalLength: result.originalLength,
          rephrasedLength: result.rephrasedLength
        }
      };

      await this.storageService.saveToHistory(historyItem);
    } catch (error) {
      console.error('Failed to save rephrase to history:', error);
    }
  }

  private async handleCopyClick(event: Event, type: 'rephrase' | 'translate'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    let resultText: HTMLElement | null = null;
    if (type === 'rephrase') {
      resultText = shadowRoot.querySelector('#rephrase-text');
    } else if (type === 'translate') {
      resultText = shadowRoot.querySelector('#translate-text');
    }

    if (!resultText || !resultText.textContent) return;

    const text = resultText.textContent;

    try {
      await navigator.clipboard.writeText(text);
      this.showCopySuccess(event);
    } catch (error) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showCopySuccess(event);
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
        alert('Failed to copy to clipboard');
      }
    }
  }

  private showCopySuccess(event: Event): void {
    const button = (event.target as HTMLElement).closest('.btn') as HTMLElement;
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 2000);
  }

  private async handleTranslateClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const shadowRoot = this.popupUI.getShadowRoot();
      if (!shadowRoot) return;

      const sourceLanguageSelect = shadowRoot.querySelector('#source-language') as HTMLSelectElement;
      const targetLanguageSelect = shadowRoot.querySelector('#target-language') as HTMLSelectElement;
      const translateButton = shadowRoot.querySelector('#btn-translate') as HTMLButtonElement;
      const resultContainer = shadowRoot.querySelector('#translate-result') as HTMLElement;
      const resultText = shadowRoot.querySelector('#translate-text') as HTMLElement;
      const swapButton = shadowRoot.querySelector('#btn-swap-languages') as HTMLButtonElement;

      const selectedText = this.popupUI.getSelectedText();
      if (!selectedText || selectedText.trim().length === 0) {
        if (resultText) {
          resultText.textContent = 'No text selected';
          resultText.className = 'result-text error';
        }
        return;
      }

      const sourceLanguage = sourceLanguageSelect?.value || 'auto';
      const targetLanguage = targetLanguageSelect?.value || 'en';

      if (!targetLanguage || targetLanguage.trim().length === 0) {
        if (resultText) {
          resultText.textContent = 'Please select a target language';
          resultText.className = 'result-text error';
        }
        return;
      }

      if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
        if (resultText) {
          resultText.textContent = 'Source and target languages cannot be the same';
          resultText.className = 'result-text error';
        }
        return;
      }

      if (!this.geminiService || !this.translator) {
        await this.initializeServices();
        
        if (!this.geminiService || !this.translator) {
          if (resultText) {
            resultText.innerHTML = 'Please configure API key in <a href="#" id="open-options">extension settings</a>';
            resultText.className = 'result-text error';
          }
          return;
        }
      }

      if (translateButton) {
        translateButton.disabled = true;
        translateButton.textContent = 'Translating...';
      }

      if (resultContainer) {
        resultContainer.removeAttribute('hidden');
      }

      if (resultText) {
        resultText.textContent = 'Processing...';
        resultText.className = 'result-text loading';
      }

      const config: TranslatorConfig = {
        sourceLanguage,
        targetLanguage
      };

      const result = await this.translator.translate(selectedText, config);

      this.lastTranslationResult = result;
      this.lastOriginalText = selectedText;

      if (resultText) {
        resultText.textContent = result.translatedText;
        resultText.className = 'result-text';
      }

      if (result.detectedLanguage && sourceLanguageSelect) {
        sourceLanguageSelect.value = result.detectedLanguage;
      }

      if (swapButton) {
        swapButton.disabled = !(sourceLanguage !== 'auto' || result.detectedLanguage);
      }

      this.saveTranslationToHistory(selectedText, result);
    } catch (error) {
      console.error('Translation error:', error);
      const shadowRoot = this.popupUI.getShadowRoot();
      const resultText = shadowRoot?.querySelector('#translate-text') as HTMLElement;
      if (resultText) {
        resultText.textContent = 'Failed to translate text. Please try again.';
        resultText.className = 'result-text error';
      }
    } finally {
      const shadowRoot = this.popupUI.getShadowRoot();
      const translateButton = shadowRoot?.querySelector('#btn-translate') as HTMLButtonElement;
      if (translateButton) {
        translateButton.disabled = false;
        translateButton.textContent = 'Translate';
      }
      this.isProcessing = false;
    }
  }

  private async saveTranslationToHistory(originalText: string, result: TranslatorResult): Promise<void> {
    try {
      const historyItem: Omit<HistoryItem, 'id' | 'timestamp'> = {
        type: 'translate',
        originalText: originalText,
        prompt: `Translate from ${result.sourceLanguage} to ${result.targetLanguage}`,
        response: result.translatedText,
        metadata: {
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          detectedLanguage: result.detectedLanguage,
          originalLength: result.originalLength,
          translatedLength: result.translatedLength
        }
      };

      await this.storageService.saveToHistory(historyItem);
    } catch (error) {
      console.error('Failed to save translation to history:', error);
    }
  }

  private handleSwapLanguagesClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const sourceLanguageSelect = shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    const targetLanguageSelect = shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    const resultContainer = shadowRoot.querySelector('#translate-result') as HTMLElement;
    const translateButton = shadowRoot.querySelector('#btn-translate') as HTMLButtonElement;

    const sourceValue = sourceLanguageSelect?.value || 'auto';
    const targetValue = targetLanguageSelect?.value || 'en';

    if (sourceValue === 'auto') {
      if (this.lastTranslationResult?.detectedLanguage) {
        sourceLanguageSelect.value = this.lastTranslationResult.detectedLanguage;
      } else {
        alert('Cannot swap languages without a translation. Please translate first.');
        return;
      }
    }

    const newSourceValue = targetValue;
    const newTargetValue = sourceValue === 'auto' ? this.lastTranslationResult?.detectedLanguage || 'en' : sourceValue;

    if (sourceLanguageSelect) sourceLanguageSelect.value = newSourceValue;
    if (targetLanguageSelect) targetLanguageSelect.value = newTargetValue;

    if (resultContainer) {
      resultContainer.setAttribute('hidden', '');
    }

    if (translateButton) {
      translateButton.disabled = false;
    }
  }

  private async handleSpeakClick(event: Event, type: 'source' | 'translation'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.speechManager || !this.speechManager.isSupported()) {
      alert('Text-to-speech not supported in this browser');
      return;
    }

    this.speechManager.stop();

    const shadowRoot = this.popupUI.getShadowRoot();
    if (!shadowRoot) return;

    const sourceLanguageSelect = shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    let text: string | null = null;
    let languageCode: string | null = null;

    if (type === 'source') {
      text = this.lastOriginalText;
      const sourceLanguage = sourceLanguageSelect?.value || 'auto';
      if (sourceLanguage === 'auto' && this.lastTranslationResult?.detectedLanguage) {
        languageCode = this.lastTranslationResult.detectedLanguage;
      } else if (sourceLanguage !== 'auto') {
        languageCode = sourceLanguage;
      }
    } else if (type === 'translation') {
      text = this.lastTranslationResult?.translatedText || null;
      languageCode = this.lastTranslationResult?.targetLanguage || null;
    }

    if (!text || !languageCode) {
      alert('No text to speak');
      return;
    }

    try {
      await this.speechManager.speak({ text, languageCode });
    } catch (error) {
      console.error('Speech error:', error);
      alert('Failed to speak text');
    }
  }

  public destroy(): void {
    this.geminiService = null;
    this.rephraser = null;
    this.translator = null;
    if (this.speechManager) {
      this.speechManager.stop();
      this.speechManager = null;
    }
    this.lastTranslationResult = null;
    this.lastOriginalText = null;
  }
}
