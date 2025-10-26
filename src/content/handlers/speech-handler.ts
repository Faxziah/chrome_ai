import { SpeechSynthesisManager } from '../speech-utils';
import { TranslatorResult } from '../../types';
import { StorageService } from '../../services/storage';

export class SpeechHandler {
  private speechManager: SpeechSynthesisManager | null;
  private shadowRoot: ShadowRoot;
  private storageService: StorageService;

  constructor(
    shadowRoot: ShadowRoot,
    speechManager: SpeechSynthesisManager | null,
    storageService?: StorageService
  ) {
    this.shadowRoot = shadowRoot;
    this.speechManager = speechManager;
    this.storageService = storageService || new StorageService();
  }

  public async handleSpeak(
    type: 'source' | 'translation',
    translationData: { result: TranslatorResult | null, originalText: string | null }
  ): Promise<void> {
    if (!this.speechManager || !this.speechManager.isSupported()) {
      this.showToast('Speech synthesis is not supported in this browser.', 'error');
      return;
    }

    try {
      if (!this.speechManager || !this.speechManager.isSupported()) {
        this.showSpeechError('Speech synthesis is not supported in your browser.');
        return;
      }
      
      this.speechManager.stop();

      let text: string;
      let languageCode: string;

      if (type === 'source') {
        text = translationData.originalText || '';
        // Get language from Shadow DOM if no translation data
        if (!translationData.result) {
          const sourceLang = (this.shadowRoot.querySelector('#source-language') as HTMLSelectElement)?.value || 'en';
          if (sourceLang === 'auto') {
            // Use fallback language from settings or default to 'en'
            const fallbackLang = await this.storageService.getLanguage() || 'en';
            languageCode = fallbackLang;
          } else {
            languageCode = sourceLang;
          }
        } else {
          languageCode = translationData.result?.sourceLanguage || translationData.result?.detectedLanguage || 'en';
        }
      } else {
        text = translationData.result?.translatedText || '';
        languageCode = translationData.result?.targetLanguage || 'en';
      }

      if (!text.trim()) {
        this.showToast('No text available to speak.', 'error');
        return;
      }

      await this.speechManager.speak({ text, languageCode });
      
    } catch (error: any) {
      console.error('Speech synthesis error:', error);
      
      let errorMessage = 'Failed to play text. ';
      
      if (error.message?.includes('not-allowed')) {
        errorMessage += 'Browser blocked audio playback. Allow audio access.';
      } else if (error.message?.includes('network')) {
        errorMessage += 'Network error. Check your internet connection.';
      } else if (error.message?.includes('synthesis-unavailable')) {
        errorMessage += 'Voice for this language is not available.';
      } else {
        errorMessage += error.message || 'Unknown error.';
      }
      
      this.showSpeechError(errorMessage);
    }
  }

  public stop(): void {
    if (this.speechManager) {
      this.speechManager.stop();
    }
  }

  public isSupported(): boolean {
    return this.speechManager?.isSupported() || false;
  }

  private showToast(message: string, type: 'error' | 'success' = 'error'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    this.shadowRoot.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  private showSpeechError(message: string): void {
    if (!this.shadowRoot) return;
    
    let errorContainer = this.shadowRoot.querySelector('.speech-error-container') as HTMLElement;
    
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'speech-error-container';
      errorContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #d93025;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        animation: slideIn 0.3s ease;
      `;
      this.shadowRoot.appendChild(errorContainer);
    }
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}
