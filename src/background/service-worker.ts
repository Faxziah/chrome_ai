console.log('AI Text Tools service worker initialized');

chrome.commands.onCommand.addListener((command) => {
  if (command === 'highlight-keywords') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'HIGHLIGHT_KEYWORDS' });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
});
