import { SpeechSynthesisManager } from '../speech-utils';
import { TranslatorResult } from '../../types';

export class SpeechHandler {
  private speechManager: SpeechSynthesisManager | null;
  private shadowRoot: ShadowRoot;

  constructor(
    shadowRoot: ShadowRoot,
    speechManager: SpeechSynthesisManager | null
  ) {
    this.shadowRoot = shadowRoot;
    this.speechManager = speechManager;
  }

  public async handleSpeak(
    type: 'source' | 'translation',
    translationData: { result: TranslatorResult | null, originalText: string | null }
  ): Promise<void> {
    if (!this.speechManager || !this.speechManager.isSupported()) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    try {
      this.speechManager.stop();

      let text: string;
      let languageCode: string;

      if (type === 'source') {
        text = translationData.originalText || '';
        languageCode = translationData.result?.sourceLanguage || translationData.result?.detectedLanguage || 'en';
      } else {
        text = translationData.result?.translatedText || '';
        languageCode = translationData.result?.targetLanguage || 'en';
      }

      if (!text.trim()) {
        alert('No text available to speak.');
        return;
      }

      await this.speechManager.speak({ text, languageCode });
    } catch (error) {
      console.error('Speech synthesis error:', error);
      alert(`Failed to speak text: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
}
