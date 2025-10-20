import { TabConfig, TabChangeEvent } from '../types';
import { t } from '../utils/i18n';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Shqip' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'ar', name: 'العربية' },
  { code: 'az', name: 'Azərbaycan' },
  { code: 'eu', name: 'Euskera' },
  { code: 'be', name: 'Беларуская' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'bs', name: 'Bosanski' },
  { code: 'bg', name: 'Български' },
  { code: 'ca', name: 'Català' },
  { code: 'zh', name: '中文' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'cs', name: 'Čeština' },
  { code: 'da', name: 'Dansk' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'et', name: 'Eesti' },
  { code: 'fi', name: 'Suomi' },
  { code: 'fr', name: 'Français' },
  { code: 'gl', name: 'Galego' },
  { code: 'ka', name: 'ქართული' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'he', name: 'עברית' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'hu', name: 'Magyar' },
  { code: 'is', name: 'Íslenska' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'km', name: 'ខ្មែរ' },
  { code: 'ko', name: '한국어' },
  { code: 'lo', name: 'ລາວ' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'mk', name: 'Македонски' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'mt', name: 'Malti' },
  { code: 'mr', name: 'मराठी' },
  { code: 'my', name: 'မြန်မာ' },
  { code: 'ne', name: 'नेपाली' },
  { code: 'no', name: 'Norsk' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'fa', name: 'فارسی' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' },
  { code: 'ro', name: 'Română' },
  { code: 'ru', name: 'Русский' },
  { code: 'si', name: 'සිංහල' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'es', name: 'Español' },
  { code: 'sr', name: 'Српски' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'sv', name: 'Svenska' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'th', name: 'ไทย' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська' },
  { code: 'ur', name: 'اردو' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'cy', name: 'Cymraeg' },
  { code: 'zu', name: 'IsiZulu' }
];

const generateLanguageOptions = (excludeCode?: string): string => {
  return LANGUAGES
    .filter(lang => lang.code !== excludeCode)
    .map(lang => `<option value="${lang.code}">${lang.name}</option>`)
    .join('');
};

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

  renderMiniMode(): string {
    const miniButtons = this.tabs.map((tab, index) => {
      const letter = this.getTabLetter(tab.id);
      return `
        <button 
          class="mini-tab" 
          role="tab" 
          aria-selected="false" 
          aria-controls="panel-${tab.id}" 
          id="btn-mini-${tab.id}"
          data-tab-id="${tab.id}"
          tabindex="-1"
          title="${tab.label}"
        >
          ${letter}
        </button>
      `;
    }).join('');

    return `
      <nav class="mini-tabs" role="tablist" aria-label="AI Text Tools Mini">
        ${miniButtons}
      </nav>
    `;
  }

  private getTabLetter(tabId: string): string {
    switch (tabId) {
      case 'summarize': return t('common.miniS');
      case 'rephrase': return t('common.miniR');
      case 'translate': return t('common.miniT');
      case 'discuss': return t('common.miniD');
      default: return tabId.charAt(0).toUpperCase();
    }
  }

  private renderTabContent(tabId: string): string {
    switch (tabId) {
      case 'summarize':
        return `
          <div class="tab-content">
            <div class="selected-text-display">${t('common.selectedText')}</div>
            <button class="btn btn-primary" id="btn-summarize">${t('common.resume')}</button>
            <div class="result-container" id="summary-result" hidden>
              <div class="result-text" id="summary-text"></div>
              <div class="result-actions">
                <button class="btn btn-secondary" id="btn-copy-summary" style="display:none;">${t('common.copy')}</button>
                <button class="btn btn-favorite" id="btn-favorite-toggle-${tabId}" data-is-favorite="false" style="display:none;">${t('common.addToFavorites')}</button>
              </div>
            </div>
            <div class="api-key-error-template" id="api-key-error-summarize" style="display: none;">
              <div class="api-key-error">
                <p>${t('api.missingKey')}</p>
                <p><a href="http://aistudio.google.com/app/api-keys?hl=ru" target="_blank" rel="noopener noreferrer">${t('api.visitStudio')}</a> ${t('api.createApiKey')}</p>
              </div>
            </div>
          </div>
        `;

      case 'discuss':
        return `
          <div class="tab-content">
            <div class="selected-text-display">${t('common.selectedText')}</div>
            <div class="chat-container">
              <div class="chat-messages" id="chat-messages"></div>
              <div class="chat-input-wrapper">
                <textarea class="chat-input" id="chat-input" placeholder="${t('chat.placeholder')}" rows="2"></textarea>
                <button class="btn btn-icon" id="btn-send-chat" aria-label="${t('chat.sendMessage')}">➤</button>
              </div>
            </div>
            <button class="btn btn-favorite" id="btn-favorite-toggle-${tabId}" data-is-favorite="false" style="display:none;">${t('common.addToFavorites')}</button>
            <div class="api-key-error-template" id="api-key-error-discuss" style="display: none;">
              <div class="api-key-error">
                <p>${t('api.missingKey')}</p>
                <p><a href="http://aistudio.google.com/app/api-keys?hl=ru" target="_blank" rel="noopener noreferrer">${t('api.visitStudio')}</a> ${t('api.createApiKey')}</p>
              </div>
            </div>
          </div>
        `;

      case 'rephrase':
        return `
          <div class="tab-content">
            <div class="selected-text-display">${t('common.selectedText')}</div>
            <div class="style-selector">
              <select class="select" id="rephrase-style">
                <option value="casual" selected>${t('rephrase.casual')}</option>
                <option value="formal">${t('rephrase.formal')}</option>
                <option value="professional">${t('rephrase.professional')}</option>
                <option value="friendly">${t('rephrase.friendly')}</option>
                <option value="academic">${t('rephrase.academic')}</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btn-rephrase">${t('common.rephrase')}</button>
            <div class="result-container" id="rephrase-result" hidden>
              <div class="result-text" id="rephrase-text"></div>
              <div class="result-actions">
                <button class="btn btn-secondary" id="btn-copy-rephrase" style="display:none;">${t('common.copy')}</button>
                <button class="btn btn-favorite" id="btn-favorite-toggle-${tabId}" data-is-favorite="false" style="display:none;">${t('common.addToFavorites')}</button>
              </div>
            </div>
            <div class="api-key-error-template" id="api-key-error-rephrase" style="display: none;">
              <div class="api-key-error">
                <p>${t('api.missingKey')}</p>
                <p><a href="http://aistudio.google.com/app/api-keys?hl=ru" target="_blank" rel="noopener noreferrer">${t('api.visitStudio')}</a> ${t('api.createApiKey')}</p>
              </div>
            </div>
          </div>
        `;

      case 'translate':
        return `
          <div class="tab-content">
            <div class="selected-text-display">${t('common.selectedText')}</div>
            <div class="language-selector">
              <div class="language-row">
                <select class="select" id="source-language">
                  <option value="auto" selected>${t('translate.autoDetect')}</option>
                  ${generateLanguageOptions()}
                </select>
                <button class="btn btn-icon" id="btn-swap-languages" aria-label="${t('translate.swapLanguages')}">⇄</button>
                <select class="select" id="target-language">
                  <option value="en" selected>${t('language.english')}</option>
                  ${generateLanguageOptions('en')}
                </select>
                <button class="btn btn-icon" id="btn-speak-source" aria-label="${t('translate.speakOriginal')}" title="${t('translate.speakOriginal')}">🔊</button>
              </div>
            </div>

            <button class="btn btn-primary" id="btn-translate">${t('common.translate')}</button>
            <div class="result-container" id="translate-result" hidden>
              <div class="result-header">
                <span class="result-label">${t('translate.translation')}</span>
                <div>
                  <button class="btn btn-icon" id="btn-speak-translation" aria-label="${t('translate.speakTranslation')}">🔊</button>
                </div>
              </div>
              <div class="result-text" id="translate-text"></div>
              <div class="result-actions">
                <button class="btn btn-secondary" id="btn-copy-translate" style="display:none;">${t('common.copy')}</button>
                <button class="btn btn-favorite" id="btn-favorite-toggle-${tabId}" data-is-favorite="false" style="display:none;">${t('common.addToFavorites')}</button>
              </div>
            </div>
            <div class="api-key-error-template" id="api-key-error-translate" style="display: none;">
              <div class="api-key-error">
                <p>${t('api.missingKey')}</p>
                <p><a href="http://aistudio.google.com/app/api-keys?hl=ru" target="_blank" rel="noopener noreferrer">${t('api.visitStudio')}</a> ${t('api.createApiKey')}</p>
              </div>
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

    // Click event listeners for mini tab buttons
    const miniTabButtons = shadowRoot.querySelectorAll('.mini-tab');
    miniTabButtons.forEach((button, index) => {
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
    const miniTabButtons = shadowRoot.querySelectorAll('.mini-tab');
    const panels = shadowRoot.querySelectorAll('.tab-panel');
    const indicator = shadowRoot.querySelector('.tabs__indicator') as HTMLElement;

    // Update tab buttons
    tabButtons.forEach((button, i) => {
      const isActive = i === index;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive.toString());
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update mini tab buttons
    miniTabButtons.forEach((button, i) => {
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
