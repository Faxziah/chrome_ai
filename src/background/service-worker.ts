console.log('AI Text Tools service worker initialized');

// Create context menu items on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarize-text',
    title: 'Суммаризировать текст',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'rephrase-text',
    title: 'Перефразировать текст',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'translate-text',
    title: 'Перевести текст',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId && tab?.id) {
    const action = info.menuItemId.toString();
    const selectedText = info.selectionText || '';
    
    if (selectedText.trim()) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'CONTEXT_MENU_ACTION',
        contextAction: action,
        selectedText: selectedText
      });
    }
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'highlight-keywords') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'HIGHLIGHT_KEYWORDS' });
      }
    });
  } else if (command === 'clear-highlights') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'CLEAR_HIGHLIGHTS' });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage().catch(console.error);
  }
});
