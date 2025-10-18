import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
    openOptionsPage: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  storage: {
    local: {
      get: vi.fn((keys) => Promise.resolve({})),
      set: vi.fn((items) => Promise.resolve()),
      remove: vi.fn((keys) => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve())
    }
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn(() => Promise.resolve([]))
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  }
} as any;

// Mock window.speechSynthesis
Object.defineProperty(global, 'speechSynthesis', {
  value: {
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
  },
  writable: true,
  configurable: true
});

// Mock window.getSelection
global.getSelection = vi.fn(() => ({
  toString: () => '',
  rangeCount: 0,
  isCollapsed: true,
  getRangeAt: vi.fn(),
  removeAllRanges: vi.fn(),
  addRange: vi.fn()
})) as any;
