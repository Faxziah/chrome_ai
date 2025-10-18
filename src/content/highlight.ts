import { GeminiService } from '../services';
import { StorageService } from '../services';
// @ts-ignore
import { repairJSON } from 'json-repair-js';

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
    this.loadStyles();
  }

  private loadStyles(): void {
    if (document.getElementById('ai-highlight-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'ai-highlight-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/highlight.css');
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
        console.log('GeminiService not initialized. Please set API key in options.');
        return;
      }

      const pageText = this.extractPageText();
      if (!pageText.trim()) {
        console.warn('No text found on page to highlight');
        return;
      }

      const highlightData = await this.getKeywordsFromGemini(pageText);
      this.applyHighlights(highlightData);
      this.showClearButton();
    } catch (error) {
      console.error('Error highlighting keywords:', error);
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
      
      const response = await this.geminiService.generateContent(prompt, {
        model: apiConfig?.model || 'gemini-2.5-flash',
        temperature: apiConfig?.temperature || 0.7,
        maxTokens: apiConfig?.maxTokens || 2048
      });
      const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/) || response.text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        let jsonString = jsonMatch[1] || jsonMatch[0];
        
        try {
          // Попытка парсинга как есть
          const data = JSON.parse(jsonString);
          return { sentences: data.sentences || [] };
        } catch (error) {
          console.log('JSON parse failed, attempting repair...');
          try {
            // Используем json-repair для исправления
            const repairedJson = repairJSON(jsonString);
            const data = JSON.parse(repairedJson);
            return { sentences: data.sentences || [] };
          } catch (repairError) {
            console.error('JSON repair failed:', repairError);
            throw new Error('Failed to parse Gemini response even after repair');
          }
        }
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return { sentences: [] };
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
    this.clearButton.textContent = 'Clear highlights';
    this.clearButton.title = 'Remove all highlights from the page';
    
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
}

export const highlightManager = new HighlightManager();
