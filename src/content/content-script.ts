import { PopupUI } from './popup-ui';
import { PopupIntegration } from './popup-integration';
import { getSelectedText, getSelectionRect, isValidSelection } from './selection-utils';
import { highlightManager } from './highlight';

console.log('AI Text Tools content script loaded');

const popupUI = new PopupUI();
const popupIntegration = new PopupIntegration(popupUI);
let selectionDebounceTimer: number | null = null;
let lastSelectionRect: DOMRect | null = null;
let positionUpdateScheduled: boolean = false;

function handleSelectionChange(): void {
  if (selectionDebounceTimer) {
    clearTimeout(selectionDebounceTimer);
  }
  
  selectionDebounceTimer = window.setTimeout(() => {
    showPopupIfTextSelected();
  }, 10);
}

function showPopupIfTextSelected(): void {
  const selectedText = getSelectedText();
  
  if (!isValidSelection(selectedText, 3)) {
    popupUI.hide();
    return;
  }

  const selectionRect = getSelectionRect();
  if (!selectionRect) {
    popupUI.hide();
    return;
  }

  lastSelectionRect = selectionRect;
  popupUI.show(selectedText, selectionRect);
  
  console.log('Popup shown for text:', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
}

function schedulePositionUpdate(): void {
  if (positionUpdateScheduled) return;
  
  positionUpdateScheduled = true;
  requestAnimationFrame(() => {
    if (!popupUI.isPopupVisible()) {
      positionUpdateScheduled = false;
      return;
    }
    
    const freshSelectionRect = getSelectionRect();
    if (!freshSelectionRect) {
      popupUI.hide();
      lastSelectionRect = null;
      positionUpdateScheduled = false;
      return;
    }
    
    lastSelectionRect = freshSelectionRect;
    popupUI.updatePosition(freshSelectionRect);
    positionUpdateScheduled = false;
  });
}

function handleScroll(): void {
  if (!popupUI.isPopupVisible()) return;
  schedulePositionUpdate();
}

function handleResize(): void {
  if (!popupUI.isPopupVisible()) return;
  schedulePositionUpdate();
}

function handleVisualViewportChange(): void {
  if (!popupUI.isPopupVisible()) return;
  schedulePositionUpdate();
}

document.addEventListener('selectionchange', handleSelectionChange);
document.addEventListener('mouseup', handleSelectionChange);

window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleResize, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
  window.visualViewport.addEventListener('resize', handleVisualViewportChange);
}

window.addEventListener('beforeunload', () => {
  popupIntegration.destroy();
  popupUI.destroy();
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    if (message.action === 'HIGHLIGHT_KEYWORDS') {
      console.log('Highlight keywords command received');
      await highlightManager.initialize();
      await highlightManager.highlightKeywords();
      sendResponse({ success: true });
    } else if (message.action === 'CLEAR_HIGHLIGHTS') {
      console.log('Clear highlights command received');
      highlightManager.clearHighlights();
      sendResponse({ success: true });
    } else if (message.action === 'GET_SELECTED_TEXT') {
      const selectedText = getSelectedText();
      sendResponse({ success: true, text: selectedText });
    } else {
      console.warn('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
