import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSelectedText, getSelectionRect, isValidSelection, getSelectionInfo } from './selection-utils';
import { createMockRange } from '../test/test-utils';
import { createMockDOMRect } from '../test/test-utils';

describe('Selection Utils', () => {
  let mockSelection: any;

  beforeEach(() => {
    mockSelection = {
      toString: vi.fn(),
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn(),
      removeAllRanges: vi.fn(),
      addRange: vi.fn()
    };
    
    global.getSelection = vi.fn(() => mockSelection);
  });

  describe('getSelectedText', () => {
    it('should return selected text when selection exists', () => {
      mockSelection.toString.mockReturnValue('  selected text  ');
      
      const result = getSelectedText();
      
      expect(result).toBe('selected text');
    });

    it('should return null when no selection', () => {
      global.getSelection = vi.fn(() => null);
      
      const result = getSelectedText();
      
      expect(result).toBeNull();
    });

    it('should return null when selection is collapsed', () => {
      mockSelection.isCollapsed = true;
      
      const result = getSelectedText();
      
      expect(result).toBeNull();
    });

    it('should trim whitespace from selection', () => {
      mockSelection.toString.mockReturnValue('  text  ');
      
      const result = getSelectedText();
      
      expect(result).toBe('text');
    });
  });

  describe('getSelectionRect', () => {
    it('should return DOMRect for valid selection', () => {
      const mockRect = createMockDOMRect(10, 20, 100, 30);
      const mockRange = {
        getClientRects: vi.fn(() => [mockRect])
      };
      
      mockSelection.getRangeAt.mockReturnValue(mockRange);
      
      const result = getSelectionRect();
      
      expect(result).toEqual(mockRect);
    });

    it('should return last rect when multiple rects exist', () => {
      const rect1 = createMockDOMRect(10, 20, 50, 30);
      const rect2 = createMockDOMRect(60, 20, 50, 30);
      const mockRange = {
        getClientRects: vi.fn(() => [rect1, rect2])
      };
      
      mockSelection.getRangeAt.mockReturnValue(mockRange);
      
      const result = getSelectionRect();
      
      expect(result).toEqual(rect2);
    });

    it('should return null for invalid rect (zero dimensions)', () => {
      const mockRect = createMockDOMRect(10, 20, 0, 0);
      const mockRange = {
        getClientRects: vi.fn(() => [mockRect])
      };
      
      mockSelection.getRangeAt.mockReturnValue(mockRange);
      
      const result = getSelectionRect();
      
      expect(result).toBeNull();
    });

    it('should fallback to getBoundingClientRect when no client rects', () => {
      const mockRect = createMockDOMRect(10, 20, 100, 30);
      const mockRange = {
        getClientRects: vi.fn(() => []),
        getBoundingClientRect: vi.fn(() => mockRect)
      };
      
      mockSelection.getRangeAt.mockReturnValue(mockRange);
      
      const result = getSelectionRect();
      
      expect(result).toEqual(mockRect);
    });
  });

  describe('isValidSelection', () => {
    it('should return true for valid text above min length', () => {
      expect(isValidSelection('hello', 3)).toBe(true);
    });

    it('should return false for text below min length', () => {
      expect(isValidSelection('hi', 3)).toBe(false);
    });

    it('should return false for null text', () => {
      expect(isValidSelection(null, 3)).toBe(false);
    });

    it('should return false for whitespace-only text', () => {
      expect(isValidSelection('   ', 3)).toBe(false);
    });
  });

  describe('getSelectionInfo', () => {
    it('should return combined selection info', () => {
      const mockRect = createMockDOMRect(10, 20, 100, 30);
      const mockRange = createMockRange();
      mockRange.getClientRects = vi.fn(() => [mockRect] as any as DOMRectList);
      
      mockSelection.toString.mockReturnValue('selected text');
      mockSelection.getRangeAt.mockReturnValue(mockRange);
      
      const result = getSelectionInfo();
      
      expect(result).toEqual({
        text: 'selected text',
        rect: mockRect,
        context: expect.any(Object)
      });
    });

    it('should return null when text or rect is missing', () => {
      mockSelection.toString.mockReturnValue('');
      mockSelection.getRangeAt.mockReturnValue(createMockRange());
      
      const result = getSelectionInfo();
      
      expect(result).toBeNull();
    });
  });
});
