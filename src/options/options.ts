import { StorageService, GeminiService } from '../services';
import { t, setLocale, getLocale } from '../utils/i18n';

class OptionsPage {
  private readonly storageService: StorageService;

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  constructor() {
    this.storageService = new StorageService();
    (async () => {
      await this.init();
    })();
  }

  private async init(): Promise<void> {
    await this.loadLanguage();
    await this.loadApiKey();
    await this.loadGeminiConfig();
    await this.loadShortcuts();
    await this.loadMiniPopupTabs();
    this.setupEventListeners();
    this.updateUITexts();
  }

  private setupEventListeners(): void {
    // Language events
    document.getElementById('save-language')?.addEventListener('click', () => this.saveLanguage());
    
    // API Key events
    document.getElementById('save-api-key')?.addEventListener('click', () => this.saveApiKey());
    document.getElementById('test-api-key')?.addEventListener('click', () => this.testApiKey());
    document.getElementById('toggle-api-visibility')?.addEventListener('click', () => this.toggleApiVisibility());

    // Gemini Model Configuration events
    document.getElementById('save-gemini-config')?.addEventListener('click', () => this.saveGeminiConfig());
    document.getElementById('reset-gemini-config')?.addEventListener('click', () => this.resetGeminiConfig());

    // Mini popup tabs events
    this.setupMiniPopupTabsListeners();

    // Shortcuts events
    document.getElementById('change-shortcuts')?.addEventListener('click', () => this.changeShortcuts());
  }

  private async loadLanguage(): Promise<void> {
    try {
      const language = await this.storageService.getLanguage();
      if (language) {
        setLocale(language);
        const languageSelect = document.getElementById('interface-language') as HTMLSelectElement;
        if (languageSelect) {
          languageSelect.value = language;
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }

  private async saveLanguage(): Promise<void> {
    const languageSelect = document.getElementById('interface-language') as HTMLSelectElement;
    const language = languageSelect.value;

    try {
      const success = await this.storageService.setLanguage(language);
      if (success) {
        setLocale(language);
        this.updateUITexts();
        this.showStatus('language-status', t('status.languageSaved'), 'success');
      } else {
        this.showStatus('language-status', t('status.errorSavingLanguage'), 'error');
      }
    } catch (error) {
      console.error('Error saving language:', error);
      this.showStatus('language-status', t('status.errorSavingLanguage'), 'error');
    }
  }

  private async loadApiKey(): Promise<void> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (apiKey) {
        const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        apiKeyInput.value = apiKey;
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  private async loadShortcuts(): Promise<void> {
    try {
      const commands = await chrome.commands.getAll();
      const highlightCommand = commands.find(cmd => cmd.name === 'highlight-keywords');
      const clearCommand = commands.find(cmd => cmd.name === 'clear-highlights');

      if (highlightCommand?.shortcut) {
        const highlightDisplay = document.getElementById('highlight-shortcut-display');
        if (highlightDisplay) {
          highlightDisplay.textContent = highlightCommand.shortcut;
        }
      }

      if (clearCommand?.shortcut) {
        const clearDisplay = document.getElementById('clear-shortcut-display');
        if (clearDisplay) {
          clearDisplay.textContent = clearCommand.shortcut;
        }
      }
    } catch (error) {
      console.error('Error loading shortcuts:', error);
    }
  }

  private async saveApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showStatus('api-status', t('status.enterApiKey'), 'error');
      return;
    }

    try {
      const success = await this.storageService.setApiKey(apiKey);
      if (success) {
        this.showStatus('api-status', t('status.apiKeySaved'), 'success');
      } else {
        this.showStatus('api-status', t('status.errorSavingApiKey'), 'error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      this.showStatus('api-status', t('status.errorSavingApiKey'), 'error');
    }
  }

  private async testApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showStatus('api-status', t('status.enterApiKeyToTest'), 'error');
      return;
    }

    try {
      this.showStatus('api-status', t('status.testingApiKey'), 'success');
      
      const geminiService = new GeminiService(apiKey);
      const isValid = await geminiService.testConnection();

      if (isValid) {
        this.showStatus('api-status', t('status.apiKeyValid'), 'success');
      } else {
        this.showStatus('api-status', t('status.apiKeyInvalid'), 'error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      if (error instanceof Error && error.message.includes('Invalid API key format')) {
        this.showStatus('api-status', t('status.invalidApiKeyFormat'), 'error');
      } else {
        this.showStatus('api-status', t('status.errorTestingApiKey'), 'error');
      }
    }
  }

  private toggleApiVisibility(): void {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const toggleBtn = document.getElementById('toggle-api-visibility') as HTMLButtonElement;
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = t('status.hide');
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = t('status.show');
    }
  }

  private async changeShortcuts(): Promise<void> {
    try {
      await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    } catch (error) {
      console.error('Error opening shortcuts page:', error);
      this.showStatus('api-status', t('status.errorOpeningShortcuts'), 'error');
    }
  }


  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private showStatus(elementId: string, message: string, type: 'success' | 'error'): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `status-message status-${type}`;
      element.style.display = 'block';
      
      setTimeout(() => {
        element.style.display = 'none';
      }, 2000);
    }
  }

  private async loadGeminiConfig(): Promise<void> {
    try {
      const config = await this.storageService.getApiConfig();
      if (config) {
        const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
        
        if (modelSelect && config.model) {
          modelSelect.value = config.model;
        }
      }
    } catch (error) {
      console.error('Error loading Gemini config:', error);
    }
  }

  private async saveGeminiConfig(): Promise<void> {
    try {
      const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
      
      const config = {
        model: modelSelect?.value || 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 2048
      };
      
      const success = await this.storageService.setApiConfig(config);
      if (success) {
        this.showStatus('gemini-config-status', t('status.modelSettingsSaved'), 'success');
      } else {
        this.showStatus('gemini-config-status', t('status.errorSavingSettings'), 'error');
      }
    } catch (error) {
      console.error('Error saving Gemini config:', error);
      this.showStatus('gemini-config-status', t('status.errorSavingSettings'), 'error');
    }
  }

  private async resetGeminiConfig(): Promise<void> {
    try {
      const defaultConfig = {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 2048
      };
      
      const success = await this.storageService.setApiConfig(defaultConfig);
      if (success) {
        await this.loadGeminiConfig();
        this.showStatus('gemini-config-status', t('status.settingsResetToDefault'), 'success');
      } else {
        this.showStatus('gemini-config-status', t('status.errorResettingSettings'), 'error');
      }
    } catch (error) {
      console.error('Error resetting Gemini config:', error);
      this.showStatus('gemini-config-status', t('status.errorResettingSettings'), 'error');
    }
  }


  private async loadMiniPopupTabs(): Promise<void> {
    try {
      const tabs = await this.storageService.getMiniPopupTabs();
      
      // Update checkboxes based on saved settings
      const checkboxes = [
        'mini-tab-summarize',
        'mini-tab-rephrase', 
        'mini-tab-translate',
        'mini-tab-discuss',
        'mini-tab-highlight'
      ];
      
      checkboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
        if (checkbox) {
          const tabType = checkbox.value;
          checkbox.checked = tabs.includes(tabType);
        }
      });
    } catch (error) {
      console.error('Error loading mini popup tabs:', error);
    }
  }

  private setupMiniPopupTabsListeners(): void {
    // Add change listeners to all mini popup tab checkboxes
    const checkboxes = [
      'mini-tab-summarize',
      'mini-tab-rephrase', 
      'mini-tab-translate',
      'mini-tab-discuss',
      'mini-tab-highlight'
    ];
    
    checkboxes.forEach(checkboxId => {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (checkbox) {
        checkbox.addEventListener('change', () => this.saveMiniPopupTabs());
      }
    });
  }

  private async saveMiniPopupTabs(): Promise<void> {
    try {
      const checkboxes = [
        'mini-tab-summarize',
        'mini-tab-rephrase', 
        'mini-tab-translate',
        'mini-tab-discuss',
        'mini-tab-highlight'
      ];
      
      const selectedTabs: string[] = [];
      checkboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
        if (checkbox && checkbox.checked) {
          selectedTabs.push(checkbox.value);
        }
      });
      
      // Ensure at least one tab is selected
      if (selectedTabs.length === 0) {
        this.showStatus('mini-popup-status', 'Please select at least one tab', 'error');
        return;
      }
      
      const success = await this.storageService.setMiniPopupTabs(selectedTabs);
      if (success) {
        this.showStatus('mini-popup-status', t('status.miniPopupTabsSaved'), 'success');
      } else {
        this.showStatus('mini-popup-status', t('status.errorSavingMiniPopupTabs'), 'error');
      }
    } catch (error) {
      console.error('Error saving mini popup tabs:', error);
      this.showStatus('mini-popup-status', t('status.errorSavingMiniPopupTabs'), 'error');
    }
  }

  private updateUITexts(): void {
    // Update page title
    document.title = t('options.title');
    
    // Update main heading
    const mainHeading = document.querySelector('h1');
    if (mainHeading) {
      mainHeading.textContent = t('options.title');
    }
    
    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = t(key);
      }
    });
    
    // Update language section
    const languageSection = document.querySelector('.section h2');
    if (languageSection) {
      languageSection.textContent = '🌐 ' + t('options.languageSettings');
    }
    
    // Update API section
    const apiSection = document.querySelectorAll('.section h2')[1];
    if (apiSection) {
      apiSection.textContent = '🔑 ' + t('options.apiSettings');
    }
    
    // Update Mini Popup section
    const miniPopupSection = document.querySelectorAll('.section h2')[2];
    if (miniPopupSection) {
      miniPopupSection.textContent = '📱 ' + t('options.miniPopupSettings');
    }
    
    // Update Gemini Model section
    const geminiSection = document.querySelectorAll('.section h2')[3];
    if (geminiSection) {
      geminiSection.textContent = '🤖 ' + t('options.geminiModelSettings');
    }
    
    // Update Keyboard Shortcuts section
    const shortcutsSection = document.querySelectorAll('.section h2')[4];
    if (shortcutsSection) {
      shortcutsSection.textContent = '⌨️ ' + t('options.keyboardShortcuts');
    }
  }
}

// Initialize the options page
new OptionsPage();