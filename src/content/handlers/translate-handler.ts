import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { Translator } from '../../components/translator';
import { TranslatorResult } from '../../types';

export class TranslateHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private translator: Translator | null;
  private shadowRoot: ShadowRoot;
  private lastTranslationResult: TranslatorResult | null = null;
  private lastOriginalText: string | null = null;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.translator = geminiService ? new Translator(geminiService) : null;
  }

  public async handleTranslate(selectedText: string): Promise<void> {
    if (!this.translator) {
      this.showError('API key not configured. Please set your Gemini API key in the options page.');
      return;
    }

    if (!selectedText.trim()) {
      this.showError('Please select some text to translate.');
      return;
    }

    const sourceSelect = this.shadowRoot.querySelector('#source-language') as HTMLSelectElement;
    const targetSelect = this.shadowRoot.querySelector('#target-language') as HTMLSelectElement;
    const sourceLanguage = sourceSelect?.value || 'auto';
    const targetLanguage = targetSelect?.value || 'en';

    if (sourceLanguage === targetLanguage && sourceLanguage !== 'auto') {
      this.showError('Source and target languages cannot be the same.');
      return;
    }

    const button = this.shadowRoot.querySelector('#btn-translate') as HTMLButtonElement;
    const resultContainer = this.shadowRoot.querySelector('#translate-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#translate-text') as HTMLElement;

    try {
      this.showLoading(button, resultContainer, resultText);

      const result = await this.translator.translate(selectedText, {
        sourceLanguage: sourceLanguage as any,
        targetLanguage: targetLanguage as any,
        preserveFormatting: true
      });

      this.lastTranslationResult = result;
      this.lastOriginalText = selectedText;

      this.showResult(resultContainer, resultText, result.translatedText);
      this.updateSourceLanguage(result.detectedLanguage);
      this.enableSwapButton();
      await this.saveToHistory(selectedText, result);
    } catch (error) {
      console.error('Translation error:', error);
      this.showError(`Failed to translate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  public getLastTranslation(): { result: TranslatorResult | null, originalText: string | null } {
    return {
      result: this.lastTranslationResult,
      originalText: this.lastOriginalText
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
    button.textContent = 'Translating...';
    resultContainer.hidden = false;
    resultText.textContent = 'Translating your text...';
    resultText.className = 'result-text loading';
  }

  private showResult(resultContainer: HTMLElement, resultText: HTMLElement, text: string): void {
    resultText.textContent = text;
    resultText.className = 'result-text';
    resultContainer.hidden = false;
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
    button.textContent = 'Translate';
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
}
