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

    // Добавляем Material Design CSS в Shadow DOM
    const materialDesignLink = document.createElement('link');
    materialDesignLink.rel = 'stylesheet';
    materialDesignLink.href = chrome.runtime.getURL('styles/material-design.css');
    this.shadowRoot.appendChild(materialDesignLink);

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

    // Load external CSS file
    const popupStyleLink = document.createElement('link');
    popupStyleLink.rel = 'stylesheet';
    popupStyleLink.href = chrome.runtime.getURL('styles/popup-ui.css');
    this.shadowRoot.appendChild(popupStyleLink);

    const content = document.createElement('div');
    content.className = 'popup-content';
    this.popupContainer.appendChild(content);
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

  public triggerAction(action: string): void {
    if (this.tabsComponent) {
      // Switch to the appropriate tab and trigger the action
      if (action === 'summarize') {
        this.tabsComponent.setTab('summarize');
      } else if (action === 'rephrase') {
        this.tabsComponent.setTab('rephrase');
      } else if (action === 'translate') {
        this.tabsComponent.setTab('translate');
      }
    }
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
