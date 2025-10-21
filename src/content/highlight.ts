import { GeminiService } from '../services';
import { StorageService } from '../services';
import { jsonrepair } from 'jsonrepair';
import { t } from '../utils/i18n';

export interface HighlightData {
  sentences: string[];
}

export class HighlightManager {
  private geminiService: GeminiService;
  private storageService: StorageService;
  private highlightedElements: Set<HTMLElement> = new Set();
  private originalTexts: Map<HTMLElement, string> = new Map();
  private clearButton: HTMLElement | null = null;

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
    try {
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
        this.showHighlightError(t('errors.noKeywordsFound'));
        return;
      }

      this.applyHighlights(highlightData);
      this.showClearButton();
    } catch (error) {
      console.error('Error highlighting keywords:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.highlightFailed');
      this.showHighlightError(errorMessage);
    }
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
    const prompt = `Identify the most important sentences in this text. Return ONLY a JSON object with format: {"sentences": ["sentence1", "sentence2"]}
    
    Text: ${text.substring(0, 4000)}`;


    try {
      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      console.error('test', 123)
      const response = await this.geminiService.generateContent(prompt, {
        model: apiConfig?.model || 'gemini-2.5-flash',
        temperature: apiConfig?.temperature || 0.7,
        maxTokens: apiConfig?.maxTokens || 2048
      });
      
      if (!response.text || response.text.trim() === '') {
        throw new Error(t('errors.emptyResponse'));
      }

      console.error('response', response)
      const parsedTextRegExpMatchArray: RegExpMatchArray | null = response.text.match(/```json\s*([\s\S]*?)\s*```/);
      const parsedText = parsedTextRegExpMatchArray ? parsedTextRegExpMatchArray[1].trim() : '';
      const data: any = jsonrepair(parsedText)

      return { sentences: data.sentences || [] }

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw error;
    }
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
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          return searchTexts.some(searchText => 
            text.toLowerCase().includes(searchText.toLowerCase())
          ) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    const combinedRegex = this.buildCombinedRegex(searchTexts);
    if (!combinedRegex) {
      return;
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (!parent || this.shouldSkipElement(parent)) {
        return;
      }

      this.replaceTextWithCombinedHighlight(textNode, combinedRegex, parent);
    });
  }

  private buildCombinedRegex(searchTexts: string[]): RegExp | null {
    if (searchTexts.length === 0) {
      return null;
    }

    const escapedTexts = searchTexts.map(text => this.escapeRegExp(text));
    const pattern = `(${escapedTexts.join('|')})`;
    return new RegExp(pattern, 'gi');
  }

  private shouldSkipElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'script' || tagName === 'style') {
      return true;
    }

    const blacklistSelectors = [
      'a', 'button', 'input', 'textarea', 'select', 
      'code', 'pre', 'svg', 'math', '[contenteditable]'
    ];

    return blacklistSelectors.some(selector => {
      if (selector.startsWith('[')) {
        return element.hasAttribute(selector.slice(1, -1));
      }
      return element.matches(selector) || element.closest(selector) !== null;
    });
  }

  private replaceTextWithCombinedHighlight(textNode: Text, regex: RegExp, parent: Element): void {
    const text = textNode.textContent || '';
    let match;
    let lastIndex = 0;
    const fragment = document.createDocumentFragment();

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }

      const mark = document.createElement('mark');
      mark.className = 'ai-highlight';
      mark.textContent = match[1];
      this.highlightedElements.add(mark);
      fragment.appendChild(mark);

      lastIndex = match.index + match[1].length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    if (fragment.hasChildNodes()) {
      parent.replaceChild(fragment, textNode);
      parent.normalize();
    }
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  clearHighlights(): void {
    this.highlightedElements.forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        const textNode = document.createTextNode(element.textContent || '');
        parent.replaceChild(textNode, element);
        parent.normalize();
      }
    });
    
    this.highlightedElements.clear();
    this.originalTexts.clear();
    this.hideClearButton();
  }

  private showClearButton(): void {
    if (this.clearButton) return;
    
    this.clearButton = document.createElement('button');
    this.clearButton.className = 'ai-highlight-clear-btn';
    this.clearButton.textContent = t('highlight.clearButton');
    this.clearButton.title = t('highlight.clearButtonTitle');
    
    this.clearButton.addEventListener('click', () => {
      this.clearHighlights();
    });
    
    document.body.appendChild(this.clearButton);
  }

  private hideClearButton(): void {
    if (this.clearButton) {
      this.clearButton.remove();
      this.clearButton = null;
    }
  }

  isHighlighted(): boolean {
    return this.highlightedElements.size > 0;
  }

  getHighlightCount(): number {
    return this.highlightedElements.size;
  }

  private showHighlightError(message: string): void {
    // Создать стилизованный toast для ошибок highlight
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
