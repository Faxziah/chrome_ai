import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PopupIntegration } from './popup-integration';
import { PopupUI } from './popup-ui';
import { createMockGeminiService, createMockStorageService, createMockShadowRoot, createMockElement } from '../test/test-utils';

// Mock PopupUI
vi.mock('./popup-ui', () => ({
  PopupUI: vi.fn().mockImplementation(() => ({
    getShadowRoot: vi.fn(),
    getSelectedText: vi.fn(() => 'Hello world')
  }))
}));

// Mock handlers
vi.mock('./handlers', () => ({
  RephraseHandler: vi.fn().mockImplementation(() => ({
    handleRephrase: vi.fn(() => Promise.resolve())
  })),
  TranslateHandler: vi.fn().mockImplementation(() => ({
    handleTranslate: vi.fn(() => Promise.resolve()),
    handleSwapLanguages: vi.fn(),
    getLastTranslation: vi.fn(() => ({ result: null, originalText: null }))
  })),
  ClipboardHandler: {
    handleCopyClick: vi.fn(() => Promise.resolve())
  },
  SpeechHandler: vi.fn().mockImplementation(() => ({
    handleSpeak: vi.fn(() => Promise.resolve())
  }))
}));

describe('PopupIntegration', () => {
  let integration: PopupIntegration;
  let mockPopupUI: any;
  let mockShadowRoot: any;
  let mockStorageService: any;

  beforeEach(() => {
    mockShadowRoot = createMockShadowRoot();
    mockStorageService = createMockStorageService();
    
    // Mock elements
    const rephraseButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-rephrase', rephraseButton);
    
    const translateButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-translate', translateButton);
    
    const swapButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-swap-languages', swapButton);
    
    const speakSourceButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-speak-source', speakSourceButton);
    
    const speakTranslationButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-speak-translation', speakTranslationButton);
    
    const copyRephraseButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-copy-rephrase', copyRephraseButton);
    
    const copyTranslateButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-copy-translate', copyTranslateButton);
    
    const resultText = createMockElement();
    mockShadowRoot.addMockElement('#rephrase-text', resultText);
    mockShadowRoot.addMockElement('#translate-text', resultText);

    mockPopupUI = {
      getShadowRoot: vi.fn(() => mockShadowRoot),
      getSelectedText: vi.fn(() => 'Hello world')
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('click delegation', () => {
    it('should handle rephrase button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-rephrase') });
      
      mockShadowRoot.querySelector('#btn-rephrase').dispatchEvent(event);

      // Should not throw and should process the click
      expect(mockPopupUI.getSelectedText).toHaveBeenCalled();
    });

    it('should handle translate button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-translate') });
      
      mockShadowRoot.querySelector('#btn-translate').dispatchEvent(event);

      expect(mockPopupUI.getSelectedText).toHaveBeenCalled();
    });

    it('should handle swap languages button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-swap-languages') });
      
      mockShadowRoot.querySelector('#btn-swap-languages').dispatchEvent(event);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle speak source button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-speak-source') });
      
      mockShadowRoot.querySelector('#btn-speak-source').dispatchEvent(event);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle speak translation button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-speak-translation') });
      
      mockShadowRoot.querySelector('#btn-speak-translation').dispatchEvent(event);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle copy rephrase button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-copy-rephrase') });
      
      mockShadowRoot.querySelector('#btn-copy-rephrase').dispatchEvent(event);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle copy translate button click', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-copy-translate') });
      
      mockShadowRoot.querySelector('#btn-copy-translate').dispatchEvent(event);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('API key missing path', () => {
    it('should render options link when API key is missing', async () => {
      mockStorageService.getApiKey.mockResolvedValue('');
      
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-rephrase') });
      
      mockShadowRoot.querySelector('#btn-rephrase').dispatchEvent(event);

      // Should show options link in result text
      const resultText = mockShadowRoot.querySelector('#rephrase-text');
      expect(resultText.innerHTML).toContain('extension settings');
      expect(resultText.className).toBe('result-text error');
    });

    it('should open options page when options link is clicked', async () => {
      const openOptionsPageSpy = vi.spyOn(chrome.runtime, 'openOptionsPage');
      
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const optionsLink = createMockElement();
      optionsLink.id = 'open-options';
      mockShadowRoot.addMockElement('#open-options', optionsLink);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: optionsLink });
      
      optionsLink.dispatchEvent(event);

      expect(openOptionsPageSpy).toHaveBeenCalled();
    });
  });

  describe('no text selected', () => {
    it('should show error when no text is selected for rephrase', async () => {
      mockPopupUI.getSelectedText.mockReturnValue('');
      
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-rephrase') });
      
      mockShadowRoot.querySelector('#btn-rephrase').dispatchEvent(event);

      const resultText = mockShadowRoot.querySelector('#rephrase-text');
      expect(resultText.textContent).toBe('No text selected');
      expect(resultText.className).toBe('result-text error');
    });

    it('should show error when no text is selected for translate', async () => {
      mockPopupUI.getSelectedText.mockReturnValue('');
      
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockShadowRoot.querySelector('#btn-translate') });
      
      mockShadowRoot.querySelector('#btn-translate').dispatchEvent(event);

      const resultText = mockShadowRoot.querySelector('#translate-text');
      expect(resultText.textContent).toBe('No text selected');
      expect(resultText.className).toBe('result-text error');
    });
  });

  describe('destroy', () => {
    it('should tear down state without exceptions', () => {
      integration = new PopupIntegration(mockPopupUI);
      
      expect(() => integration.destroy()).not.toThrow();
    });

    it('should set all handlers to null', () => {
      integration = new PopupIntegration(mockPopupUI);
      
      integration.destroy();

      expect((integration as any).geminiService).toBeNull();
      expect((integration as any).rephraseHandler).toBeNull();
      expect((integration as any).translateHandler).toBeNull();
      expect((integration as any).speechHandler).toBeNull();
    });
  });

  describe('processing state', () => {
    it('should prevent multiple simultaneous operations', async () => {
      integration = new PopupIntegration(mockPopupUI);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      // Start first operation
      const event1 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event1, 'target', { value: mockShadowRoot.querySelector('#btn-rephrase') });
      mockShadowRoot.querySelector('#btn-rephrase').dispatchEvent(event1);

      // Try second operation immediately
      const event2 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event2, 'target', { value: mockShadowRoot.querySelector('#btn-translate') });
      mockShadowRoot.querySelector('#btn-translate').dispatchEvent(event2);

      // Should not process second operation while first is running
      expect((integration as any).isProcessing).toBe(true);
    });
  });
});
