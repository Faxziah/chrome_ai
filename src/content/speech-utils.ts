import { SpeechConfig, VoiceInfo } from '../types';

export class SpeechSynthesisManager {
  private readonly synthesis: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[];
  private readonly isInitialized: boolean;

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

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
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


  isLanguageSupportedForSpeech(code: string): boolean {
    const supportedLanguages = [
      'en', 'ru', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'it', 'pt',
      'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no',
      'fi', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv',
      'lt', 'el', 'he', 'fa', 'ur', 'bn', 'ta', 'te', 'ml', 'kn',
      'gu', 'pa', 'mr', 'ne', 'si', 'my', 'km', 'lo', 'ka', 'am',
      'sw', 'zu', 'af', 'sq', 'az', 'be', 'bs', 'ca', 'cy', 'eu',
      'gl', 'is', 'ga', 'mk', 'mt', 'sr', 'uk'
    ];
    
    return supportedLanguages.includes(code);
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
      utterance.onerror = (e) => {
        const errorMessage = `Speech synthesis error: ${e.error}`;
        reject(new Error(errorMessage));
      };

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
      'pt': 'pt-BR',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'tr': 'tr-TR',
      'pl': 'pl-PL',
      'nl': 'nl-NL',
      'sv': 'sv-SE',
      'da': 'da-DK',
      'no': 'no-NO',
      'fi': 'fi-FI',
      'cs': 'cs-CZ',
      'hu': 'hu-HU',
      'ro': 'ro-RO',
      'bg': 'bg-BG',
      'hr': 'hr-HR',
      'sk': 'sk-SK',
      'sl': 'sl-SI',
      'et': 'et-EE',
      'lv': 'lv-LV',
      'lt': 'lt-LT',
      'el': 'el-GR',
      'he': 'he-IL',
      'fa': 'fa-IR',
      'ur': 'ur-PK',
      'bn': 'bn-BD',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'ml': 'ml-IN',
      'kn': 'kn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'mr': 'mr-IN',
      'ne': 'ne-NP',
      'si': 'si-LK',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'ka': 'ka-GE',
      'am': 'am-ET',
      'sw': 'sw-KE',
      'zu': 'zu-ZA',
      'af': 'af-ZA',
      'sq': 'sq-AL',
      'az': 'az-AZ',
      'be': 'be-BY',
      'bs': 'bs-BA',
      'ca': 'ca-ES',
      'cy': 'cy-GB',
      'eu': 'eu-ES',
      'gl': 'gl-ES',
      'is': 'is-IS',
      'ga': 'ga-IE',
      'mk': 'mk-MK',
      'mt': 'mt-MT',
      'sr': 'sr-RS',
      'uk': 'uk-UA'
    };

    return localeMap[languageCode] || `${languageCode}-${languageCode.toUpperCase()}`;
  }

  private isHighQualityVoice(voice: SpeechSynthesisVoice): boolean {
    const highQualityProviders = ['Google', 'Microsoft', 'Apple', 'Amazon', 'IBM'];
    return highQualityProviders.some(provider => 
      voice.name.includes(provider)
    );
  }

  private findBestVoice(localeCode: string): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      return null;
    }

    const languageCode = localeCode.split('-')[0];
    
    const matchingVoices = this.voices.filter(voice => 
      voice.lang === localeCode || voice.lang.startsWith(languageCode)
    );

    if (matchingVoices.length === 0) {
      return null;
    }

    const highQualityLocalExactMatch = matchingVoices.find(v => 
      v.localService && v.lang === localeCode && this.isHighQualityVoice(v)
    );
    if (highQualityLocalExactMatch) return highQualityLocalExactMatch;

    const highQualityLocalMatch = matchingVoices.find(v => 
      v.localService && v.lang.startsWith(languageCode) && this.isHighQualityVoice(v)
    );
    if (highQualityLocalMatch) return highQualityLocalMatch;

    const highQualityOnlineExactMatch = matchingVoices.find(v => 
      !v.localService && v.lang === localeCode && this.isHighQualityVoice(v)
    );
    if (highQualityOnlineExactMatch) return highQualityOnlineExactMatch;

    const highQualityOnlineMatch = matchingVoices.find(v => 
      !v.localService && v.lang.startsWith(languageCode) && this.isHighQualityVoice(v)
    );
    if (highQualityOnlineMatch) return highQualityOnlineMatch;

    const localExactMatch = matchingVoices.find(v => 
      v.localService && v.lang === localeCode
    );
    if (localExactMatch) return localExactMatch;

    const localMatch = matchingVoices.find(v => 
      v.localService && v.lang.startsWith(languageCode)
    );
    if (localMatch) return localMatch;

    const onlineExactMatch = matchingVoices.find(v => 
      !v.localService && v.lang === localeCode
    );
    if (onlineExactMatch) return onlineExactMatch;

    return matchingVoices[0];
  }

  public hasVoiceForLanguage(languageCode: string): boolean {
    if (!this.isSupported() || !this.voices || this.voices.length === 0) {
      return false;
    }

    const localeCode = this.getLocaleCode(languageCode);
    const voice = this.findBestVoice(localeCode);
    return voice !== null;
  }
}

export function createSpeechManager(): SpeechSynthesisManager {
  return new SpeechSynthesisManager();
}

