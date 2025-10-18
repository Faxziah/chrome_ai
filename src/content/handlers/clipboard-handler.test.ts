import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClipboardHandler } from './clipboard-handler';
import { createMockElement } from '../../test/test-utils';

describe('ClipboardHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should copy text using Clipboard API', async () => {
    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true
    });

    const result = await ClipboardHandler.copyToClipboard('test text');

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('test text');
  });

  it('should fallback to execCommand when Clipboard API fails', async () => {
    const mockWriteText = vi.fn(() => Promise.reject(new Error('Clipboard API failed')));
    const mockExecCommand = vi.fn(() => true);
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true
    });

    // Mock document methods
    const mockTextarea = {
      value: '',
      style: {
        position: '',
        left: '',
        top: '',
        opacity: ''
      },
      focus: vi.fn(),
      select: vi.fn()
    };
    
    const mockCreateElement = vi.fn(() => mockTextarea);
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true
    });
    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
      writable: true
    });
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
      writable: true
    });

    const result = await ClipboardHandler.copyToClipboard('test text');

    expect(result).toBe(true);
    expect(mockTextarea.value).toBe('test text');
    expect(mockTextarea.style.position).toBe('fixed');
    expect(mockTextarea.style.left).toBe('-999999px');
    expect(mockTextarea.style.top).toBe('-999999px');
    expect(mockTextarea.style.opacity).toBe('0');
    expect(mockAppendChild).toHaveBeenCalledWith(mockTextarea);
    expect(mockTextarea.focus).toHaveBeenCalled();
    expect(mockTextarea.select).toHaveBeenCalled();
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
    expect(mockRemoveChild).toHaveBeenCalledWith(mockTextarea);
  });

  it('should return false when both methods fail', async () => {
    const mockWriteText = vi.fn(() => Promise.reject(new Error('Clipboard API failed')));
    const mockExecCommand = vi.fn(() => false);
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true
    });

    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true
    });

    const result = await ClipboardHandler.copyToClipboard('test text');

    expect(result).toBe(false);
  });

  it('should show copy feedback on button', () => {
    const mockButton = {
      textContent: 'Copy',
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    };

    ClipboardHandler.showCopyFeedback(mockButton as any, 1000);

    expect(mockButton.textContent).toBe('✓ Copied!');
    expect(mockButton.classList.add).toHaveBeenCalledWith('copied');

    // Wait for timeout
    setTimeout(() => {
      expect(mockButton.textContent).toBe('Copy');
      expect(mockButton.classList.remove).toHaveBeenCalledWith('copied');
    }, 1000);
  });

  it('should handle copy click event', async () => {
    const mockResultElement = {
      textContent: '  test result  '
    };
    
    const mockButton = createMockElement();
    mockButton.textContent = 'Copy';
    
    const mockShadowRoot = {
      querySelector: vi.fn((selector) => {
        if (selector === '#result-id') return mockResultElement;
        return null;
      })
    };

    const mockEvent = {
      target: { closest: vi.fn(() => mockButton) }
    };

    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true
    });

    await ClipboardHandler.handleCopyClick(mockEvent as any, mockShadowRoot as any, 'result-id');

    expect(mockWriteText).toHaveBeenCalledWith('test result');
    expect(mockButton.textContent).toBe('✓ Copied!');
    expect(mockButton.classList.add).toHaveBeenCalledWith('copied');
  });

  it('should handle missing result element', async () => {
    const mockShadowRoot = {
      querySelector: vi.fn(() => null)
    };

    const mockEvent = {
      target: { closest: vi.fn(() => mockButton) }
    };

    const mockButton = {
      textContent: 'Copy',
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    };

    const mockWriteText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true
    });

    await ClipboardHandler.handleCopyClick(mockEvent as any, mockShadowRoot as any, 'result-id');

    expect(mockWriteText).not.toHaveBeenCalled();
  });
});
