import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranslateHandler } from './translate-handler';
import { createMockGeminiService, createMockStorageService, createMockShadowRoot, createMockElement } from '../../test/test-utils';

describe('TranslateHandler', () => {
  let handler: TranslateHandler;
  let mockGeminiService: any;
  let mockStorageService: any;
  let mockShadowRoot: any;

  beforeEach(() => {
    mockGeminiService = createMockGeminiService();
    mockStorageService = createMockStorageService();
    mockShadowRoot = createMockShadowRoot();
    
    // Mock elements
    const sourceSelect = createMockElement();
    sourceSelect.value = 'auto';
    mockShadowRoot.addMockElement('#source-language', sourceSelect);
    
    const targetSelect = createMockElement();
    targetSelect.value = 'en';
    mockShadowRoot.addMockElement('#target-language', targetSelect);
    
    const button = createMockElement();
    mockShadowRoot.addMockElement('#btn-translate', button);
    
    const resultContainer = createMockElement();
    mockShadowRoot.addMockElement('#translate-result', resultContainer);
    
    const resultText = createMockElement();
    mockShadowRoot.addMockElement('#translate-text', resultText);
    
    const swapButton = createMockElement();
    mockShadowRoot.addMockElement('#btn-swap-languages', swapButton);

    handler = new TranslateHandler(mockShadowRoot, mockGeminiService, mockStorageService);
  });

  describe('handleTranslate', () => {
    it('should show loading state and render result on successful translation', async () => {
      const selectedText = 'Hello world';
      const mockResult = {
        translatedText: 'Hola mundo',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        detectedLanguage: 'en',
        originalLength: 11,
        translatedLength: 10,
        compressionRatio: 0.91
      };

      mockGeminiService.generateContent.mockResolvedValue({
        text: JSON.stringify(mockResult),
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      });

      await handler.handleTranslate(selectedText);

      const button = mockShadowRoot.querySelector('#btn-translate');
      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      const resultText = mockShadowRoot.querySelector('#translate-text');

      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Translating...');
      expect(resultContainer.hidden).toBe(false);
      expect(resultText.textContent).toBe('Hola mundo');
      expect(mockStorageService.saveToHistory).toHaveBeenCalledWith({
        type: 'translate',
        prompt: selectedText,
        response: 'Hola mundo',
        metadata: expect.objectContaining({
          sourceLanguage: 'en',
          targetLanguage: 'es',
          detectedLanguage: 'en'
        })
      });
    });

    it('should update source language from detected language', async () => {
      const selectedText = 'Hello world';
      const mockResult = {
        translatedText: 'Hola mundo',
        sourceLanguage: 'auto',
        targetLanguage: 'es',
        detectedLanguage: 'en',
        originalLength: 11,
        translatedLength: 10,
        compressionRatio: 0.91
      };

      mockGeminiService.generateContent.mockResolvedValue({
        text: JSON.stringify(mockResult),
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      });

      await handler.handleTranslate(selectedText);

      const sourceSelect = mockShadowRoot.querySelector('#source-language');
      expect(sourceSelect.value).toBe('en');
    });

    it('should enable swap button after successful translation', async () => {
      const selectedText = 'Hello world';
      const mockResult = {
        translatedText: 'Hola mundo',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        detectedLanguage: 'en',
        originalLength: 11,
        translatedLength: 10,
        compressionRatio: 0.91
      };

      mockGeminiService.generateContent.mockResolvedValue({
        text: JSON.stringify(mockResult),
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      });

      await handler.handleTranslate(selectedText);

      const swapButton = mockShadowRoot.querySelector('#btn-swap-languages');
      expect(swapButton.disabled).toBe(false);
    });

    it('should show error message and restore button state on error', async () => {
      const selectedText = 'Hello world';
      const error = new Error('Translation failed');
      
      mockGeminiService.generateContent.mockRejectedValue(error);

      await handler.handleTranslate(selectedText);

      const button = mockShadowRoot.querySelector('#btn-translate');
      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      const resultText = mockShadowRoot.querySelector('#translate-text');

      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Translate');
      expect(resultContainer.hidden).toBe(false);
      expect(resultText.textContent).toBe('Failed to translate text: Translation failed');
      expect(resultText.className).toBe('result-text error');
    });

    it('should show error when source and target languages are the same', async () => {
      const sourceSelect = mockShadowRoot.querySelector('#source-language');
      const targetSelect = mockShadowRoot.querySelector('#target-language');
      sourceSelect.value = 'en';
      targetSelect.value = 'en';

      await handler.handleTranslate('Hello world');

      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      const resultText = mockShadowRoot.querySelector('#translate-text');

      expect(resultContainer.hidden).toBe(false);
      expect(resultText.textContent).toBe('Source and target languages cannot be the same.');
      expect(resultText.className).toBe('result-text error');
    });

    it('should show error when no text is selected', async () => {
      await handler.handleTranslate('');

      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      const resultText = mockShadowRoot.querySelector('#translate-text');

      expect(resultContainer.hidden).toBe(false);
      expect(resultText.textContent).toBe('Please select some text to translate.');
      expect(resultText.className).toBe('result-text error');
    });

    it('should show error when API key is not configured', async () => {
      const handlerWithoutApi = new TranslateHandler(mockShadowRoot, null, mockStorageService);
      
      await handlerWithoutApi.handleTranslate('Hello world');

      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      const resultText = mockShadowRoot.querySelector('#translate-text');

      expect(resultContainer.hidden).toBe(false);
      expect(resultText.textContent).toBe('API key not configured. Please set your Gemini API key in the options page.');
      expect(resultText.className).toBe('result-text error');
    });
  });

  describe('handleSwapLanguages', () => {
    it('should swap source and target languages', () => {
      const sourceSelect = mockShadowRoot.querySelector('#source-language');
      const targetSelect = mockShadowRoot.querySelector('#target-language');
      sourceSelect.value = 'en';
      targetSelect.value = 'es';

      handler.handleSwapLanguages();

      expect(sourceSelect.value).toBe('es');
      expect(targetSelect.value).toBe('en');
    });

    it('should handle auto-detect case with detected language', () => {
      const sourceSelect = mockShadowRoot.querySelector('#source-language');
      const targetSelect = mockShadowRoot.querySelector('#target-language');
      sourceSelect.value = 'auto';
      targetSelect.value = 'es';

      // Set up last translation result
      const mockResult = {
        translatedText: 'Hola mundo',
        sourceLanguage: 'auto',
        targetLanguage: 'es',
        detectedLanguage: 'en',
        originalLength: 11,
        translatedLength: 10,
        compressionRatio: 0.91
      };

      // Simulate having a previous translation
      (handler as any).lastTranslationResult = mockResult;

      handler.handleSwapLanguages();

      expect(sourceSelect.value).toBe('es');
      expect(targetSelect.value).toBe('en');
    });

    it('should clear results and enable translate button', () => {
      const resultContainer = mockShadowRoot.querySelector('#translate-result');
      resultContainer.hidden = false;

      handler.handleSwapLanguages();

      expect(resultContainer.hidden).toBe(true);
      
      const translateButton = mockShadowRoot.querySelector('#btn-translate');
      expect(translateButton.disabled).toBe(false);
    });
  });

  describe('getLastTranslation', () => {
    it('should return last translation result and original text', () => {
      const mockResult = {
        translatedText: 'Hola mundo',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        detectedLanguage: 'en',
        originalLength: 11,
        translatedLength: 10,
        compressionRatio: 0.91
      };

      (handler as any).lastTranslationResult = mockResult;
      (handler as any).lastOriginalText = 'Hello world';

      const result = handler.getLastTranslation();

      expect(result.result).toBe(mockResult);
      expect(result.originalText).toBe('Hello world');
    });
  });

  describe('updateServices', () => {
    it('should update gemini service and recreate translator', () => {
      const newGeminiService = createMockGeminiService();

      handler.updateServices(newGeminiService);

      expect((handler as any).geminiService).toBe(newGeminiService);
      expect((handler as any).translator).toBeTruthy();
    });

    it('should set services to null when null is passed', () => {
      handler.updateServices(null);

      expect((handler as any).geminiService).toBeNull();
      expect((handler as any).translator).toBeNull();
    });
  });
});
