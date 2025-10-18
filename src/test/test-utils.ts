import { vi } from 'vitest';

export function createMockGeminiService() {
  return {
    generateContent: vi.fn(() => Promise.resolve({ 
      text: 'mock response', 
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 } 
    })),
    streamContent: vi.fn(async function* () { 
      yield { text: 'chunk', isComplete: false }; 
      yield { text: 'chunk', isComplete: true }; 
    }),
    testConnection: vi.fn(() => Promise.resolve(true)),
    isInitialized: vi.fn(() => true),
    getApiKey: vi.fn(() => 'mock-api-key'),
    setApiKey: vi.fn(),
    ensureInitialized: vi.fn(() => Promise.resolve())
  } as any;
}

export function createMockStorageService() {
  return {
    getApiKey: vi.fn(() => Promise.resolve('mock-api-key')),
    setApiKey: vi.fn(() => Promise.resolve()),
    getHistory: vi.fn(() => Promise.resolve([])),
    saveToHistory: vi.fn(() => Promise.resolve()),
    getFavorites: vi.fn(() => Promise.resolve([])),
    addToFavorites: vi.fn(() => Promise.resolve())
  };
}

export function createMockShadowRoot() {
  const mockElements: Record<string, HTMLElement> = {};
  
  return {
    querySelector: vi.fn((selector) => mockElements[selector] || null),
    querySelectorAll: vi.fn((selector) => []),
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addMockElement: (selector: string, element: HTMLElement) => {
      mockElements[selector] = element;
    }
  };
}

export function waitFor(condition: () => boolean, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    
    check();
  });
}

export function createMockDOMRect(x = 0, y = 0, width = 100, height = 50) {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({ x, y, width, height, top: y, right: x + width, bottom: y + height, left: x })
  } as DOMRect;
}

export function createMockElement(): HTMLElement & { value: string; disabled: boolean; hidden: boolean } {
  return {
    textContent: '',
    innerHTML: '',
    className: '',
    value: '', // Add value property for form elements
    disabled: false,
    hidden: false,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
      item: vi.fn(),
      length: 0
    },
    style: {
      left: '',
      width: '',
      height: '',
      top: ''
    },
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    getRootNode: vi.fn(() => ({ querySelectorAll: vi.fn(), querySelector: vi.fn() })),
    getBoundingClientRect: vi.fn(() => createMockDOMRect())
  } as any;
}

export function createMockRange(): Range {
  return {
    cloneRange: vi.fn(() => createMockRange()),
    setStart: vi.fn(),
    setEnd: vi.fn(),
    getClientRects: vi.fn(() => [createMockDOMRect()]),
    getBoundingClientRect: vi.fn(() => createMockDOMRect()),
    startContainer: document.createTextNode(''),
    endContainer: document.createTextNode(''),
    startOffset: 0,
    endOffset: 0
  } as any;
}
