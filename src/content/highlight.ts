import { GeminiService } from '../services';
import { StorageService } from '../services';
import { jsonrepair } from 'jsonrepair';
import { t } from '../utils/i18n';
import { HighlightState } from './highlight-state';
import { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../types';

export interface HighlightData {
  sentences: string[];
}

interface TextMapping {
  fullText: string;
  mappings: NodeMapping[];
}

interface NodeMapping {
  node: Text;
  start: number;
  end: number;
  text: string;
}

interface TextMatch {
  start: number;
  end: number;
  text: string;
}

interface AffectedNode {
  node: Text;
  startInNode: number;
  endInNode: number;
  startInMatch: number;
  endInMatch: number;
}

export class HighlightManager {
  private geminiService: GeminiService;
  private storageService: StorageService;
  private highlightedElements: Set<HTMLElement> = new Set();
  private originalTexts: Map<HTMLElement, string> = new Map();

  constructor() {
    this.geminiService = new GeminiService();
    this.storageService = new StorageService();
    
    // Only load styles if we're in a browser environment
    if (typeof document !== 'undefined') {
      this.loadStyles();
    }
  }

  private loadStyles(): void {
    if (document.getElementById('ai-highlight-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'ai-highlight-styles';
    link.rel = 'stylesheet';
    
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      link.href = chrome.runtime.getURL('styles/highlight.css');
    } else {
      // Fallback for web context - use relative path
      link.href = 'styles/highlight.css';
    }
    
    document.head.appendChild(link);
  }

  async initialize(): Promise<void> {
    const apiKey = await this.storageService.getApiKey();
    if (apiKey) {
      this.geminiService.setApiKey(apiKey);
    }
  }

  async highlightKeywords(): Promise<void> {
    if (!this.geminiService.isInitialized()) {
      this.showHighlightError(t('api.missingKey'));
      return;
    }

    const pageText = this.extractPageText();
    if (!pageText.trim()) {
      this.showHighlightError(t('errors.noTextFound'));
      return;
    }

    const highlightData = await this.getKeywordsFromGemini(pageText);

    if (highlightData.sentences.length === 0) {
      throw new Error(t('errors.noKeywordsFound'));
    }

    this.applyHighlights(highlightData);
    HighlightState.setHighlightState(true);
  }

  private extractPageText(): string {
    const semanticSelectors = 'p, li, article, section, h1, h2, h3, h4, h5, h6, blockquote';
    const textElements = document.querySelectorAll(semanticSelectors);
    const textParts: string[] = [];

    textElements.forEach(element => {
      if (!this.isElementVisible(element)) {
        return;
      }

      const text = element.textContent?.trim();
      if (text && text.length > 10) {
        textParts.push(text);
      }
    });

    const uniqueTexts = this.deduplicateTexts(textParts);
    return uniqueTexts.join(' ').substring(0, 4000);
  }

  private isElementVisible(element: Element): boolean {
    const htmlElement = element as HTMLElement;
    if (htmlElement.offsetParent === null) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    return computedStyle.display !== 'none' && 
           computedStyle.visibility !== 'hidden' &&
           computedStyle.opacity !== '0';
  }

  private deduplicateTexts(texts: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const text of texts) {
      const normalized = text.toLowerCase().trim();
      if (!seen.has(normalized) && normalized.length > 10) {
        seen.add(normalized);
        result.push(text);
      }
    }

    return result;
  }

  private async getKeywordsFromGemini(text: string): Promise<HighlightData> {
    const maxAttempts = 4;
    let lastResponseText = '';

    let prompt = `- Identify the most important sentences in this text. 
- Return ONLY a JSON object with format: {"sentences": ["sentence1", "sentence2"]}
- Copy sentences EXACTLY as they appear in the original text
- Preserve all superscript numbers like [1], [2], [3], punctuation, dashes, and special characters, etc.
- Do not paraphrase, summarize, or modify the text
- Do not remove any elements from the original sentences

Text: ${text.substring(0, 10000)}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          prompt = `\n\nIMPORTANT: Your previous response was invalid JSON or empty. Please fix it.\nPrevious response: "${lastResponseText}"\n\nPlease return ONLY valid JSON in the correct format.` + prompt;
        }

        const apiConfig = await this.storageService.getApiConfig();
        const response = await this.geminiService.generateText(prompt, {
          ...GeminiService.getApiConfig(apiConfig),
          temperature: apiConfig?.temperature || DEFAULT_TEMPERATURE,
          maxTokens: apiConfig?.maxTokens || DEFAULT_MAX_TOKENS
        });

        lastResponseText = response.text.trim() || '';

        if (!lastResponseText) {
          if (attempt === maxAttempts) {
            throw new Error(t('errors.emptyResponse'));
          }
          continue;
        }

        const parsedTextRegExpMatchArray: RegExpMatchArray | null = lastResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        const parsedText = parsedTextRegExpMatchArray ? parsedTextRegExpMatchArray[1].trim() : '';

        let dataString: string = '';
        try {
          dataString = jsonrepair(parsedText);
        } catch (error) {
          if (attempt === maxAttempts) {
            throw error;
          }
          continue;
        }

        const data = JSON.parse(dataString);
        if (!data) {
          if (attempt === maxAttempts) {
            throw new Error(`Failed to parse JSON`);
          }
          continue;
        }

        return { sentences: data.sentences || [] }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    throw new Error('Unexpected error: all attempts exhausted');
  }

  private applyHighlights(highlightData: HighlightData): void {
    this.clearHighlights();

    const uniqueTexts = [...new Set(highlightData.sentences.filter(text => text.trim()))];
    if (uniqueTexts.length === 0) {
      return;
    }

    this.highlightTexts(uniqueTexts);
  }

  private highlightTexts(searchTexts: string[]): void {
    this.removeExistingHighlights();

    searchTexts.forEach(sentence => {
      const elements = document.querySelectorAll('p, li, article, section, h1, h2, h3, h4, h5, h6, blockquote');

      elements.forEach(element => {
        const elementText = element.textContent || '';
        const normalizedElementText = this.normalizeText(elementText);
        const normalizedSentence = this.normalizeText(sentence);

        if (normalizedElementText.includes(normalizedSentence)) {
          const htmlElement = element as HTMLElement;

          htmlElement.classList.add('ai-highlight');
          this.highlightedElements.add(element as HTMLElement);
        }
        });
      });
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\u00A0/g, ' ')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private removeExistingHighlights(): void {
    const existingHighlights = document.querySelectorAll('mark.search-highlight');
    existingHighlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (!parent) return;

      const textNode = document.createTextNode(highlight.textContent || '');
      parent.replaceChild(textNode, highlight);
    });
  }

  clearHighlights(): void {
    this.highlightedElements.forEach(element => {
      element.classList.remove('ai-highlight');
    });

    this.highlightedElements.clear();
    this.originalTexts.clear();
    HighlightState.setHighlightState(false);
  }

  private showHighlightError(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'ai-highlight-error-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d93025;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 2147483647;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

export const highlightManager = new HighlightManager();
