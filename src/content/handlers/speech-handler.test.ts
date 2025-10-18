import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechHandler } from './speech-handler';
import { createMockShadowRoot } from '../../test/test-utils';

describe('SpeechHandler', () => {
  let handler: SpeechHandler;
  let mockShadowRoot: any;
  let mockSpeechManager: any;

  beforeEach(() => {
    mockShadowRoot = createMockShadowRoot();
    
    mockSpeechManager = {
      isSupported: vi.fn(() => true),
      stop: vi.fn(),
      speak: vi.fn(() => Promise.resolve())
    };

    handler = new SpeechHandler(mockShadowRoot, mockSpeechManager);
  });

  describe('handleSpeak', () => {
    it('should speak source text with original language', async () => {
      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          detectedLanguage: 'en',
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      await handler.handleSpeak('source', translationData);

      expect(mockSpeechManager.stop).toHaveBeenCalled();
      expect(mockSpeechManager.speak).toHaveBeenCalledWith({
        text: 'Hello world',
        languageCode: 'en'
      });
    });

    it('should speak translation text with target language', async () => {
      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          detectedLanguage: 'en',
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      await handler.handleSpeak('translation', translationData);

      expect(mockSpeechManager.stop).toHaveBeenCalled();
      expect(mockSpeechManager.speak).toHaveBeenCalledWith({
        text: 'Hola mundo',
        languageCode: 'es'
      });
    });

    it('should use detected language when source language is auto', async () => {
      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'auto',
          targetLanguage: 'es',
          detectedLanguage: 'en',
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      await handler.handleSpeak('source', translationData);

      expect(mockSpeechManager.speak).toHaveBeenCalledWith({
        text: 'Hello world',
        languageCode: 'auto'
      });
    });

    it('should fallback to default language when no language detected', async () => {
      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'auto',
          targetLanguage: 'es',
          detectedLanguage: undefined,
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      await handler.handleSpeak('source', translationData);

      expect(mockSpeechManager.speak).toHaveBeenCalledWith({
        text: 'Hello world',
        languageCode: 'auto'
      });
    });

    it('should handle unsupported speech synthesis', async () => {
      const unsupportedHandler = new SpeechHandler(mockShadowRoot, null);
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await unsupportedHandler.handleSpeak('source', { result: null, originalText: 'Hello' });

      expect(alertSpy).toHaveBeenCalledWith('Speech synthesis is not supported in this browser.');
      
      alertSpy.mockRestore();
    });

    it('should handle empty text', async () => {
      const translationData = {
        result: null,
        originalText: ''
      };

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await handler.handleSpeak('source', translationData);

      expect(alertSpy).toHaveBeenCalledWith('No text available to speak.');
      expect(mockSpeechManager.speak).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it('should handle speak() rejection', async () => {
      const error = new Error('Speech synthesis failed');
      mockSpeechManager.speak.mockRejectedValue(error);

      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          detectedLanguage: 'en',
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await handler.handleSpeak('source', translationData);

      expect(alertSpy).toHaveBeenCalledWith('Failed to speak text: Speech synthesis failed');
      
      alertSpy.mockRestore();
    });

    it('should handle unknown error types', async () => {
      mockSpeechManager.speak.mockRejectedValue('Unknown error');

      const translationData = {
        result: {
          translatedText: 'Hola mundo',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          detectedLanguage: 'en',
          originalLength: 11,
          translatedLength: 10,
          compressionRatio: 0.91
        },
        originalText: 'Hello world'
      };

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await handler.handleSpeak('source', translationData);

      expect(alertSpy).toHaveBeenCalledWith('Failed to speak text: Unknown error');
      
      alertSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should stop speech synthesis', () => {
      handler.stop();

      expect(mockSpeechManager.stop).toHaveBeenCalled();
    });

    it('should handle null speech manager', () => {
      const handlerWithoutManager = new SpeechHandler(mockShadowRoot, null);
      
      expect(() => handlerWithoutManager.stop()).not.toThrow();
    });
  });

  describe('isSupported', () => {
    it('should return true when speech synthesis is supported', () => {
      expect(handler.isSupported()).toBe(true);
    });

    it('should return false when speech manager is null', () => {
      const handlerWithoutManager = new SpeechHandler(mockShadowRoot, null);
      
      expect(handlerWithoutManager.isSupported()).toBe(false);
    });

    it('should return false when speech manager reports unsupported', () => {
      mockSpeechManager.isSupported.mockReturnValue(false);
      
      expect(handler.isSupported()).toBe(false);
    });
  });
});
