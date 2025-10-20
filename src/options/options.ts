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
    document.getElementById('gemini-temperature')?.addEventListener('input', (e) => this.updateTemperatureDisplay(e));

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
        this.showStatus('language-status', t('status.languageSaved'), 'success');
        // Reload page to apply new language
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
      this.showStatus('api-status', 'Введите API ключ', 'error');
      return;
    }

    try {
      const success = await this.storageService.setApiKey(apiKey);
      if (success) {
        this.showStatus('api-status', 'API ключ успешно сохранен', 'success');
      } else {
        this.showStatus('api-status', 'Ошибка при сохранении API ключа', 'error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      this.showStatus('api-status', 'Ошибка при сохранении API ключа', 'error');
    }
  }

  private async testApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showStatus('api-status', 'Введите API ключ для проверки', 'error');
      return;
    }

    try {
      this.showStatus('api-status', 'Проверка API ключа...', 'success');
      
      const geminiService = new GeminiService(apiKey);
      const isValid = await geminiService.testConnection();

      if (isValid) {
        this.showStatus('api-status', 'API ключ действителен', 'success');
      } else {
        this.showStatus('api-status', 'API ключ недействителен или недоступен', 'error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      if (error instanceof Error && error.message.includes('Invalid API key format')) {
        this.showStatus('api-status', 'Неверный формат API ключа', 'error');
      } else {
        this.showStatus('api-status', 'Ошибка при проверке API ключа. Проверьте подключение к интернету', 'error');
      }
    }
  }

  private toggleApiVisibility(): void {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    const toggleBtn = document.getElementById('toggle-api-visibility') as HTMLButtonElement;
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = 'Скрыть';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = 'Показать';
    }
  }

  private async changeShortcuts(): Promise<void> {
    try {
      await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    } catch (error) {
      console.error('Error opening shortcuts page:', error);
      this.showStatus('api-status', 'Ошибка при открытии страницы горячих клавиш', 'error');
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
      }, 5000);
    }
  }

  private async loadGeminiConfig(): Promise<void> {
    try {
      const config = await this.storageService.getApiConfig();
      if (config) {
        const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
        const temperatureSlider = document.getElementById('gemini-temperature') as HTMLInputElement;
        const maxTokensInput = document.getElementById('gemini-max-tokens') as HTMLInputElement;
        
        if (modelSelect && config.model) {
          modelSelect.value = config.model;
        }
        
        if (temperatureSlider && config.temperature !== undefined) {
          temperatureSlider.value = config.temperature.toString();
          this.updateTemperatureDisplay({ target: temperatureSlider } as unknown as Event);
        }
        
        if (maxTokensInput && config.maxTokens) {
          maxTokensInput.value = config.maxTokens.toString();
        }
      }
    } catch (error) {
      console.error('Error loading Gemini config:', error);
    }
  }

  private async saveGeminiConfig(): Promise<void> {
    try {
      const modelSelect = document.getElementById('gemini-model') as HTMLSelectElement;
      const temperatureSlider = document.getElementById('gemini-temperature') as HTMLInputElement;
      const maxTokensInput = document.getElementById('gemini-max-tokens') as HTMLInputElement;
      
      const config = {
        model: modelSelect?.value || 'gemini-2.5-flash',
        temperature: parseFloat(temperatureSlider?.value || '0.7'),
        maxTokens: parseInt(maxTokensInput?.value || '2048')
      };
      
      const success = await this.storageService.setApiConfig(config);
      if (success) {
        this.showStatus('gemini-config-status', 'Настройки модели сохранены', 'success');
      } else {
        this.showStatus('gemini-config-status', 'Ошибка при сохранении настроек', 'error');
      }
    } catch (error) {
      console.error('Error saving Gemini config:', error);
      this.showStatus('gemini-config-status', 'Ошибка при сохранении настроек', 'error');
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
        this.showStatus('gemini-config-status', 'Настройки сброшены к умолчанию', 'success');
      } else {
        this.showStatus('gemini-config-status', 'Ошибка при сбросе настроек', 'error');
      }
    } catch (error) {
      console.error('Error resetting Gemini config:', error);
      this.showStatus('gemini-config-status', 'Ошибка при сбросе настроек', 'error');
    }
  }

  private updateTemperatureDisplay(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const displayElement = document.getElementById('temperature-value');
    if (displayElement) {
      displayElement.textContent = value;
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
    
    // Update other sections as needed...
  }
}

// Initialize the options page
new OptionsPage();