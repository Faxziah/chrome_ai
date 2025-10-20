import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { Translator } from '../../components/translator';
import { TranslatorResult } from '../../types';
import { SpeechSynthesisManager } from '../speech-utils';
import { t } from '../../utils/i18n';

export class TranslateHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private translator: Translator | null;
  private shadowRoot: ShadowRoot;
  private lastTranslationResult: TranslatorResult | null = null;
  private lastOriginalText: string | null = null;
  private speechManager: SpeechSynthesisManager;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService,
    speechManager: SpeechSynthesisManager | null = null
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.translator = geminiService ? new Translator(geminiService) : null;
    this.speechManager = speechManager || new SpeechSynthesisManager();
  }

  public async handleTranslate(selectedText: string): Promise<void> {
    if (!this.translator) {
      this.showError(t('api.missingKey'));
      return;
    }

    if (!selectedText.trim()) {
      this.showError(t('common.noTextSelected'));
      return;
    }

    const sourceSelect = this.shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    const targetSelect = this.shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    const sourceLanguage = sourceSelect?.value || 'auto';
    const targetLanguage = targetSelect?.value || 'en';

    if (sourceLanguage === targetLanguage && sourceLanguage !== 'auto') {
      this.showError(t('translate.sameLanguages'));
      return;
    }

    const button = this.shadowRoot.querySelector('#btn-translate') as HTMLButtonElement;
    const resultContainer = this.shadowRoot.querySelector('#translate-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#translate-text') as HTMLElement;

    try {
      this.showLoading(button, resultContainer, resultText);

      const result = await this.translator.translateWithStream(selectedText, {
        sourceLanguage: sourceLanguage as any,
        targetLanguage: targetLanguage as any,
        preserveFormatting: true
      }, (chunk: string) => {
        if (resultText) {
          resultText.textContent += chunk;
        }
      });

      this.lastTranslationResult = result;
      this.lastOriginalText = selectedText;

      this.showResult(resultContainer, resultText, result.translatedText);
      this.updateSourceLanguage(result.detectedLanguage);
      this.enableSwapButton();
      this.updateSpeechButtons();
      await this.saveToHistory(selectedText, result);
    } catch (error) {
      console.error('Translation error:', error);
      
      // Фильтруем системные ошибки
      if (error instanceof Error && 
          (error.message.includes('Could not establish connection') ||
           error.message.includes('Receiving end does not exist') ||
           error.message.includes('ACTION COMPLETED'))) {
        return;
      }
      
      const base = t('errors.translateFailed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const reason = t('errors.withReason', { reason: errorMessage });
      this.showError(`${base}. ${reason}`);
    } finally {
      this.restoreButton(button);
    }
  }

  public handleSwapLanguages(): void {
    const sourceSelect = this.shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    const targetSelect = this.shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    const resultContainer = this.shadowRoot.querySelector('#translate-result') as HTMLElement;

    if (!sourceSelect || !targetSelect) return;

    const currentSource = sourceSelect.value;
    const currentTarget = targetSelect.value;

    if (currentSource === 'auto' && this.lastTranslationResult?.detectedLanguage) {
      sourceSelect.value = this.lastTranslationResult.detectedLanguage;
    }

    sourceSelect.value = currentTarget;
    targetSelect.value = currentSource;

    resultContainer.hidden = true;
    this.enableTranslateButton();
  }

  public getLastTranslation(): { result: TranslatorResult | null, originalText: string | null, selectedText: string | null } {
    return {
      result: this.lastTranslationResult,
      originalText: this.lastOriginalText,
      selectedText: this.lastOriginalText
    };
  }

  public updateServices(geminiService: GeminiService | null): void {
    this.geminiService = geminiService;
    this.translator = geminiService ? new Translator(geminiService) : null;
  }

  private async saveToHistory(originalText: string, result: TranslatorResult): Promise<void> {
    try {
      await this.storageService.saveToHistory({
        type: 'translate',
        prompt: originalText,
        response: result.translatedText,
        metadata: {
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          detectedLanguage: result.detectedLanguage,
          originalLength: result.originalLength,
          translatedLength: result.translatedLength,
          compressionRatio: result.compressionRatio
        }
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  private showLoading(button: HTMLButtonElement, resultContainer: HTMLElement, resultText: HTMLElement): void {
    button.disabled = true;
    button.textContent = t('status.translating');
    resultContainer.hidden = false;
    resultText.textContent = t('status.translating');
    resultText.className = 'result-text loading';
  }

  private showResult(resultContainer: HTMLElement, resultText: HTMLElement, text: string): void {
    resultText.textContent = text;
    resultText.className = 'result-text';
    resultContainer.hidden = false;
    
    this.updateSpeechButtons();
    
    // Dispatch event для показа кнопки Favorites
    const event = new CustomEvent('resultReady', { 
      detail: { type: 'translate' },
      bubbles: true,
      composed: true
    });
    this.shadowRoot.dispatchEvent(event);
  }

  private showError(message: string): void {
    const resultContainer = this.shadowRoot.querySelector('#translate-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#translate-text') as HTMLElement;
    
    if (resultContainer && resultText) {
      resultText.textContent = message;
      resultText.className = 'result-text error';
      resultContainer.hidden = false;
    }
  }

  private restoreButton(button: HTMLButtonElement): void {
    button.disabled = false;
    button.textContent = t('common.translate');
  }

  private updateSourceLanguage(detectedLanguage?: string): void {
    if (detectedLanguage) {
      const sourceSelect = this.shadowRoot.querySelector('#source-language') as HTMLSelectElement;
      if (sourceSelect) {
        sourceSelect.value = detectedLanguage;
      }
    }
  }

  private enableSwapButton(): void {
    const swapButton = this.shadowRoot.querySelector('#btn-swap-languages') as HTMLButtonElement;
    if (swapButton) {
      swapButton.disabled = false;
    }
  }

  private enableTranslateButton(): void {
    const translateButton = this.shadowRoot.querySelector('#btn-translate') as HTMLButtonElement;
    if (translateButton) {
      translateButton.disabled = false;
    }
  }

  public updateSpeechButtons(): void {
    const sourceLanguage = this.getSourceLanguage();
    const targetLanguage = this.getTargetLanguage();
    
    const sourceButton = this.shadowRoot.querySelector('#btn-speak-source') as HTMLButtonElement;
    const translationButton = this.shadowRoot.querySelector('#btn-speak-translation') as HTMLButtonElement;
    
    if (sourceButton) {
      const isSourceSupported = this.speechManager.isLanguageSupportedForSpeech(sourceLanguage);
      const hasSourceVoice = this.speechManager.hasVoiceForLanguage(sourceLanguage);
      const shouldShowSource = isSourceSupported && hasSourceVoice;
      sourceButton.style.display = shouldShowSource ? 'inline-block' : 'none';
      sourceButton.disabled = !shouldShowSource;
    }
    
    if (translationButton) {
      const isTargetSupported = this.speechManager.isLanguageSupportedForSpeech(targetLanguage);
      const hasTargetVoice = this.speechManager.hasVoiceForLanguage(targetLanguage);
      const shouldShowTarget = isTargetSupported && hasTargetVoice;
      translationButton.style.display = shouldShowTarget ? 'inline-block' : 'none';
      translationButton.disabled = !shouldShowTarget;
    }
  }

  private getSourceLanguage(): string {
    const sourceSelect = this.shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    return sourceSelect?.value || 'auto';
  }

  private getTargetLanguage(): string {
    const targetSelect = this.shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    return targetSelect?.value || 'en';
  }

  public attachLanguageChangeListeners(): void {
    const sourceLanguageSelect = this.shadowRoot.querySelector('#source-language');
    const targetLanguageSelect = this.shadowRoot.querySelector('#target-language');

    sourceLanguageSelect?.addEventListener('change', () => {
      this.updateSpeechButtons();
    });

    targetLanguageSelect?.addEventListener('change', () => {
      this.updateSpeechButtons();
    });

    // Initial update of speech buttons
    this.updateSpeechButtons();
  }
}
