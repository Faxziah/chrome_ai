import { PopupUI } from './popup-ui';
import { GeminiService } from '../services/gemini-api';
import { StorageService } from '../services/storage';
import { Rephraser } from '../components/rephraser';
import { RephraserConfig, RephraserResult, HistoryItem } from '../types';

export class PopupIntegration {
  private popupUI: PopupUI;
  private geminiService: GeminiService | null = null;
  private storageService: StorageService;
  private rephraser: Rephraser | null = null;
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
      } else {
        console.warn('API key not found. User needs to configure in options.');
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

  public destroy(): void {
    this.geminiService = null;
    this.rephraser = null;
  }
}
