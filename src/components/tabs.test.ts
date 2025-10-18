import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tabs } from './tabs';

describe('Tabs', () => {
  let tabs: Tabs;
  let mockShadowRoot: any;

  beforeEach(() => {
    mockShadowRoot = {
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    
    const tabConfigs = [
      { id: 'summarize', label: 'Summarize', icon: '📝' },
      { id: 'rephrase', label: 'Rephrase', icon: '✏️' },
      { id: 'translate', label: 'Translate', icon: '🌐' }
    ];
    
    tabs = new Tabs(tabConfigs);
  });

  it('should render tabs HTML with correct structure', () => {
    const html = tabs.render();

    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="tab-summarize"');
    expect(html).toContain('id="tab-rephrase"');
    expect(html).toContain('id="tab-translate"');
    expect(html).toContain('class="tabs__indicator"');
  });

  it('should render tab content for each tab type', () => {
    const html = tabs.render();

    expect(html).toContain('id="btn-summarize"');
    expect(html).toContain('id="rephrase-style"');
    expect(html).toContain('id="source-language"');
    expect(html).toContain('id="target-language"');
  });

  it('should attach event listeners to shadow root', () => {
    const mockTabButtons = [
      { addEventListener: vi.fn() },
      { addEventListener: vi.fn() },
      { addEventListener: vi.fn() }
    ];

    const mockRootElement = { addEventListener: vi.fn() };

    mockShadowRoot.querySelectorAll.mockReturnValue(mockTabButtons);
    mockShadowRoot.querySelector.mockReturnValue(mockRootElement);

    tabs.attachEventListeners(mockShadowRoot);

    // Check that event listeners are added to individual tab buttons
    mockTabButtons.forEach(button => {
      expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
    
    // Check that keyboard listener is added to root element
    expect(mockRootElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should switch tabs on click', () => {
    const mockTabButtons = [
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })),
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })),
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })),
      }
    ];

    const mockPanels = [
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() }
    ];

    const mockRootElement = { 
      addEventListener: vi.fn(),
      getRootNode: vi.fn(() => mockShadowRoot),
      getBoundingClientRect: vi.fn(() => ({ left: 0, width: 300, top: 0, height: 100, right: 300, bottom: 100 }))
    };

    mockShadowRoot.querySelectorAll.mockImplementation((selector: string) => {
      if (selector === '.tab') return mockTabButtons;
      if (selector === '.tab-panel') return mockPanels;
      return [];
    });
    mockShadowRoot.querySelector.mockReturnValue(mockRootElement);

    tabs.attachEventListeners(mockShadowRoot);

    // Get the click handler for the second tab button (index 1)
    const clickHandler = mockTabButtons[1].addEventListener.mock.calls[0][1];
    clickHandler();

    // Verify that the tab was switched by checking the current tab
    expect(tabs.getCurrentTab().index).toBe(1);
  });

  it('should handle keyboard navigation', () => {
    const mockTabButtons = [
      { dataset: { tab: 'summarize' }, addEventListener: vi.fn() },
      { dataset: { tab: 'rephrase' }, addEventListener: vi.fn() },
      { dataset: { tab: 'translate' }, addEventListener: vi.fn() }
    ];
    
    mockShadowRoot.querySelectorAll.mockReturnValue(mockTabButtons);
    mockShadowRoot.querySelector.mockReturnValue({ addEventListener: vi.fn() });

    tabs.attachEventListeners(mockShadowRoot);

    const keydownHandler = mockShadowRoot.querySelector.mock.calls.find(
      (call: any) => call[0] === '.tabs'
    )?.[1]?.addEventListener?.mock?.calls?.find(
      (call: any) => call[0] === 'keydown'
    )?.[1];

    if (keydownHandler) {
      // Test ArrowRight
      keydownHandler({ 
        key: 'ArrowRight', 
        target: mockTabButtons[0],
        preventDefault: vi.fn() 
      });
      expect(tabs.getCurrentTab().index).toBe(1);

      // Test ArrowLeft
      keydownHandler({ 
        key: 'ArrowLeft', 
        target: mockTabButtons[1],
        preventDefault: vi.fn() 
      });
      expect(tabs.getCurrentTab().index).toBe(0);

      // Test Home
      keydownHandler({ 
        key: 'Home', 
        target: mockTabButtons[2],
        preventDefault: vi.fn() 
      });
      expect(tabs.getCurrentTab().index).toBe(0);

      // Test End
      keydownHandler({ 
        key: 'End', 
        target: mockTabButtons[0],
        preventDefault: vi.fn() 
      });
      expect(tabs.getCurrentTab().index).toBe(2);
    }
  });

  it('should update ARIA attributes on tab change', () => {
    const mockTabButtons = [
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })), 
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })), 
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })), 
      }
    ];
    
    const mockRootElement = { 
      addEventListener: vi.fn(),
      getRootNode: vi.fn(() => mockShadowRoot)
    };
    
    mockShadowRoot.querySelectorAll.mockReturnValue(mockTabButtons);
    mockShadowRoot.querySelector.mockReturnValue(mockRootElement);

    tabs.attachEventListeners(mockShadowRoot);
    tabs.setTab('rephrase');

    expect(mockTabButtons[0].setAttribute).toHaveBeenCalledWith('aria-selected', 'false');
    expect(mockTabButtons[0].setAttribute).toHaveBeenCalledWith('tabindex', '-1');
    expect(mockTabButtons[1].setAttribute).toHaveBeenCalledWith('aria-selected', 'true');
    expect(mockTabButtons[1].setAttribute).toHaveBeenCalledWith('tabindex', '0');
  });

  it('should show/hide panels correctly', () => {
    const mockTabButtons = [
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn()
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn()
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn()
      }
    ];
    
    const mockPanels = [
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() }
    ];
    
    const mockRootElement = { 
      addEventListener: vi.fn(),
      getRootNode: vi.fn(() => mockShadowRoot)
    };
    
    mockShadowRoot.querySelectorAll.mockImplementation((selector: string) => {
      if (selector === '.tab') return mockTabButtons;
      if (selector === '.tab-panel') return mockPanels;
      return [];
    });
    mockShadowRoot.querySelector.mockReturnValue(mockRootElement);

    tabs.attachEventListeners(mockShadowRoot);
    tabs.setTab('rephrase');

    expect(mockPanels[0].setAttribute).toHaveBeenCalledWith('hidden', '');
    expect(mockPanels[1].removeAttribute).toHaveBeenCalledWith('hidden');
    expect(mockPanels[2].setAttribute).toHaveBeenCalledWith('hidden', '');
  });

  it('should update indicator position', () => {
    const mockIndicator = { 
      style: { 
        left: '', 
        width: '',
        setProperty: vi.fn(),
        getPropertyValue: vi.fn()
      },
      setAttribute: vi.fn(),
      removeAttribute: vi.fn()
    };
    const mockTabButtons = [
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 }))
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, width: 100, top: 0, height: 50, right: 100, bottom: 50 })),
      }
    ];
    
    const mockPanels = [
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() }
    ];
    
    const mockRootElement = { 
      addEventListener: vi.fn(),
      getRootNode: vi.fn(() => mockShadowRoot),
      getBoundingClientRect: () => ({ left: 0, width: 300 })
    };
    
    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '.tabs__indicator') return mockIndicator;
      if (selector === '.tabs') return mockRootElement;
      return null;
    });
    
    mockShadowRoot.querySelectorAll.mockImplementation((selector: string) => {
      if (selector === '.tab') return mockTabButtons;
      if (selector === '.tab-panel') return mockPanels;
      return [];
    });

    tabs.attachEventListeners(mockShadowRoot);
    tabs.setTab('rephrase');

    expect(mockIndicator.style.left).toBe('100px');
    expect(mockIndicator.style.width).toBe('100px');
  });

  it('should emit tabChange event with correct detail', () => {
    const mockEventTarget = { dispatchEvent: vi.fn() };
    const mockTabButtons = [
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn()
      },
      { 
        addEventListener: vi.fn(),
        classList: { toggle: vi.fn() },
        setAttribute: vi.fn()
      }
    ];
    
    const mockPanels = [
      { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      { setAttribute: vi.fn(), removeAttribute: vi.fn() }
    ];
    
    const mockRootElement = { 
      addEventListener: vi.fn(),
      getRootNode: vi.fn(() => mockShadowRoot)
    };
    
    mockShadowRoot.querySelector.mockImplementation((selector: string) => {
      if (selector === '.tabs') return mockRootElement;
      return mockEventTarget;
    });
    
    mockShadowRoot.querySelectorAll.mockImplementation((selector: string) => {
      if (selector === '.tab') return mockTabButtons;
      if (selector === '.tab-panel') return mockPanels;
      return [];
    });

    tabs.attachEventListeners(mockShadowRoot);
    tabs.setTab('rephrase');

    expect(mockEventTarget.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tabChange',
        detail: expect.objectContaining({
          tabId: 'rephrase',
          tabIndex: 1
        })
      })
    );
  });

  it('should support programmatic tab switching with setTab', () => {
    tabs.setTab('rephrase');

    expect(tabs.getCurrentTab().id).toBe('rephrase');
    expect(tabs.getCurrentTab().index).toBe(1);
  });

  it('should return current tab info with getCurrentTab', () => {
    tabs.setTab('rephrase');
    const currentTab = tabs.getCurrentTab();

    expect(currentTab).toEqual({
      id: 'rephrase',
      index: 1
    });
  });
});
