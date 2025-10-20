import { Tabs } from '../components/tabs';
import { t } from '../utils/i18n';

export class PopupUI {
  private hostElement: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private popupContainer: HTMLDivElement | null = null;
  private abortController: AbortController | null = null;
  private selectedText: string = '';
  private isVisible: boolean = false;
  private tabsComponent: Tabs | null = null;
  private mode: 'mini' | 'full' = 'mini';
  private isPinned: boolean = false;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private popupStartX: number = 0;
  private popupStartY: number = 0;
  private currentPosition: { x: number; y: number } | null = null;
  private wasManuallyPositioned: boolean = false;

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
    
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      materialDesignLink.href = chrome.runtime.getURL('styles/material-design.css');
    } else {
      // Fallback for web context - use relative path
      materialDesignLink.href = 'styles/material-design.css';
    }
    
    this.shadowRoot.appendChild(materialDesignLink);

    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'popup-container';
    this.popupContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      opacity: 0;
      visibility: hidden;
      will-change: transform;
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
    
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      popupStyleLink.href = chrome.runtime.getURL('styles/popup-ui.css');
    } else {
      // Fallback for web context - use relative path
      popupStyleLink.href = 'styles/popup-ui.css';
    }
    
    this.shadowRoot.appendChild(popupStyleLink);

    const content = document.createElement('div');
    content.className = 'popup-content';
    this.popupContainer.appendChild(content);
    this.shadowRoot.appendChild(this.popupContainer);
    document.documentElement.appendChild(this.hostElement);
  }

  public async show(selectedText: string, selectionRect: DOMRect): Promise<void> {
    this.selectedText = selectedText;
    this.isVisible = true;
    this.wasManuallyPositioned = false;
    this.currentPosition = null;
    
    // Initialize tabs if not already created
    if (!this.tabsComponent) {
      this.tabsComponent = new Tabs([
        { id: 'summarize', label: t('common.resume') },
        { id: 'rephrase', label: t('common.rephrase') },
        { id: 'translate', label: t('common.translate') },
        { id: 'discuss', label: t('common.discuss') }
      ]);
      
      // Start with mini mode
      this.mode = 'mini';
      const tabsHtml = this.tabsComponent.renderMiniMode();
      this.setContent(tabsHtml);
      
      // Wait for next frame to ensure DOM rendering
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Ensure tabs are successfully injected before attaching event listeners
      const tabsElement = this.shadowRoot!.querySelector('.mini-tabs');
      if (!tabsElement) {
        console.error('Mini tabs element not found after render');
        return;
      }
      
      this.tabsComponent.attachEventListeners(this.shadowRoot!);
      
      // Listen for tab changes
      this.tabsComponent.addEventListener('tabChange', (event: any) => {
        this.updateSelectedTextDisplay();
      });
    }
    
    // 1. Рендерить контент
    // 2. Вычислить и установить позицию (БЕЗ показа)
    this.updatePosition(selectionRect);
    // 3. Показать с плавной анимацией opacity
    if (this.popupContainer) {
      this.popupContainer.style.opacity = '1';
      this.popupContainer.style.visibility = 'visible';
    }
    
    this.updateSelectedTextDisplay();
    this.setupEventListeners();
    
    document.dispatchEvent(new CustomEvent('popupShown', { 
      detail: { selectedText, selectionRect } 
    }));
  }

  public hide(): void {
    this.isVisible = false;
    if (this.popupContainer) {
      this.popupContainer.style.opacity = '0';
      this.popupContainer.style.visibility = 'hidden';
      this.popupContainer.style.transform = '';
    }
    this.cleanupEventListeners();
    
    document.dispatchEvent(new CustomEvent('popupHidden'));
  }

  public updatePosition(selectionRect: DOMRect): void {
    if (!this.popupContainer) return;

    if (this.wasManuallyPositioned && this.currentPosition) {
      this.popupContainer.style.transform = `translate(${this.currentPosition.x}px, ${this.currentPosition.y}px)`;
      return;
    }

    const visualViewport = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetTop: 0,
      offsetLeft: 0
    };

    // Measure popup size without changing visibility
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

    // Set transform immediately to correct position
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
      if (event.key === 'Escape' && !this.isPinned) {
        this.hide();
      }
    }, { capture: true, signal: this.abortController.signal });

    document.addEventListener('pointerdown', (event) => {
      const path = event.composedPath();
      const clickedInside = path.some(el => el === this.popupContainer || (el instanceof HTMLElement && this.popupContainer?.contains(el)));
      
      if (!clickedInside && !this.isPinned) {
        this.hide();
      }
    }, { capture: true, signal: this.abortController.signal });

    // Add click handlers for mini mode buttons to switch to full mode
    if (this.mode === 'mini' && this.shadowRoot) {
      // Use event delegation on shadowRoot instead of querySelectorAll
      this.shadowRoot.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains('mini-tab')) {
          // Get the target tab id from data attribute
          const tabId = target.getAttribute('data-tab-id');
          this.switchToFullMode();
          // Set the correct tab after switching to full mode
          if (this.tabsComponent && tabId) {
            this.tabsComponent.setTab(tabId);
          }
        }
      }, { signal: this.abortController?.signal });
    }
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
      } else if (action === 'discuss') {
        this.tabsComponent.setTab('discuss');
      }
    }
  }

  public switchToFullMode(): void {
    if (this.mode === 'full' || !this.tabsComponent) return;
    
    if (!this.shadowRoot) {
      console.error('Shadow root not available');
      return;
    }
    
    this.mode = 'full';
    
    // Restore full size for full mode
    if (this.popupContainer) {
      this.popupContainer.style.minWidth = '320px';
      this.popupContainer.style.width = 'auto';
    }
    
    const headerHtml = this.renderPopupHeader();
    const tabsHtml = this.tabsComponent.render();
    this.setContent(headerHtml + tabsHtml);
    
    // Re-attach event listeners for full mode
    this.tabsComponent.attachEventListeners(this.shadowRoot);
    
    // Setup drag and drop for header
    this.setupDragAndDrop();
    
    // Don't set any tab here - let the click handler set the correct tab
    // when switching from mini mode to full mode
    
    this.updateSelectedTextDisplay();
  }

  public switchToMiniMode(): void {
    if (this.mode === 'mini' || !this.tabsComponent) return;
    
    this.mode = 'mini';
    
    // Set compact size for mini mode
    if (this.popupContainer) {
      this.popupContainer.style.minWidth = 'unset';
      this.popupContainer.style.width = 'auto';
    }
    
    const miniHeaderHtml = this.renderMiniHeader();
    const tabsHtml = this.tabsComponent.renderMiniMode();
    this.setContent(miniHeaderHtml + tabsHtml);
    
    // Re-attach event listeners for mini mode
    this.tabsComponent.attachEventListeners(this.shadowRoot!);
    
    // Keep current tab active
    const currentTab = this.tabsComponent.getCurrentTab();
    this.tabsComponent.setTab(currentTab.id);
    
    this.updateSelectedTextDisplay();
  }

  public getMode(): 'mini' | 'full' {
    return this.mode;
  }

  public getCurrentTab(): { id: string; index: number } {
    if (this.tabsComponent) {
      return this.tabsComponent.getCurrentTab();
    }
    return { id: 'summarize', index: 0 };
  }

  private renderPopupHeader(): string {
    return `
      <div class="popup-header" id="popup-header">
        <div class="popup-header-controls">
          <button class="header-btn drag-handle" id="btn-drag-handle" title="${t('common.drag')}" aria-label="Drag popup">⋮⋮</button>
          <button class="header-btn pin-btn" id="btn-pin" title="${t('common.pin')}" aria-label="Pin popup">📌</button>
          <button class="header-btn close-btn" id="btn-close" title="${t('common.close')}" aria-label="Close popup">✕</button>
        </div>
      </div>
    `;
  }

  private setupDragAndDrop(): void {
    if (!this.shadowRoot) return;
    
    const header = this.shadowRoot.querySelector('#popup-header') as HTMLElement;
    const dragHandle = this.shadowRoot.querySelector('#btn-drag-handle') as HTMLElement;
    const pinBtn = this.shadowRoot.querySelector('#btn-pin') as HTMLElement;
    const closeBtn = this.shadowRoot.querySelector('#btn-close') as HTMLElement;
    
    if (!header || !dragHandle || !pinBtn || !closeBtn) return;
    
    // Pin button handler
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isPinned = !this.isPinned;
      pinBtn.classList.toggle('active', this.isPinned);
      pinBtn.title = this.isPinned ? t('common.unpin') : t('common.pin');
    });
    
    // Close button handler
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });
    
    // Drag handlers - use drag handle instead of entire header
    dragHandle.addEventListener('mousedown', (e) => {
      if (this.isPinned) return;
      
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      
      const rect = this.popupContainer!.getBoundingClientRect();
      this.popupStartX = rect.left;
      this.popupStartY = rect.top;
      
      // Disable transitions during drag
      const originalTransition = this.popupContainer!.style.transition;
      this.popupContainer!.style.transition = 'none';
      this.popupContainer!.classList.add('popup-dragging');
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        const popupRect = this.popupContainer!.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;
        
        const visualViewport = window.visualViewport || {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetTop: 0,
          offsetLeft: 0
        };
        
        let newX = this.popupStartX + deltaX;
        let newY = this.popupStartY + deltaY;
        
        // Constrain to viewport bounds
        const minX = 0;
        const maxX = visualViewport.width - popupWidth;
        const minY = 0;
        const maxY = visualViewport.height - popupHeight;
        
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));
        
        this.popupContainer!.style.transform = `translate(${newX}px, ${newY}px)`;
        this.currentPosition = { x: newX, y: newY };
      };
      
      const handleMouseUp = () => {
        this.isDragging = false;
        this.wasManuallyPositioned = true;
        this.popupContainer!.classList.remove('popup-dragging');
        // Restore original transition
        this.popupContainer!.style.transition = originalTransition;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
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

  private renderMiniHeader(): string {
    return `
      <div class="mini-header">
        <button class="mini-header-btn" id="btn-mini-drag" title="${t('common.drag')}">⋮⋮</button>
        <button class="mini-header-btn" id="btn-mini-pin" title="${t('common.pin')}">📌</button>
        <button class="mini-header-btn" id="btn-mini-close" title="${t('common.close')}">✕</button>
      </div>
    `;
  }
}
