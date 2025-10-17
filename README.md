# AI Text Tools Chrome Extension

Chrome расширение для работы с текстом с использованием AI (Gemini API).

## Функциональность

### ✅ Реализовано

- **Суммаризация текста** - создание кратких резюме выделенного текста
- **Чат интерфейс** - общение с AI для анализа и обсуждения текста
- **Streaming ответы** - получение ответов от Gemini в реальном времени
- **Избранное** - сохранение важных резюме и ответов
- **Вкладки** - организованный интерфейс с разными функциями

### 🔧 Компоненты

#### Summarizer (`src/components/summarizer.ts`)
- Метод `summarize(text: string)` для создания резюме
- Поддержка разных стилей: brief, detailed, bullet-points
- Настройка максимальной длины и языка
- Streaming суммаризация с `summarizeWithStream()`

#### Chat (`src/components/chat.ts`)
- Интерфейс чата с пользователем и AI
- Streaming ответы от Gemini
- Сохранение истории сообщений
- Добавление в избранное

#### UI
- Современный интерфейс с вкладками
- Чат интерфейс с историей сообщений
- Кнопка "Add to Favorites" для сохранения
- Адаптивный дизайн

## Установка и настройка

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd chrome_ai
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Соберите проект:**
   ```bash
   npm run build
   ```

4. **Настройте API ключ:**
   - Откройте расширение в Chrome
   - Перейдите в настройки
   - Введите ваш Gemini API ключ

5. **Загрузите расширение:**
   - Откройте Chrome Extensions (chrome://extensions/)
   - Включите "Developer mode"
   - Нажмите "Load unpacked" и выберите папку проекта

## Использование

### Суммаризация
1. Выделите текст на любой веб-странице
2. Откройте расширение
3. Перейдите на вкладку "Summarize"
4. Введите запрос или используйте выделенный текст
5. Получите резюме от AI

### Чат
1. Откройте расширение
2. Перейдите на вкладку "Summarize"
3. Введите сообщение в поле ввода
4. Нажмите "Отправить" или Enter
5. Получите ответ от AI в реальном времени

### Избранное
1. После получения ответа от AI
2. Нажмите кнопку "Add to Favorites"
3. Резюме будет сохранено в избранном

## Структура проекта

```
src/
├── components/          # Основные компоненты
│   ├── summarizer.ts    # Суммаризация текста
│   ├── chat.ts         # Чат интерфейс
│   └── index.ts        # Экспорты
├── services/           # Сервисы
│   ├── gemini-api.ts   # Gemini API интеграция
│   ├── storage.ts      # Локальное хранилище
│   └── utils.ts        # Утилиты
├── popup/              # Popup интерфейс
│   ├── popup.html      # HTML структура
│   └── popup.ts        # Popup логика
├── content/            # Content scripts
└── background/         # Service worker
```

## API

### Summarizer
```typescript
const summarizer = new Summarizer(geminiService);

// Обычная суммаризация
const result = await summarizer.summarize(text, {
  maxLength: 200,
  style: 'brief',
  language: 'Russian'
});

// Streaming суммаризация
const result = await summarizer.summarizeWithStream(text, config, (chunk) => {
  console.log('Chunk:', chunk);
});
```

### Chat
```typescript
const chat = new Chat(geminiService, storageService);

// Отправка сообщения
const message = await chat.sendMessageWithStream('Привет!', (chunk) => {
  console.log('AI response chunk:', chunk);
});

// Добавление в избранное
await chat.addToFavorites(messageId);
```

## Технологии

- **TypeScript** - типизированный JavaScript
- **Rollup** - сборка проекта
- **Google Generative AI** - AI API
- **Chrome Extensions API** - расширение браузера
- **CSS3** - современные стили

## Разработка

### Команды
```bash
npm run build    # Сборка проекта
npm run dev      # Режим разработки (если настроен)
```

### Структура типов
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface SummarizerResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}
```

## Лицензия

MIT License