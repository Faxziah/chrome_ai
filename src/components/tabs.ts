import { TabConfig, TabChangeEvent } from '../types';

export class Tabs {
  private currentTabIndex: number = 0;
  private tabs: TabConfig[];
  private rootElement: HTMLElement | null = null;
  private eventTarget: EventTarget;

  constructor(tabs: TabConfig[]) {
    this.tabs = tabs;
    this.eventTarget = new EventTarget();
  }

  render(): string {
    const tabsHtml = this.tabs.map((tab, index) => {
      const isActive = index === this.currentTabIndex;
      return `
        <button 
          class="tab ${isActive ? 'is-active' : ''}" 
          role="tab" 
          aria-selected="${isActive}" 
          aria-controls="panel-${tab.id}" 
          id="tab-${tab.id}"
          tabindex="${isActive ? 0 : -1}"
        >
          ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
          <span class="tab-label">${tab.label}</span>
        </button>
      `;
    }).join('');

    const panelsHtml = this.tabs.map((tab, index) => {
      const isActive = index === this.currentTabIndex;
      return `
        <section 
          id="panel-${tab.id}" 
          role="tabpanel" 
          aria-labelledby="tab-${tab.id}" 
          class="tab-panel"
          ${isActive ? '' : 'hidden'}
        >
          ${this.renderTabContent(tab.id)}
        </section>
      `;
    }).join('');

    return `
      <nav class="tabs tabs--secondary" role="tablist" aria-label="AI Text Tools">
        ${tabsHtml}
        <span class="tabs__indicator" aria-hidden="true"></span>
      </nav>
      ${panelsHtml}
    `;
  }

  private renderTabContent(tabId: string): string {
    switch (tabId) {
      case 'summarize':
        return `
          <div class="tab-content">
            <div class="selected-text-display">Selected text will appear here</div>
            <button class="btn btn-primary" id="btn-summarize">Summarize</button>
            <div class="result-container" id="summary-result" hidden>
              <div class="result-text" id="summary-text"></div>
            </div>
            <div class="chat-container">
              <div class="chat-messages" id="chat-messages"></div>
              <div class="chat-input-wrapper">
                <textarea class="chat-input" id="chat-input" placeholder="Ask about this text..." rows="2"></textarea>
                <button class="btn btn-icon" id="btn-send-chat" aria-label="Send message">➤</button>
              </div>
            </div>
            <button class="btn btn-secondary" id="btn-add-favorite">★ Add to Favorites</button>
          </div>
        `;

      case 'rephrase':
        return `
          <div class="tab-content">
            <div class="selected-text-display">Selected text will appear here</div>
            <div class="style-selector">
              <label>Style:</label>
              <select class="select" id="rephrase-style">
                <option value="casual" selected>Casual</option>
                <option value="formal">Formal</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="academic">Academic</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btn-rephrase">Rephrase</button>
            <div class="result-container" id="rephrase-result" hidden>
              <div class="result-text" id="rephrase-text"></div>
              <button class="btn btn-secondary" id="btn-copy-rephrase">📋 Copy</button>
            </div>
          </div>
        `;

      case 'translate':
        return `
          <div class="tab-content">
            <div class="selected-text-display">Selected text will appear here</div>
            <div class="language-selector">
              <div class="language-row">
                <select class="select" id="source-language">
                  <option value="auto" selected>Auto-detect</option>
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
                <button class="btn btn-icon" id="btn-swap-languages" aria-label="Swap languages">⇄</button>
                <select class="select" id="target-language">
                  <option value="en" selected>English</option>
                  <option value="ru">Russian</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-translate">Translate</button>
            <div class="result-container" id="translate-result" hidden>
              <div class="result-header">
                <span class="result-label">Translation:</span>
                <div>
                  <button class="btn btn-icon" id="btn-speak-source" aria-label="Speak original">🔊</button>
                  <button class="btn btn-icon" id="btn-speak-translation" aria-label="Speak translation">🔊</button>
                </div>
              </div>
              <div class="result-text" id="translate-text"></div>
              <button class="btn btn-secondary" id="btn-copy-translate">📋 Copy</button>
            </div>
          </div>
        `;

      default:
        return '<div class="tab-content">Unknown tab</div>';
    }
  }

  attachEventListeners(shadowRoot: ShadowRoot): void {
    this.rootElement = shadowRoot.querySelector('.tabs') as HTMLElement;
    if (!this.rootElement) return;

    // Click event listeners for tab buttons
    const tabButtons = shadowRoot.querySelectorAll('.tab');
    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        this.selectTab(index, false);
      });
    });

    // Keyboard navigation
    this.rootElement.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          this.currentTabIndex = (this.currentTabIndex + 1) % this.tabs.length;
          this.selectTab(this.currentTabIndex, true);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.currentTabIndex = this.currentTabIndex === 0 ? this.tabs.length - 1 : this.currentTabIndex - 1;
          this.selectTab(this.currentTabIndex, true);
          break;
        case 'Home':
          event.preventDefault();
          this.selectTab(0, true);
          break;
        case 'End':
          event.preventDefault();
          this.selectTab(this.tabs.length - 1, true);
          break;
      }
    });
  }

  private selectTab(index: number, focus: boolean): void {
    this.currentTabIndex = index;
    
    if (!this.rootElement) return;

    const shadowRoot = this.rootElement.getRootNode() as ShadowRoot;
    const tabButtons = shadowRoot.querySelectorAll('.tab');
    const panels = shadowRoot.querySelectorAll('.tab-panel');
    const indicator = shadowRoot.querySelector('.tabs__indicator') as HTMLElement;

    // Update tab buttons
    tabButtons.forEach((button, i) => {
      const isActive = i === index;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive.toString());
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update panels
    panels.forEach((panel, i) => {
      const isActive = i === index;
      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // Update indicator position
    if (indicator) {
      const activeButton = tabButtons[index] as HTMLElement;
      const buttonRect = activeButton.getBoundingClientRect();
      const containerRect = this.rootElement.getBoundingClientRect();
      
      indicator.style.left = `${buttonRect.left - containerRect.left}px`;
      indicator.style.width = `${buttonRect.width}px`;
    }

    // Focus active tab if requested
    if (focus) {
      const activeButton = tabButtons[index] as HTMLElement;
      activeButton.focus();
    }

    // Emit tab change event
    const event = new CustomEvent('tabChange', {
      detail: {
        tabId: this.tabs[index].id,
        tabIndex: index
      } as TabChangeEvent
    });
    this.eventTarget.dispatchEvent(event);
  }

  getCurrentTab(): { id: string; index: number } {
    return {
      id: this.tabs[this.currentTabIndex].id,
      index: this.currentTabIndex
    };
  }

  setTab(tabId: string): void {
    const index = this.tabs.findIndex(tab => tab.id === tabId);
    if (index !== -1) {
      this.selectTab(index, false);
    }
  }

  addEventListener(type: string, listener: EventListener): void {
    this.eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.eventTarget.removeEventListener(type, listener);
  }
}
