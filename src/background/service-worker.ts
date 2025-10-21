import { ActionType } from '../types';
import { t, setLocale } from '../utils/i18n';
import { StorageService } from '../services/storage';

console.log('AI Text Tools service worker initialized');

// Create context menu items on install
chrome.runtime.onInstalled.addListener(async () => {
  // Setup side panel
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  
  // Load language
  const storage = new StorageService();
  const language = await storage.getLanguage();
  if (language) setLocale(language);
  
  // Create localized context menus
  chrome.contextMenus.create({
    id: 'summarize-text',
    title: t('contextMenu.summarize'),
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'rephrase-text',
    title: t('contextMenu.rephrase'),
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'translate-text',
    title: t('contextMenu.translate'),
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'discuss-text',
    title: t('contextMenu.discuss'),
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId && tab?.id) {
    const action = info.menuItemId.toString();
    const selectedText = info.selectionText || '';
    
    if (selectedText.trim()) {
      await chrome.tabs.sendMessage(tab.id, {
        action: ActionType.CONTEXT_MENU_ACTION,
        contextAction: action,
        selectedText: selectedText
      });
    }
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'highlight-keywords') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: ActionType.HIGHLIGHT_KEYWORDS });
      }
    });
  } else if (command === 'clear-highlights') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: ActionType.CLEAR_HIGHLIGHTS });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ActionType.OPEN_OPTIONS) {
    chrome.runtime.openOptionsPage().catch(console.error);
  } else if (message.action === ActionType.HIGHLIGHT_KEYWORDS) {
    // Forward the highlight request to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: ActionType.HIGHLIGHT_KEYWORDS })
          .then(response => {
            sendResponse({ success: true, response });
          })
          .catch(error => {
            console.error('Error highlighting keywords:', error);
            sendResponse({ success: false, error: error.message });
          });
      }
    });
    return true; // Keep the message channel open for async response
  }
});
