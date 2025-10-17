# Services Documentation

## GeminiService

Класс для работы с Google Gemini API.

### Методы:

- `setApiKey(apiKey: string)` - Установка API ключа с валидацией
- `generateContent(prompt: string, config?: Partial<ApiConfig>)` - Генерация контента
- `streamContent(prompt: string, config?: Partial<ApiConfig>)` - Потоковая генерация контента
- `testConnection()` - Тестирование соединения с API
- `getApiKey()` - Получение текущего API ключа
- `isInitialized()` - Проверка инициализации сервиса

### Пример использования:

```typescript
import { GeminiService } from './services/gemini-api';

const gemini = new GeminiService();
await gemini.setApiKey('your-api-key');

// Обычная генерация
const response = await gemini.generateContent('Привет, как дела?');

// Потоковая генерация
for await (const chunk of gemini.streamContent('Расскажи историю')) {
  console.log(chunk.text);
}
```

## StorageService

Класс для работы с chrome.storage.local.

### Методы:

- `getApiKey()` - Получение API ключа
- `setApiKey(apiKey: string)` - Сохранение API ключа
- `getHistory()` - Получение истории чата
- `saveToHistory(item)` - Сохранение в историю
- `removeFromHistory(itemId)` - Удаление из истории
- `clearHistory()` - Очистка истории
- `getFavorites()` - Получение избранного
- `addToFavorites(item)` - Добавление в избранное
- `removeFromFavorites(itemId)` - Удаление из избранного
- `updateFavorite(itemId, updates)` - Обновление избранного
- `getApiConfig()` - Получение конфигурации API
- `setApiConfig(config)` - Сохранение конфигурации API
- `clearAllData()` - Очистка всех данных

### Пример использования:

```typescript
import { StorageService } from './services/storage';

const storage = new StorageService();

// Сохранение API ключа
await storage.setApiKey('your-api-key');

// Сохранение в историю
await storage.saveToHistory({
  prompt: 'Вопрос',
  response: 'Ответ',
  model: 'gemini-pro'
});

// Получение истории
const history = await storage.getHistory();
```

## Типы

### HistoryItem
```typescript
interface HistoryItem {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  model?: string;
}
```

### FavoriteItem
```typescript
interface FavoriteItem {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  model?: string;
  tags?: string[];
}
```

### ApiConfig
```typescript
interface ApiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

## Валидация API ключа

API ключи валидируются по следующему паттерну: `/^[A-Za-z0-9_-]{39}$/`

Это соответствует формату ключей Google AI Studio.
