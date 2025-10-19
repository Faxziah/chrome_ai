import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { Rephraser } from '../../components/rephraser';
import { RephraserResult } from '../../types';
import { t } from '../../utils/i18n';

export class RephraseHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private rephraser: Rephraser | null;
  private shadowRoot: ShadowRoot;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.rephraser = geminiService ? new Rephraser(geminiService) : null;
  }

  public async handleRephrase(selectedText: string): Promise<void> {
    if (!this.rephraser) {
      this.showError(t('api.missingKey'));
      return;
    }

    if (!selectedText.trim()) {
      this.showError(t('common.noTextSelected'));
      return;
    }

    const styleSelect = this.shadowRoot.querySelector('#rephrase-style') as HTMLSelectElement;
    const style = styleSelect?.value || 'casual';

    const button = this.shadowRoot.querySelector('#btn-rephrase') as HTMLButtonElement;
    const resultContainer = this.shadowRoot.querySelector('#rephrase-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#rephrase-text') as HTMLElement;

    try {
      this.showLoading(button, resultContainer, resultText);

      const result = await this.rephraser.rephraseWithStream(
        selectedText, 
        { style: style as 'casual' | 'formal' | 'professional' | 'friendly' | 'academic' },
        (chunk: string) => {
          if (resultText) {
            resultText.textContent += chunk;
          }
        }
      );
      
      this.showResult(resultContainer, resultText, result.rephrasedText);
      await this.saveToHistory(selectedText, result);
    } catch (error) {
      console.error('Rephrase error:', error);
      const base = t('errors.rephraseFailed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const reason = t('errors.withReason', { reason: errorMessage });
      this.showError(`${base}. ${reason}`);
    } finally {
      this.restoreButton(button);
    }
  }

  private async saveToHistory(originalText: string, result: RephraserResult): Promise<void> {
    try {
      await this.storageService.saveToHistory({
        type: 'rephrase',
        prompt: originalText,
        response: result.rephrasedText,
        metadata: {
          style: result.style,
          originalLength: result.originalLength,
          rephrasedLength: result.rephrasedLength,
          lengthDelta: result.lengthDelta
        }
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  public updateServices(geminiService: GeminiService | null): void {
    this.geminiService = geminiService;
    this.rephraser = geminiService ? new Rephraser(geminiService) : null;
  }

  private showLoading(button: HTMLButtonElement, resultContainer: HTMLElement, resultText: HTMLElement): void {
    button.disabled = true;
    button.textContent = t('status.rephrasing');
    resultContainer.hidden = false;
    resultText.textContent = t('status.rephrasing');
    resultText.className = 'result-text loading';
  }

  private showResult(resultContainer: HTMLElement, resultText: HTMLElement, text: string): void {
    resultText.textContent = text;
    resultText.className = 'result-text';
    resultContainer.hidden = false;
    
    // Dispatch event для показа кнопки Favorites
    const event = new CustomEvent('resultReady', { 
      detail: { type: 'rephrase' },
      bubbles: true,
      composed: true // Проходит через Shadow DOM
    });
    this.shadowRoot.dispatchEvent(event);
  }

  private showError(message: string): void {
    const resultContainer = this.shadowRoot.querySelector('#rephrase-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#rephrase-text') as HTMLElement;
    
    if (resultContainer && resultText) {
      resultText.textContent = message;
      resultText.className = 'result-text error';
      resultContainer.hidden = false;
    }
  }

  private restoreButton(button: HTMLButtonElement): void {
    button.disabled = false;
    button.textContent = t('common.rephrase');
  }
}
