console.log('AI Text Tools service worker initialized');

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
