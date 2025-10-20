import { PopupUI } from './popup-ui';
import { PopupIntegration } from './popup-integration';
import { getSelectedText, getSelectionRect, isValidSelection } from './selection-utils';
import { highlightManager } from './highlight';
import { ActionType } from '../types';
import { setLocale } from '../utils/i18n';
import { StorageService } from '../services/storage';

console.log('AI Text Tools content script loaded');

// Initialize language
(async () => {
  try {
    const storageService = new StorageService();
    const language = await storageService.getLanguage();
    if (language) {
      setLocale(language);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
})();

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
  }, 100);
}

function showPopupIfTextSelected(): void {
  const selectedText = getSelectedText();
  
  if (popupUI.isRecentlyClosed()) {
    return;
  }
  
  if (!isValidSelection(selectedText, 1)) {
    if (!popupUI.getIsPinned()) {
      popupUI.hide();
    }
    return;
  }

  const selectionRect = getSelectionRect();
  if (!selectionRect) {
    if (!popupUI.getIsPinned()) {
      popupUI.hide();
    }
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
      if (!popupUI.getIsPinned()) {
        popupUI.hide();
      }
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

document.addEventListener('mouseup', (event) => {
  // Check if click is inside the popup's shadow DOM
  const path = event.composedPath();
  const clickedInsidePopup = path.some(el => el instanceof HTMLElement && el.id === 'ai-text-tools-popup-host');
  if (clickedInsidePopup) {
    return;
  }
  
  // Игнорировать клики по UI элементам
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
    return;
  }
  
  // Check if popup was recently closed
  if (popupUI.isRecentlyClosed()) {
    return;
  }
  
  // Небольшая задержка для завершения выделения
  setTimeout(() => {
    handleSelectionChange();
  }, 50);
});

document.addEventListener('keyup', (event) => {
  // Обработка завершения выделения с клавиатуры
  if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') {
    return;
  }

  // Проверяем, что событие не происходит внутри попапа
  const path = event.composedPath();
  const isInsidePopup = path.some(el => el instanceof HTMLElement && el.id === 'ai-text-tools-popup-host');
  if (isInsidePopup) {
    return;
  }

  // Небольшая задержка для завершения выделения
  setTimeout(() => {
    handleSelectionChange();
  }, 100);
});

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === ActionType.HIGHLIGHT_KEYWORDS) {
        console.log('Highlight keywords command received');
        await highlightManager.initialize();
        await highlightManager.highlightKeywords();
        sendResponse({ success: true });
      } else if (message.action === ActionType.CLEAR_HIGHLIGHTS) {
        console.log('Clear highlights command received');
        highlightManager.clearHighlights();
        sendResponse({ success: true });
      } else if (message.action === ActionType.GET_SELECTED_TEXT) {
        const selectedText = getSelectedText();
        sendResponse({ success: true, text: selectedText });
      } else if (message.action === ActionType.CONTEXT_MENU_ACTION) {
        console.log('Context menu action received:', message.contextAction);
        const selectedText = message.selectedText || getSelectedText();
        
        if (selectedText && selectedText.trim()) {
          // Show popup with the selected text and trigger the appropriate action
          const selectionRect = getSelectionRect();
          if (selectionRect) {
            await popupUI.show(selectedText, selectionRect);
            
            // Trigger the specific action based on context menu selection
            setTimeout(() => {
              if (message.contextAction === 'summarize-text') {
                popupUI.triggerAction('summarize');
              } else if (message.contextAction === 'rephrase-text') {
                popupUI.triggerAction('rephrase');
              } else if (message.contextAction === 'translate-text') {
                popupUI.triggerAction('translate');
              } else if (message.contextAction === 'discuss-text') {
                popupUI.triggerAction('discuss');
              }
            }, 100);
          }
        }
        sendResponse({ success: true });
      } else if (message.action === ActionType.REPHRASE) {
        console.log('Rephrase action received');
        const selectedText = getSelectedText();
        if (selectedText && selectedText.trim()) {
          const selectionRect = getSelectionRect();
          if (selectionRect) {
            await popupUI.show(selectedText, selectionRect);
            setTimeout(() => {
              popupUI.triggerAction('rephrase');
            }, 100);
          }
        }
        sendResponse({ success: true });
      } else if (message.action === ActionType.TRANSLATE) {
        console.log('Translate action received');
        const selectedText = getSelectedText();
        if (selectedText && selectedText.trim()) {
          const selectionRect = getSelectionRect();
          if (selectionRect) {
            await popupUI.show(selectedText, selectionRect);
            setTimeout(() => {
              popupUI.triggerAction('translate');
            }, 100);
          }
        }
        sendResponse({ success: true });
      } else if (message.action === ActionType.SUMMARIZE) {
        console.log('Summarize action received');
        const selectedText = getSelectedText();
        if (selectedText && selectedText.trim()) {
          const selectionRect = getSelectionRect();
          if (selectionRect) {
            await popupUI.show(selectedText, selectionRect);
            setTimeout(() => {
              popupUI.triggerAction('summarize');
            }, 100);
          }
        }
        sendResponse({ success: true });
      } else {
        console.debug('Unknown action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  })();

  return true; // Держать message port открытым для async операций
});