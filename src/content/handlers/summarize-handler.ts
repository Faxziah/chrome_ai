import { GeminiService } from '../../services/gemini-api';
import { StorageService } from '../../services/storage';
import { Summarizer } from '../../components/summarizer';
import { SummarizerResult } from '../../types';
import { t } from '../../utils/i18n';

export class SummarizeHandler {
  private geminiService: GeminiService | null;
  private storageService: StorageService;
  private summarizer: Summarizer | null;
  private shadowRoot: ShadowRoot;

  constructor(
    shadowRoot: ShadowRoot,
    geminiService: GeminiService | null,
    storageService: StorageService
  ) {
    this.shadowRoot = shadowRoot;
    this.geminiService = geminiService;
    this.storageService = storageService;
    this.summarizer = geminiService ? new Summarizer(geminiService, undefined, storageService) : null;
  }

  public async handleSummarize(selectedText: string): Promise<void> {
    if (!this.summarizer) {
      this.showError(t('api.missingKey'));
      return;
    }

    if (!selectedText.trim()) {
      this.showError(t('common.noTextSelected'));
      return;
    }

    const styleSelect = this.shadowRoot.querySelector('#summarize-style') as HTMLSelectElement;
    const style = styleSelect?.value || 'brief';

    const button = this.shadowRoot.querySelector('#btn-summarize') as HTMLButtonElement;
    const resultContainer = this.shadowRoot.querySelector('#summary-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#summary-text') as HTMLElement;

    try {
      this.showLoading(button, resultContainer, resultText);

      const result = await this.summarizer.summarizeWithStream(
        selectedText, 
        { style: style as 'brief' | 'detailed' | 'bullet-points' },
        (chunk: string) => {
          if (resultText) {
            resultText.textContent += chunk;
            resultText.className = 'result-text';
          }
        }
      );
      
      this.showResult(resultContainer, resultText, result.summary);
      await this.saveToHistory(selectedText, result);
    } catch (error) {
      console.error('Summarize error:', error);
      const base = t('errors.summarizeFailed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const reason = t('errors.withReason', { reason: errorMessage });
      this.showError(`${base}. ${reason}`);
    } finally {
      this.restoreButton(button);
    }
  }

  private async saveToHistory(originalText: string, result: SummarizerResult): Promise<void> {
    try {
      await this.storageService.saveToHistory({
        type: 'summarize',
        prompt: originalText,
        response: result.summary,
        metadata: {
          style: 'brief',
          originalLength: result.originalLength,
          summaryLength: result.summaryLength,
          compressionRatio: result.compressionRatio
        }
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  public updateServices(geminiService: GeminiService | null): void {
    this.geminiService = geminiService;
    this.summarizer = geminiService ? new Summarizer(geminiService, undefined, this.storageService) : null;
  }

  private showLoading(button: HTMLButtonElement, resultContainer: HTMLElement, resultText: HTMLElement): void {
    button.disabled = true;
    button.textContent = t('status.summarizing');
    resultContainer.hidden = false;
    resultText.textContent = t('status.summarizing');
    resultText.className = 'result-text loading';
  }

  private showResult(resultContainer: HTMLElement, resultText: HTMLElement, text: string): void {
    resultText.textContent = text;
    resultText.className = 'result-text';
    resultContainer.hidden = false;
  }

  private showError(message: string): void {
    const resultContainer = this.shadowRoot.querySelector('#summary-result') as HTMLElement;
    const resultText = this.shadowRoot.querySelector('#summary-text') as HTMLElement;
    
    if (resultContainer && resultText) {
      resultText.textContent = message;
      resultText.className = 'result-text error';
      resultContainer.hidden = false;
    }
  }

  private restoreButton(button: HTMLButtonElement): void {
    button.disabled = false;
    button.textContent = t('common.summarize');
  }
}
