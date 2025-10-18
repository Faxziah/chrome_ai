import { Tabs } from '../components/tabs';

export class PopupUI {
  private hostElement: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private popupContainer: HTMLDivElement | null = null;
  private abortController: AbortController | null = null;
  private selectedText: string = '';
  private isVisible: boolean = false;
  private tabsComponent: Tabs | null = null;

  constructor() {
    this.createPopupStructure();
  }

  private createPopupStructure(): void {
    this.hostElement = document.createElement('div');
    this.hostElement.id = 'ai-text-tools-popup-host';
    this.hostElement.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
    `;

    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'popup-container';
    this.popupContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      transform: translate(-9999px, -9999px);
      max-width: 400px;
      min-width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      padding: 0;
      pointer-events: auto;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: #333;
      border: 1px solid rgba(0,0,0,0.1);
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --popup-bg: #ffffff;
        --popup-text: #202124;
        --popup-border: rgba(0, 0, 0, 0.12);
        --popup-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        --primary-color: #1a73e8;
        --primary-hover: #1557b0;
        --secondary-color: #5f6368;
        --border-radius: 12px;
        --transition-speed: 0.2s;
        --tab-height: 48px;
        --tab-padding-x: 16px;
        --indicator-thickness: 3px;
        --input-border: rgba(0, 0, 0, 0.24);
        --input-focus: var(--primary-color);
        --success-color: #1e8e3e;
        --error-color: #d93025;
        --spacing-xs: 4px;
        --spacing-sm: 8px;
        --spacing-md: 12px;
        --spacing-lg: 16px;
        --spacing-xl: 24px;
      }

      * {
        box-sizing: border-box;
      }

      .popup-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--popup-border);
      }

      .popup-body {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
      }

      .popup-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--popup-border);
      }

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color var(--transition-speed);
        background: var(--primary-color);
        color: white;
      }

      button:hover {
        background: var(--primary-hover);
      }

      button:active {
        transform: scale(0.98);
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: var(--secondary-color);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(10px); }
        to { transform: translateY(0); }
      }

      @media (max-width: 480px) {
        #popup-container {
          max-width: 90vw;
          min-width: 280px;
        }
        
        .popup-content {
          padding: 12px;
        }
      }

      .tabs {
        position: relative;
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-sm) 0;
        overflow-x: auto;
        scrollbar-width: none;
        border-bottom: 1px solid var(--popup-border);
      }

      .tabs::-webkit-scrollbar { display: none; }

      .tab {
        position: relative;
        appearance: none;
        background: transparent;
        border: 0;
        height: var(--tab-height);
        padding: 0 var(--tab-padding-x);
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--secondary-color);
        white-space: nowrap;
        cursor: pointer;
        font: 500 0.875rem/1.2 system-ui, -apple-system, sans-serif;
        transition: color var(--transition-speed);
        border-radius: 0;
      }

      .tab:hover {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }

      .tab:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }

      .tab.is-active {
        color: var(--primary-color);
      }

      .tabs__indicator {
        position: absolute;
        left: 0;
        bottom: 0;
        height: var(--indicator-thickness);
        width: 0;
        background: var(--primary-color);
        border-radius: 2px 2px 0 0;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tab-panel {
        padding: var(--spacing-lg);
        animation: fadeIn 0.2s ease;
      }

      .tab-panel[hidden] {
        display: none;
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .selected-text-display {
        padding: var(--spacing-md);
        background: color-mix(in srgb, var(--primary-color) 5%, transparent);
        border-left: 3px solid var(--primary-color);
        border-radius: 4px;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--popup-text);
        max-height: 120px;
        overflow-y: auto;
        word-wrap: break-word;
      }

      .select,
      .chat-input,
      textarea {
        width: 100%;
        padding: var(--spacing-md);
        border: 1px solid var(--input-border);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.875rem;
        color: var(--popup-text);
        background: var(--popup-bg);
        transition: border-color var(--transition-speed);
      }

      .select:focus,
      .chat-input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--input-focus);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .select {
        cursor: pointer;
        padding-right: var(--spacing-xl);
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%235f6368" d="M6 9L1 4h10z"/></svg>');
        background-repeat: no-repeat;
        background-position: right var(--spacing-md) center;
      }

      .chat-input {
        resize: vertical;
        min-height: 60px;
      }

      .btn {
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-speed);
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-content: center;
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
      }

      .btn-primary:hover {
        background: var(--primary-hover);
        box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
      }

      .btn-primary:active {
        transform: scale(0.98);
      }

      .btn-secondary {
        background: transparent;
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
      }

      .btn-secondary:hover {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }

      .btn-icon {
        padding: var(--spacing-sm);
        background: transparent;
        color: var(--secondary-color);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        min-width: 36px;
      }

      .btn-icon:hover {
        background: color-mix(in srgb, var(--secondary-color) 12%, transparent);
      }

      .btn:disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }

      .style-selector,
      .language-selector {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .language-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .language-row .select {
        flex: 1;
      }

      .result-container {
        padding: var(--spacing-md);
        background: color-mix(in srgb, var(--success-color) 5%, transparent);
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--success-color) 20%, transparent);
      }

      .result-container[hidden] {
        display: none;
      }

      .result-text.loading {
        color: var(--secondary-color);
        font-style: italic;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .result-text.loading::before {
        content: '';
        width: 16px;
        height: 16px;
        border: 2px solid var(--primary-color);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .result-text.error {
        color: var(--error-color);
        background: color-mix(in srgb, var(--error-color) 5%, transparent);
        padding: var(--spacing-md);
        border-radius: 4px;
        border-left: 3px solid var(--error-color);
      }

      .result-container.error {
        background: color-mix(in srgb, var(--error-color) 5%, transparent);
        border-color: color-mix(in srgb, var(--error-color) 20%, transparent);
      }

      .btn-secondary.copied {
        background: var(--success-color);
        color: white;
        border-color: var(--success-color);
        transition: all 0.3s ease;
      }

      .btn-secondary.copied:hover {
        background: color-mix(in srgb, var(--success-color) 90%, black);
      }

      .btn:disabled,
      .btn[disabled] {
        opacity: 0.38;
        cursor: not-allowed;
        pointer-events: none;
      }

      .result-text a {
        color: var(--primary-color);
        text-decoration: underline;
        cursor: pointer;
      }

      .result-text a:hover {
        color: var(--primary-hover);
      }

      .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
      }

      .result-label {
        font-weight: 500;
        color: var(--success-color);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .result-text {
        line-height: 1.6;
        color: var(--popup-text);
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .chat-container {
        margin-top: var(--spacing-md);
        border-top: 1px solid var(--popup-border);
        padding-top: var(--spacing-md);
      }

      .chat-messages {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .chat-input-wrapper {
        display: flex;
        gap: var(--spacing-sm);
        align-items: flex-end;
      }

      .chat-input-wrapper .chat-input {
        flex: 1;
      }

      @media (prefers-color-scheme: dark) {
        :host {
          --popup-bg: #2d2d2d;
          --popup-text: #e8eaed;
          --popup-border: rgba(255, 255, 255, 0.12);
          --input-border: rgba(255, 255, 255, 0.24);
          --secondary-color: #9aa0a6;
        }
        
        .select {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%239aa0a6" d="M6 9L1 4h10z"/></svg>');
        }
      }

      .language-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .language-row .select {
        flex: 1;
        min-width: 0;
      }

      .language-row .btn-icon {
        flex-shrink: 0;
      }

      .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
        gap: var(--spacing-sm);
      }

      .result-header > div {
        display: flex;
        gap: var(--spacing-xs);
      }

      .btn-icon.speaking {
        background: var(--primary-color);
        color: white;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.05);
        }
      }

      .btn-icon:disabled {
        opacity: 0.38;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn-icon[disabled] {
        opacity: 0.38;
        cursor: not-allowed;
        pointer-events: none;
      }

      #translate-result .result-text {
        min-height: 60px;
        white-space: pre-wrap;
      }

      #translate-result .result-label {
        font-weight: 500;
        color: var(--success-color);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @media (max-width: 480px) {
        .language-row {
          flex-direction: column;
          align-items: stretch;
        }
        
        .language-row .select {
          width: 100%;
        }
        
        .language-row .btn-icon {
          align-self: center;
          transform: rotate(90deg);
        }
      }
    `;

    const content = document.createElement('div');
    content.className = 'popup-content';
    this.popupContainer.appendChild(content);
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.popupContainer);
    document.documentElement.appendChild(this.hostElement);
  }

  public show(selectedText: string, selectionRect: DOMRect): void {
    this.selectedText = selectedText;
    this.isVisible = true;
    
    // Initialize tabs if not already created
    if (!this.tabsComponent) {
      this.tabsComponent = new Tabs([
        { id: 'summarize', label: 'Summarize' },
        { id: 'rephrase', label: 'Rephrase' },
        { id: 'translate', label: 'Translate' }
      ]);
      
      const tabsHtml = this.tabsComponent.render();
      this.setContent(tabsHtml);
      
      // Ensure tabs are successfully injected before attaching event listeners
      const tabsElement = this.shadowRoot!.querySelector('.tabs');
      if (!tabsElement) {
        console.warn('Tabs element not found, event listeners may not work properly');
      }
      
      this.tabsComponent.attachEventListeners(this.shadowRoot!);
      this.tabsComponent.setTab('summarize');
      
      // Listen for tab changes
      this.tabsComponent.addEventListener('tabChange', (event: any) => {
        console.log('Tab changed to:', event.detail.tabId);
        this.updateSelectedTextDisplay();
      });
    }
    
    this.updateSelectedTextDisplay();
    this.updatePosition(selectionRect);
    this.setupEventListeners();
    
    document.dispatchEvent(new CustomEvent('popupShown', { 
      detail: { selectedText, selectionRect } 
    }));
  }

  public hide(): void {
    this.isVisible = false;
    if (this.popupContainer) {
      this.popupContainer.style.transform = 'translate(-9999px, -9999px)';
    }
    this.cleanupEventListeners();
    
    document.dispatchEvent(new CustomEvent('popupHidden'));
  }

  public updatePosition(selectionRect: DOMRect): void {
    if (!this.isVisible || !this.popupContainer) return;

    const visualViewport = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetTop: 0,
      offsetLeft: 0
    };

    this.popupContainer.style.transform = 'translate(-9999px, -9999px)';
    const popupRect = this.popupContainer.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;

    const anchorX = selectionRect.left;
    const anchorY = selectionRect.bottom;

    const position = this.calculateOptimalPosition(
      anchorX, 
      anchorY, 
      popupWidth, 
      popupHeight, 
      visualViewport
    );

    this.popupContainer.style.transform = `translate(${position.left}px, ${position.top}px)`;
  }

  private calculateOptimalPosition(
    anchorX: number, 
    anchorY: number, 
    popupW: number, 
    popupH: number, 
    viewport: { width: number; height: number; offsetTop: number; offsetLeft: number }
  ): { top: number; left: number } {
    const margin = 12;
    
    let top = anchorY + margin;
    let left = anchorX;

    left = Math.max(margin, Math.min(left, viewport.width - popupW - margin));

    if (top + popupH + margin > viewport.height) {
      top = anchorY - popupH - margin;
    }

    top = Math.max(margin, Math.min(top, viewport.height - popupH - margin));

    top -= viewport.offsetTop || 0;
    left -= viewport.offsetLeft || 0;

    return { top, left };
  }

  private setupEventListeners(): void {
    this.cleanupEventListeners();
    this.abortController = new AbortController();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hide();
      }
    }, { capture: true, signal: this.abortController.signal });

    document.addEventListener('pointerdown', (event) => {
      const path = event.composedPath();
      const clickedInside = this.hostElement && path.includes(this.hostElement);
      
      if (!clickedInside) {
        this.hide();
      }
    }, { capture: true, signal: this.abortController.signal });
  }

  private cleanupEventListeners(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public setContent(htmlContent: string): void {
    if (this.shadowRoot) {
      const contentElement = this.shadowRoot.querySelector('.popup-content');
      if (contentElement) {
        contentElement.innerHTML = htmlContent;
      }
    }
  }

  public getSelectedText(): string {
    return this.selectedText;
  }

  public isPopupVisible(): boolean {
    return this.isVisible;
  }

  private updateSelectedTextDisplay(): void {
    if (this.shadowRoot) {
      const selectedTextDisplay = this.shadowRoot.querySelector('.tab-panel:not([hidden]) .selected-text-display');
      if (selectedTextDisplay) {
        selectedTextDisplay.textContent = this.selectedText.length > 200 
          ? this.selectedText.substring(0, 200) + '...' 
          : this.selectedText;
      }
    }
  }

  public getTabsComponent(): Tabs | null {
    return this.tabsComponent;
  }

  public getShadowRoot(): ShadowRoot | null {
    return this.shadowRoot;
  }

  public destroy(): void {
    this.hide();
    if (this.hostElement && this.hostElement.parentNode) {
      this.hostElement.parentNode.removeChild(this.hostElement);
    }
    this.hostElement = null;
    this.shadowRoot = null;
    this.popupContainer = null;
    this.tabsComponent = null;
  }
}
