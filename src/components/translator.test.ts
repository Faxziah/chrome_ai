import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Translator } from './translator';
import { createMockGeminiService } from '../test/test-utils';

describe('Translator', () => {
  let mockGeminiService: ReturnType<typeof createMockGeminiService>;
  let translator: Translator;

  beforeEach(() => {
    mockGeminiService = createMockGeminiService();
    translator = new Translator(mockGeminiService as any);
  });

  it('should translate text from auto-detect to target language', async () => {
    const mockResponse = 'Detected: en\nПривет, мир!';
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: mockResponse,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const result = await translator.translate('Hello, world!', {
      sourceLanguage: 'auto',
      targetLanguage: 'ru'
    });

    expect(result.translatedText).toBe('Привет, мир!');
    expect(result.detectedLanguage).toBe('en');
    expect(result.sourceLanguage).toBe('en');
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Определи язык'),
      expect.objectContaining({
        temperature: 0.5,
        maxTokens: 2048
      })
    );
  });

  it('should translate with explicit source language', async () => {
    const mockResponse = 'Привет, мир!';
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: mockResponse,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const result = await translator.translate('Hello, world!', {
      sourceLanguage: 'en',
      targetLanguage: 'ru'
    });

    expect(result.translatedText).toBe(mockResponse);
    expect(result.detectedLanguage).toBeUndefined();
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.not.stringContaining('auto-detect'),
      expect.any(Object)
    );
  });

  it('should throw error for empty text', async () => {
    await expect(translator.translate('', { sourceLanguage: 'en', targetLanguage: 'ru' }))
      .rejects.toThrow('Text cannot be empty');
  });

  it('should throw error for invalid target language', async () => {
    await expect(translator.translate('text', { sourceLanguage: 'en', targetLanguage: '' as any }))
      .rejects.toThrow('Target language is required');
  });

  it('should use correct temperature for translation', async () => {
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: 'translated',
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    await translator.translate('test', { sourceLanguage: 'en', targetLanguage: 'ru' });
    
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        temperature: 0.5,
        maxTokens: 2048
      })
    );
  });

  it('should preserve formatting when configured', async () => {
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: 'translated',
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    await translator.translate('test', { 
      sourceLanguage: 'en', 
      targetLanguage: 'ru',
      preserveFormatting: true 
    });
    
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Сохрани форматирование'),
      expect.any(Object)
    );
  });

  it('should calculate compression ratio', async () => {
    const originalText = 'short';
    const translatedText = 'This is a much longer translated version.';
    
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: translatedText,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const result = await translator.translate(originalText, { 
      sourceLanguage: 'en', 
      targetLanguage: 'ru' 
    });
    
    expect(result.compressionRatio).toBe(translatedText.length / originalText.length);
  });

  it('should parse detected language from response', async () => {
    const testCases = [
      { response: 'Detected: en\nText', expected: 'en' },
      { response: 'detected: fr\nText', expected: 'fr' },
      { response: 'DETECTED: es\nText', expected: 'es' }
    ];

    for (const testCase of testCases) {
      mockGeminiService.generateContent.mockResolvedValueOnce({
        text: testCase.response,
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      });

      const result = await translator.translate('test', { 
        sourceLanguage: 'auto', 
        targetLanguage: 'ru' 
      });
      
      expect(result.detectedLanguage).toBe(testCase.expected);
    }
  });

  it('should support streaming with translateWithStream', async () => {
    const chunks = ['chunk1', 'chunk2', 'final'];
    const mockStream = async function* () {
      for (const chunk of chunks) {
        yield { text: chunk, isComplete: false };
      }
      yield { text: '', isComplete: true };
    };
    
    mockGeminiService.streamContent.mockReturnValueOnce(mockStream());

    const collectedChunks: string[] = [];
    const result = await translator.translateWithStream('test', { 
      sourceLanguage: 'en', 
      targetLanguage: 'ru' 
    }, (chunk) => {
      collectedChunks.push(chunk);
    });

    expect(collectedChunks).toEqual(chunks);
    expect(result.translatedText).toBe(chunks.join(''));
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    mockGeminiService.generateContent.mockRejectedValueOnce(error);

    await expect(translator.translate('test', { sourceLanguage: 'en', targetLanguage: 'ru' }))
      .rejects.toThrow('Translation failed: API Error');
  });
});
