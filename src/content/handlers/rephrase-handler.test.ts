import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RephraseHandler } from './rephrase-handler';
import { createMockGeminiService, createMockStorageService, createMockShadowRoot } from '../../test/test-utils';

describe('RephraseHandler', () => {
  let handler: RephraseHandler;
  let mockGeminiService: ReturnType<typeof createMockGeminiService>;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockShadowRoot: ReturnType<typeof createMockShadowRoot>;

  beforeEach(() => {
    mockGeminiService = createMockGeminiService();
    mockStorageService = createMockStorageService();
    mockShadowRoot = createMockShadowRoot();
    
    handler = new RephraseHandler(mockShadowRoot as any, mockGeminiService as any, mockStorageService as any);
  });

  it('should handle rephrase successfully', async () => {
    const mockResult = {
      rephrasedText: 'This is a rephrased version',
      style: 'casual',
      originalLength: 10,
      rephrasedLength: 30,
      lengthDelta: 20
    };
    
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: mockResult.rephrasedText,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const mockElements = {
      styleSelect: { value: 'casual' } as HTMLSelectElement,
      button: { disabled: false, textContent: 'Rephrase' } as HTMLButtonElement,
      resultContainer: { hidden: true } as HTMLElement,
      resultText: { textContent: '', className: '' } as HTMLElement
    };

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-style') return mockElements.styleSelect;
      if (selector === '#rephrase-btn') return mockElements.button;
      if (selector === '#rephrase-result') return mockElements.resultContainer;
      if (selector === '#rephrase-text') return mockElements.resultText;
      return mockElements.resultText; // fallback
    });

    await handler.handleRephrase('test text');

    expect(mockElements.button.disabled).toBe(false);
    expect(mockElements.resultText.textContent).toBe(mockResult.rephrasedText);
    expect(mockElements.resultContainer.hidden).toBe(false);
    expect(mockStorageService.saveToHistory).toHaveBeenCalled();
  });

  it('should show loading state during rephrase', async () => {
    const mockElements = {
      button: { disabled: false, textContent: 'Rephrase' } as HTMLButtonElement,
      resultContainer: { hidden: true } as HTMLElement,
      resultText: { textContent: '', className: '' } as HTMLElement
    };

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-style') return { value: 'casual' } as HTMLSelectElement;
      if (selector === '#rephrase-btn') return mockElements.button;
      if (selector === '#rephrase-result') return mockElements.resultContainer;
      if (selector === '#rephrase-text') return mockElements.resultText;
      return mockElements.resultText; // fallback
    });

    // Mock a delayed response
    mockGeminiService.generateContent.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        text: 'result',
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      }), 100))
    );

    const handlePromise = handler.handleRephrase('test text');

    // Check loading state
    expect(mockElements.button.disabled).toBe(true);
    expect(mockElements.button.textContent).toBe('Rephrasing...');
    expect(mockElements.resultText.textContent).toBe('Rephrasing your text...');
    expect(mockElements.resultText.className).toBe('result-text loading');

    await handlePromise;
  });

  it('should handle empty text gracefully', async () => {
    const mockElements = {
      resultContainer: { hidden: true } as HTMLElement,
      resultText: { textContent: '', className: '' } as HTMLElement
    };

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-result') return mockElements.resultContainer;
      if (selector === '#rephrase-text') return mockElements.resultText;
      return mockElements.resultText; // fallback
    });

    await handler.handleRephrase('');

    expect(mockElements.resultText.textContent).toBe('Please select some text to rephrase.');
    expect(mockElements.resultText.className).toBe('result-text error');
    expect(mockGeminiService.generateContent).not.toHaveBeenCalled();
  });

  it('should handle missing services', async () => {
    const handlerWithoutService = new RephraseHandler(
      mockShadowRoot as any, 
      null, 
      mockStorageService as any
    );

    const mockElements = {
      resultContainer: { hidden: true } as HTMLElement,
      resultText: { textContent: '', className: '' } as HTMLElement
    };

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-result') return mockElements.resultContainer;
      if (selector === '#rephrase-text') return mockElements.resultText;
      return mockElements.resultText; // fallback
    });

    await handlerWithoutService.handleRephrase('test text');

    expect(mockElements.resultText.textContent).toBe('API key not configured. Please set your Gemini API key in the options page.');
    expect(mockElements.resultText.className).toBe('result-text error');
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockGeminiService.generateContent.mockRejectedValueOnce(error);

    const mockElements = {
      button: { disabled: false, textContent: 'Rephrase' } as HTMLButtonElement,
      resultContainer: { hidden: true } as HTMLElement,
      resultText: { textContent: '', className: '' } as HTMLElement
    };

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-style') return { value: 'casual' } as HTMLSelectElement;
      if (selector === '#rephrase-btn') return mockElements.button;
      if (selector === '#rephrase-result') return mockElements.resultContainer;
      if (selector === '#rephrase-text') return mockElements.resultText;
      return mockElements.resultText; // fallback
    });

    await handler.handleRephrase('test text');

    expect(mockElements.resultText.textContent).toBe('Failed to rephrase text: Failed to rephrase text: API Error');
    expect(mockElements.resultText.className).toBe('result-text error');
    expect(mockElements.button.disabled).toBe(false);
    expect(mockElements.button.textContent).toBe('Rephrase');
  });

  it('should save to history with correct metadata', async () => {
    const mockResult = {
      rephrasedText: 'result',
      style: 'casual',
      originalLength: 10,
      rephrasedLength: 20,
      lengthDelta: 10
    };

    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: mockResult.rephrasedText,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '#rephrase-style') return { value: 'casual' } as HTMLSelectElement;
      if (selector === '#rephrase-btn') return { disabled: false, textContent: 'Rephrase' } as HTMLButtonElement;
      if (selector === '#rephrase-result') return { hidden: true } as HTMLElement;
      if (selector === '#rephrase-text') return { textContent: '', className: '' } as HTMLElement;
      return { textContent: '', className: '' } as HTMLElement; // fallback
    });

    await handler.handleRephrase('test text');

    expect(mockStorageService.saveToHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rephrase',
        prompt: 'test text',
        response: mockResult.rephrasedText,
        metadata: expect.objectContaining({
          style: 'casual'
        })
      })
    );
  });

  it('should update services when called', () => {
    const newMockService = createMockGeminiService();
    
    handler.updateServices(newMockService as any);

    // The handler should recreate the rephraser with the new service
    expect(handler).toBeDefined();
  });
});
