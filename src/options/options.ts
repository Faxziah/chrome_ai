import { StorageService } from '../services/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
  const saveButton = document.getElementById('save-api-key') as HTMLButtonElement;
  const statusMessage = document.getElementById('status-message') as HTMLDivElement;

  if (!apiKeyInput || !saveButton || !statusMessage) {
    console.error('Required DOM elements not found');
    return;
  }

  const storageService = new StorageService();
  const apiKey = await storageService.getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  saveButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      statusMessage.textContent = 'Please enter an API key';
      statusMessage.style.color = 'red';
      return;
    }
    
    const success = await storageService.setApiKey(apiKey);
    if (success) {
      statusMessage.textContent = 'API key saved successfully!';
      statusMessage.style.color = 'green';
    } else {
      statusMessage.textContent = 'Error saving API key';
      statusMessage.style.color = 'red';
    }
  });
});
