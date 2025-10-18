import { SpeechConfig, VoiceInfo } from '../types';

export class SpeechSynthesisManager {
  private synthesis: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[];
  private isInitialized: boolean;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.voices = [];
      this.loadVoices();
      
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });
      
      this.isInitialized = true;
    } else {
      this.synthesis = null;
      this.voices = [];
      this.isInitialized = false;
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
    this.voices.sort((a, b) => {
      if (a.localService !== b.localService) {
        return a.localService ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log('Loaded voices:', this.voices.length);
  }

  isSupported(): boolean {
    return this.synthesis !== null && this.isInitialized;
  }

  getAvailableVoices(): VoiceInfo[] {
    return this.voices.map(voice => ({
      voice,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService
    }));
  }

  getVoicesForLanguage(languageCode: string): VoiceInfo[] {
    const localeCode = this.getLocaleCode(languageCode);
    
    let matchingVoices = this.voices.filter(v => v.lang === localeCode);
    
    if (matchingVoices.length === 0) {
      matchingVoices = this.voices.filter(v => v.lang.startsWith(languageCode));
    }
    
    return matchingVoices.map(voice => ({
      voice,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService
    }));
  }

  async speak(config: SpeechConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(config.text);
      const localeCode = this.getLocaleCode(config.languageCode);
      
      utterance.lang = localeCode;
      utterance.rate = config.rate || 1.0;
      utterance.pitch = config.pitch || 1.0;
      utterance.volume = config.volume || 1.0;

      const voice = this.findBestVoice(localeCode);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error('Speech synthesis error: ' + e.error));

      this.synthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }

  private getLocaleCode(languageCode: string): string {
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'ru': 'ru-RU',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'it': 'it-IT',
      'pt': 'pt-BR'
    };

    return localeMap[languageCode] || `${languageCode}-${languageCode.toUpperCase()}`;
  }

  private findBestVoice(localeCode: string): SpeechSynthesisVoice | null {
    let matchingVoices = this.voices.filter(v => v.lang === localeCode);
    
    if (matchingVoices.length === 0) {
      const languagePrefix = localeCode.split('-')[0];
      matchingVoices = this.voices.filter(v => v.lang.startsWith(languagePrefix));
    }
    
    if (matchingVoices.length === 0) {
      return null;
    }

    const localVoices = matchingVoices.filter(v => v.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    return matchingVoices[0];
  }
}

export function createSpeechManager(): SpeechSynthesisManager {
  return new SpeechSynthesisManager();
}

