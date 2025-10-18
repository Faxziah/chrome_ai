import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpeechSynthesisManager } from './speech-utils';

describe('SpeechSynthesisManager', () => {
  let speechManager: SpeechSynthesisManager;
  let mockSpeechSynthesis: any;

  beforeEach(() => {
    mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => []),
      speaking: false,
      paused: false,
      pending: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    };

    Object.defineProperty(global, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true
    });
    speechManager = new SpeechSynthesisManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with speech synthesis support', () => {
    expect(speechManager.isSupported()).toBe(true);
    expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
  });

  it('should handle missing speech synthesis gracefully', () => {
    delete (global as any).speechSynthesis;
    const manager = new SpeechSynthesisManager();
    expect(manager.isSupported()).toBe(false);
    
    // Restore for other tests
    Object.defineProperty(global, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true
    });
  });

  it('should load voices on initialization', () => {
    const mockVoices = [
      { name: 'Voice 1', lang: 'en-US', localService: true },
      { name: 'Voice 2', lang: 'ru-RU', localService: false },
      { name: 'Voice 3', lang: 'en-US', localService: false }
    ];
    
    mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
    const manager = new SpeechSynthesisManager();
    
    expect(manager.getVoices()).toEqual(mockVoices);
  });

  it('should speak text with correct configuration', async () => {
    const mockUtterance = {
      text: '',
      lang: '',
      onend: vi.fn(),
      onerror: vi.fn()
    };
    
    const SpeechSynthesisUtteranceMock = vi.fn((text, options) => {
      mockUtterance.text = text || '';
      mockUtterance.lang = options?.lang || '';
      return mockUtterance;
    });
    global.SpeechSynthesisUtterance = SpeechSynthesisUtteranceMock as any;
    
    // Simulate speech ending immediately
    setTimeout(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend();
      }
    }, 10);
    
    await speechManager.speak({ text: 'Hello', languageCode: 'en' });
    
    expect(mockUtterance.text).toBe('Hello');
    expect(mockUtterance.lang).toBe('en-US');
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtterance);
  }, 10000);

  it('should map language codes to locale codes', async () => {
    const testCases = [
      { input: 'en', expected: 'en-US' },
      { input: 'ru', expected: 'ru-RU' },
      { input: 'es', expected: 'es-ES' },
      { input: 'fr', expected: 'fr-FR' }
    ];

    for (const { input, expected } of testCases) {
      const mockUtterance = { text: '', lang: '', onend: vi.fn(), onerror: vi.fn() };
      global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any;
      
      // Simulate speech ending immediately
      setTimeout(() => {
        if (mockUtterance.onend) {
          mockUtterance.onend();
        }
      }, 10);
      
      await speechManager.speak({ text: 'test', languageCode: input });
      expect(mockUtterance.lang).toBe(expected);
    }
  }, 10000);

  it('should find best voice for language', async () => {
    const voices = [
      { name: 'Local Voice', lang: 'en-US', localService: true },
      { name: 'Remote Voice', lang: 'en-US', localService: false },
      { name: 'Other Voice', lang: 'ru-RU', localService: true }
    ];
    
    mockSpeechSynthesis.getVoices.mockReturnValue(voices);
    const manager = new SpeechSynthesisManager();
    
    const mockUtterance = { text: '', lang: '', voice: null, onend: vi.fn(), onerror: vi.fn() };
    global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any;
    
    // Simulate speech ending immediately
    setTimeout(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend();
      }
    }, 10);
    
    await manager.speak({ text: 'test', languageCode: 'en' });
    expect(mockUtterance.voice).toEqual(voices[0]); // Should prefer local voice
  }, 10000);

  it('should cancel ongoing speech before starting new', async () => {
    const mockUtterance = { text: '', lang: '', onend: vi.fn(), onerror: vi.fn() };
    global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any;
    
    // Simulate speech ending immediately
    setTimeout(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend();
      }
    }, 10);
    
    await speechManager.speak({ text: 'First', languageCode: 'en' });
    
    // Simulate speech ending immediately for second call
    setTimeout(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend();
      }
    }, 10);
    
    await speechManager.speak({ text: 'Second', languageCode: 'en' });
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should handle speech errors', async () => {
    const mockUtterance = { 
      text: '', 
      lang: '', 
      onend: vi.fn(), 
      onerror: vi.fn() 
    };
    global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any;
    
    // Simulate speech error
    setTimeout(() => {
      if (mockUtterance.onerror) {
        mockUtterance.onerror({ error: 'Speech error' });
      }
    }, 10);
    
    await expect(speechManager.speak({ text: 'test', languageCode: 'en' }))
      .rejects.toThrow('Speech synthesis error: Speech error');
  }, 10000);

  it('should resolve promise when speech ends', async () => {
    const mockUtterance = { 
      text: '', 
      lang: '', 
      onend: vi.fn(), 
      onerror: vi.fn() 
    };
    global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any;
    
    // Simulate speech ending
    setTimeout(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend();
      }
    }, 10);
    
    await expect(speechManager.speak({ text: 'test', languageCode: 'en' }))
      .resolves.toBeUndefined();
  }, 10000);

  it('should stop ongoing speech', () => {
    speechManager.stop();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should pause and resume speech', () => {
    mockSpeechSynthesis.speaking = true;
    mockSpeechSynthesis.paused = false;
    
    speechManager.pause();
    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    
    mockSpeechSynthesis.paused = true;
    speechManager.resume();
    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
  });

  it('should report speaking state', () => {
    mockSpeechSynthesis.speaking = true;
    expect(speechManager.isSpeaking()).toBe(true);
    
    mockSpeechSynthesis.speaking = false;
    expect(speechManager.isSpeaking()).toBe(false);
  });
});
