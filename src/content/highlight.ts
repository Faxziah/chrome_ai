import { GeminiService } from '../services';
import { StorageService } from '../services';
import { jsonrepair } from 'jsonrepair';
import { t } from '../utils/i18n';

export interface HighlightData {
  sentences: string[];
}

interface TextMapping {
  fullText: string;
  mappings: NodeMapping[];
}

interface NodeMapping {
  node: Text;
  start: number;  // Позиция в полном тексте
  end: number;    // Позиция в полном тексте
  text: string;
}

interface TextMatch {
  start: number;
  end: number;
  text: string;
}

interface AffectedNode {
  node: Text;
  startInNode: number;  // Начало выделения в узле
  endInNode: number;    // Конец выделения в узле
  startInMatch: number; // Позиция в исходном совпадении
  endInMatch: number;   // Позиция в исходном совпадении
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

  private highlightAcrossNodes(affectedNodes: AffectedNode[], matchText: string): void {
    // Сортируем узлы по позиции в совпадении
    affectedNodes.sort((a, b) => a.startInMatch - b.startInMatch);

    // Выделяем каждый затронутый узел
    affectedNodes.forEach(affected => {
      this.highlightInSingleNode(
        affected.node,
        affected.startInNode,
        affected.endInNode
      );
    });
  }

  private highlightInSingleNode(node: Text, start: number, end: number): void {
    const text = node.textContent || '';
    if (start >= end || start >= text.length) {
      return;
    }

    const before = text.substring(0, start);
    const highlighted = text.substring(start, end);
    const after = text.substring(end);

    const parent = node.parentNode;
    if (!parent) return;

    // Создаем новые узлы
    const beforeNode = document.createTextNode(before);
    const highlightNode = document.createElement('mark');
    highlightNode.className = 'search-highlight'; // Добавляем класс для стилизации
    highlightNode.textContent = highlighted;
    const afterNode = document.createTextNode(after);

    // Заменяем исходный узел
    parent.insertBefore(beforeNode, node);
    parent.insertBefore(highlightNode, node);
    parent.insertBefore(afterNode, node);
    parent.removeChild(node);
  }

  private getAllTextNodes(): Text[] {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || this.shouldSkipElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    return textNodes;
  }

  private shouldSkipElement(element: Element): boolean {
    // Пропускаем определенные элементы (скрипты, стили и т.д.)
    const tagName = element.tagName.toLowerCase();
    const skipTags = ['script', 'style', 'noscript', 'meta', 'link'];

    if (skipTags.includes(tagName)) {
      return true;
    }

    // Можно добавить дополнительные проверки
    if (element.classList.contains('no-highlight')) {
      return true;
    }

    return false;
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
      const dataString: any = jsonrepair(parsedText)
      const data = JSON.parse(dataString)

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
    console.log('Ищем предложения:', searchTexts);

    this.removeExistingHighlights();

    // Для каждого предложения отдельно находим и выделяем
    searchTexts.forEach(sentence => {
      // Каждый раз пересобираем текстовые узлы, так как DOM мог измениться
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      const currentTextNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        currentTextNodes.push(node as Text);
      }

      this.highlightSentenceInTextNodes(sentence, currentTextNodes);
    });
  }

  private highlightSentenceInTextNodes(sentence: string, textNodes: Text[]): void {
    const normalizedSentence = this.normalizeText(sentence);

    textNodes.forEach(textNode => {
      const nodeText = textNode.textContent || '';
      const normalizedNodeText = this.normalizeText(nodeText);

      // Ищем предложение в тексте узла
      if (normalizedNodeText.includes(normalizedSentence)) {
        this.highlightInNode(textNode, normalizedSentence, nodeText);
      }
    });
  }

  private highlightInNode(textNode: Text, searchText: string, originalText: string): void {
    const normalizedOriginal = this.normalizeText(originalText);
    const normalizedSearch = this.normalizeText(searchText);
    
    // Находим все вхождения предложения
    const matches: { start: number; end: number }[] = [];
    let startIndex = 0;
    
    while (true) {
      const index = normalizedOriginal.indexOf(normalizedSearch, startIndex);
      if (index === -1) break;
      
      matches.push({
        start: index,
        end: index + normalizedSearch.length
      });
      
      startIndex = index + 1;
    }

    if (matches.length === 0) return;

    // Выделяем все найденные вхождения
    this.highlightAllMatchesInNode(textNode, originalText, matches, normalizedSearch);
  }

  private highlightAllMatchesInNode(textNode: Text, originalText: string, matches: { start: number; end: number }[], searchText: string): void {
    const parent = textNode.parentNode;
    if (!parent) return;

    // Сортируем совпадения по позиции (от конца к началу, чтобы не сбивать индексы)
    const sortedMatches = matches.sort((a, b) => b.start - a.start);
    
    let currentText = originalText;
    
    // Обрабатываем совпадения от конца к началу
    sortedMatches.forEach(match => {
      const before = currentText.substring(0, match.start);
      const highlighted = currentText.substring(match.start, match.end);
      const after = currentText.substring(match.end);
      
      // Создаем новые узлы
      const beforeNode = document.createTextNode(before);
      const highlightNode = document.createElement('mark');
      highlightNode.className = 'search-highlight';
      highlightNode.textContent = highlighted;
      const afterNode = document.createTextNode(after);
      
      // Заменяем текущий текстовый узел
      if (currentText === originalText) {
        // Первое совпадение - заменяем исходный узел
        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(highlightNode, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);
      } else {
        // Последующие совпадения - работаем с фрагментом
        const fragment = document.createDocumentFragment();
        fragment.appendChild(beforeNode);
        fragment.appendChild(highlightNode);
        fragment.appendChild(afterNode);
        
        // Находим и заменяем соответствующий текстовый узел
        const textNodes = Array.from(parent.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const targetNode = textNodes.find(node => node.textContent === currentText);
        if (targetNode) {
          parent.replaceChild(fragment, targetNode);
        }
      }
      
      // Обновляем текущий текст для следующей итерации
      currentText = before + after;
    });
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\u00A0/g, ' ')      // неразрывный пробел -> обычный
      .replace(/[\u2013\u2014]/g, '-') // тире -> дефис
      .replace(/\s+/g, ' ')         // множественные пробелы -> один
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

  private createTextMapping(textNodes: Text[]): TextMapping {
    let fullText = '';
    const mappings: NodeMapping[] = [];

    textNodes.forEach((node, index) => {
      const nodeText = node.textContent || '';
      const start = fullText.length;
      const end = start + nodeText.length;

      mappings.push({
        node: node,
        start: start,
        end: end,
        text: nodeText
      });

      fullText += nodeText;
    });

    return { fullText, mappings };
  }

  private highlightMatchesInMapping(mapping: TextMapping, regex: RegExp): void {
    const matches: TextMatch[] = [];
    let match;

    // Ищем все совпадения в полном тексте
    while ((match = regex.exec(mapping.fullText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });

      // Избегаем бесконечного цикла
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    console.log('Matches found:', matches.length);

    // Выделяем каждое совпадение
    matches.forEach(matchInfo => {
      this.highlightMatchInMapping(mapping, matchInfo);
    });
  }

  private highlightMatchInMapping(mapping: TextMapping, match: TextMatch): void {
    const affectedNodes: AffectedNode[] = [];

    // Находим все узлы, которые затрагивает это совпадение
    mapping.mappings.forEach(nodeMapping => {
      const overlapStart = Math.max(match.start, nodeMapping.start);
      const overlapEnd = Math.min(match.end, nodeMapping.end);

      if (overlapStart < overlapEnd) {
        // Совпадение частично или полностью в этом узле
        const nodeStartInMatch = overlapStart - nodeMapping.start;
        const nodeEndInMatch = overlapEnd - nodeMapping.start;

        affectedNodes.push({
          node: nodeMapping.node,
          startInNode: nodeStartInMatch,
          endInNode: nodeEndInMatch,
          startInMatch: overlapStart - match.start,
          endInMatch: overlapEnd - match.start
        });
      }
    });

    // Выделяем совпадение во всех затронутых узлах
    this.highlightAcrossNodes(affectedNodes, match.text);
  }

  private buildCombinedRegex(searchTexts: string[]): RegExp | null {
    if (searchTexts.length === 0) {
      return null;
    }

    const escapedTexts = searchTexts.map(text => this.escapeRegExp(text));
    const pattern = `(${escapedTexts.join('|')})`;
    return new RegExp(pattern, 'gi');
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
