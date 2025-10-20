interface Translations {
  [key: string]: string;
}

interface LocaleData {
  [key: string]: Translations;
}

const translations: LocaleData = {
  en: {
    // Common
    'common.addToFavorites': '★ Add to Favorites',
    'common.removeFromFavorites': '★ Remove from Favorites',
    'common.copy': '📋 Copy',
    'common.view': 'View',
    'common.originalText': 'Original Text',
    'common.result': 'Result',
    'common.metadata': 'Metadata',
    'common.type': 'Type',
    'common.timestamp': 'Timestamp',
    'common.id': 'ID',
    'common.itemNotFound': 'Item not found',
    'common.errorLoadingDetails': 'Error loading details',
    'common.translate': 'Translate',
    'common.summarize': 'Summarize',
    'common.rephrase': 'Rephrase',
    'common.selectedText': 'Selected text will appear here',
    'common.noTextSelected': 'No text selected',
    'common.addedToFavorites': 'Added to favorites',
    'common.removedFromFavorites': 'Removed from favorites',
    'common.failedToAddToFavorites': 'Failed to add to favorites',
    'common.failedToRemoveFromFavorites': 'Failed to remove from favorites',
    'common.noResultToAddToFavorites': 'No result to add to favorites',
    'common.cannotAddToFavoritesFromThisTab': 'Cannot add to favorites from this tab',
    'common.noFavoriteIdFound': 'No favorite ID found',
    'common.errorTogglingFavorite': 'Error toggling favorite',
    'common.noTextSelectedToSpeak': 'No text selected to speak',
    'common.speechHandlerNotAvailable': 'Speech handler not available',
    'common.translationHandlerNotAvailable': 'Translation handler not available',
    'common.discuss': 'Discuss',
    'common.resume': 'Resume',
    'common.miniS': 'S',
    'common.miniR': 'R',
    'common.miniT': 'T',
    'common.miniD': 'D',
    'common.highlight': 'Highlight',
    'common.history': 'History',
    'common.favorites': 'Favorites',
    'common.pin': 'Pin popup',
    'common.unpin': 'Unpin popup',
    'common.close': 'Close',
    'common.drag': 'Drag popup',
    
    // Highlight
    'highlight.clearButton': 'Clear highlights',
    'highlight.clearButtonTitle': 'Remove all highlights from the page',
    
    // Side Panel
    'sidepanel.title': 'AI Text Tools',
    'sidepanel.highlightKeywords': 'Highlight Keywords',
    'sidepanel.historyTitle': 'Operation History',
    'sidepanel.favoritesTitle': 'Favorites',
    'sidepanel.allTypes': 'All Types',
    'sidepanel.searchHistory': 'Search history...',
    'sidepanel.searchFavorites': 'Search favorites...',
    'sidepanel.clearAll': 'Clear All',
    
    // Context menu
    'contextMenu.summarize': 'Summarize text',
    'contextMenu.rephrase': 'Rephrase text',
    'contextMenu.translate': 'Translate text',
    'contextMenu.discuss': 'Discuss text',
    
    // Status messages for handlers
    'status.translating': 'Translating...',
    'status.rephrasing': 'Rephrasing...',
    'status.summarizing': 'Summarizing...',
    
    // API Errors
    'api.missingKey': 'API key is missing or invalid. Please configure your Gemini API key.',
    'api.visitStudio': 'Visit Google AI Studio',
    'api.createApiKey': 'Go to this link and click "Create API key"',
    'api.modelUnavailable': 'Model is not available for current API version. Choose another model in settings.',
    
    // Error messages
    'errors.translateFailed': 'Failed to translate text',
    'errors.rephraseFailed': 'Failed to rephrase text',
    'errors.summarizeFailed': 'Failed to summarize text',
    'errors.highlightFailed': 'Failed to highlight text',
    'errors.highlightParsingFailed': 'Failed to parse AI response',
    'errors.noTextFound': 'No text found on page to highlight',
    'errors.noKeywordsFound': 'No keywords found to highlight',
    'errors.emptyResponse': 'Empty response from AI',
    'errors.noValidJson': 'No valid JSON found in response',
    'errors.withReason': 'Reason: {{reason}}',
    
    // Translation
    'translate.autoDetect': 'Auto-detect',
    'translate.translation': 'Translation:',
    'translate.swapLanguages': 'Swap languages',
    'translate.speakOriginal': 'Speak original text',
    'translate.speakTranslation': 'Speak translation',
    'translate.sameLanguages': 'Source and target languages cannot be the same',
    
    // Rephrase
    'rephrase.style': 'Style:',
    'rephrase.casual': 'Casual',
    'rephrase.formal': 'Formal',
    'rephrase.professional': 'Professional',
    'rephrase.friendly': 'Friendly',
    'rephrase.academic': 'Academic',
    
    // Chat
    'chat.placeholder': 'Ask about this text...',
    'chat.sendMessage': 'Send message',
    'chat.user': 'User',
    'chat.ai': 'AI',
    
    // Options page
    'options.title': 'AI Text Tools - Settings',
    'options.languageSettings': 'Language Settings',
    'options.apiSettings': '🔑 API Settings',
    'options.geminiApiKey': 'Gemini API key:',
    'options.apiKeyPlaceholder': 'Enter your API key',
    'options.getApiKey': 'Get API key at',
    'options.saveKey': 'Save key',
    'options.testKey': 'Test key',
    'options.showHide': 'Show/Hide',
    'options.geminiModelSettings': '🤖 Gemini Model Settings',
    'options.model': 'Model:',
    'options.selectModel': 'Select Gemini model for processing requests',
    'options.temperature': 'Temperature (0.0 - 1.0):',
    'options.temperatureHelp': 'Higher = more creative responses, Lower = more accurate responses',
    'options.maxTokens': 'Max tokens:',
    'options.maxTokensHelp': 'Maximum number of tokens in response (100-8192)',
    'options.saveSettings': 'Save settings',
    'options.resetToDefault': 'Reset to default',
    'options.keyboardShortcuts': '⌨️ Keyboard Shortcuts',
    'options.currentShortcuts': 'Current keyboard shortcuts:',
    'options.highlightKeywords': 'Highlight key sentences:',
    'options.clearHighlight': 'Clear highlight:',
    'options.changeShortcuts': 'Change shortcuts',
    'options.dataManagement': '📊 Data Management',
    'options.history': 'History',
    'options.favorites': 'Favorites',
    'options.stats': 'Statistics',
    'options.searchHistory': 'Search history...',
    'options.searchFavorites': 'Search favorites...',
    'options.all': 'All',
    'options.summarize': 'Summarize',
    'options.rephrase': 'Rephrase',
    'options.translate': 'Translate',
    'options.clearHistory': 'Clear history',
    'options.clearFavorites': 'Clear favorites',
    'options.exportHistory': 'Export history',
    'options.exportFavorites': 'Export favorites',
    'options.importHistory': 'Import history',
    'options.importFavorites': 'Import favorites',
    'options.totalInHistory': 'Total in history',
    'options.inFavorites': 'In favorites',
    'options.importExport': '📁 Import/Export',
    'options.exportAllData': 'Export all data',
    'options.importData': 'Import data',
    'options.clearAllData': 'Clear all data',
    
    // Status messages
    'status.apiKeySaved': 'API key saved successfully',
    'status.apiKeyError': 'Error saving API key',
    'status.apiKeyValid': 'API key is valid',
    'status.apiKeyInvalid': 'API key is invalid or unavailable',
    'status.apiKeyMissing': 'Enter API key for testing',
    'status.testingApiKey': 'Testing API key...',
    'status.invalidApiKeyFormat': 'Invalid API key format',
    'status.apiKeyTestError': 'Error testing API key. Check internet connection',
    'status.historyCleared': 'History cleared',
    'status.favoritesCleared': 'Favorites cleared',
    'status.historyExported': 'History exported',
    'status.favoritesExported': 'Favorites exported',
    'status.historyImported': 'History imported',
    'status.favoritesImported': 'Favorites imported',
    'status.allDataExported': 'All data exported',
    'status.dataImported': 'Data imported',
    'status.allDataDeleted': 'All data deleted',
    'status.itemRemovedFromHistory': 'Item removed from history',
    'status.itemRemovedFromFavorites': 'Item removed from favorites',
    'status.errorClearingHistory': 'Error clearing history',
    'status.errorClearingFavorites': 'Error clearing favorites',
    'status.errorExportingHistory': 'Error exporting history',
    'status.errorExportingFavorites': 'Error exporting favorites',
    'status.errorImportingHistory': 'Error importing history',
    'status.errorImportingFavorites': 'Error importing favorites',
    'status.errorExportingData': 'Error exporting data',
    'status.errorImportingData': 'Error importing data',
    'status.errorDeletingData': 'Error deleting data',
    'status.errorRemovingItem': 'Error removing item',
    'status.modelSettingsSaved': 'Model settings saved',
    'status.errorSavingSettings': 'Error saving settings',
    'status.settingsReset': 'Settings reset to default',
    'status.errorResettingSettings': 'Error resetting settings',
    'status.errorOpeningShortcuts': 'Error opening shortcuts page',
    'status.languageSaved': 'Language saved successfully',
    'status.errorSavingLanguage': 'Error saving language',
    
    // Confirmations
    'confirm.clearHistory': 'Are you sure you want to clear all history?',
    'confirm.clearFavorites': 'Are you sure you want to clear all favorites?',
    'confirm.clearAllData': 'Are you sure you want to delete ALL data? This action cannot be undone!',
    
    // Empty states
    'empty.history': 'History is empty',
    'empty.favorites': 'Favorites is empty',
    'empty.loadingHistory': 'Loading history...',
    'empty.loadingFavorites': 'Loading favorites...',
    
    // View item modal
    'modal.viewItem': 'View item',
    'modal.close': 'Close',
    'modal.type': 'Type:',
    'modal.prompt': 'Prompt:',
    'modal.response': 'Response:',
    'modal.originalText': 'Original text:',
    'modal.date': 'Date:',
    'modal.tags': 'Tags:',
    
    // Language names
    'language.english': 'English',
    'language.russian': 'Russian',
    'language.german': 'German',
    'language.french': 'French',
    'language.chinese': 'Chinese',
    'language.auto': 'Auto-detect'
  },
  
  ru: {
    // Common
    'common.addToFavorites': '★ Добавить в избранное',
    'common.removeFromFavorites': '★ Убрать из избранного',
    'common.copy': '📋 Копировать',
    'common.view': 'Просмотр',
    'common.originalText': 'Исходный текст',
    'common.result': 'Результат',
    'common.metadata': 'Метаданные',
    'common.type': 'Тип',
    'common.timestamp': 'Время',
    'common.id': 'ID',
    'common.itemNotFound': 'Элемент не найден',
    'common.errorLoadingDetails': 'Ошибка загрузки деталей',
    'common.translate': 'Перевести',
    'common.summarize': 'Резюмировать',
    'common.rephrase': 'Перефразировать',
    'common.selectedText': 'Выделенный текст появится здесь',
    'common.noTextSelected': 'Текст не выбран',
    'common.addedToFavorites': 'Добавлено в избранное',
    'common.removedFromFavorites': 'Удалено из избранного',
    'common.failedToAddToFavorites': 'Не удалось добавить в избранное',
    'common.failedToRemoveFromFavorites': 'Не удалось убрать из избранного',
    'common.noResultToAddToFavorites': 'Нет результата для добавления в избранное',
    'common.cannotAddToFavoritesFromThisTab': 'Нельзя добавить в избранное с этой вкладки',
    'common.noFavoriteIdFound': 'ID избранного не найден',
    'common.errorTogglingFavorite': 'Ошибка переключения избранного',
    'common.noTextSelectedToSpeak': 'Нет выбранного текста для озвучивания',
    'common.speechHandlerNotAvailable': 'Обработчик речи недоступен',
    'common.translationHandlerNotAvailable': 'Обработчик перевода недоступен',
    'common.discuss': 'Обсудить',
    'common.resume': 'Резюмировать',
    'common.miniS': 'Р',
    'common.miniR': 'Ф',
    'common.miniT': 'Т',
    'common.miniD': 'О',
    'common.highlight': 'Подсветка',
    'common.history': 'История',
    'common.favorites': 'Избранное',
    'common.pin': 'Закрепить попап',
    'common.unpin': 'Открепить попап',
    'common.close': 'Закрыть',
    'common.drag': 'Перетащить попап',
    
    // Highlight
    'highlight.clearButton': 'Очистить подсветку',
    'highlight.clearButtonTitle': 'Удалить все подсветки со страницы',
    
    // Side Panel
    'sidepanel.title': 'AI Text Tools',
    'sidepanel.highlightKeywords': 'Подсветить ключевые предложения',
    'sidepanel.historyTitle': 'История операций',
    'sidepanel.favoritesTitle': 'Избранное',
    'sidepanel.allTypes': 'Все типы',
    'sidepanel.searchHistory': 'Поиск в истории...',
    'sidepanel.searchFavorites': 'Поиск в избранном...',
    'sidepanel.clearAll': 'Очистить все',
    
    // Context menu
    'contextMenu.summarize': 'Резюмировать текст',
    'contextMenu.rephrase': 'Перефразировать текст',
    'contextMenu.translate': 'Перевести текст',
    'contextMenu.discuss': 'Обсудить текст',
    
    // Status messages for handlers
    'status.translating': 'Переводим...',
    'status.rephrasing': 'Перефразируем...',
    'status.summarizing': 'Резюмируем...',
    
    // API Errors
    'api.missingKey': 'API ключ отсутствует или недействителен. Настройте ваш Gemini API ключ.',
    'api.visitStudio': 'Посетите Google AI Studio',
    'api.createApiKey': 'Перейдите по ссылке и нажмите "Создать API ключ"',
    'api.modelUnavailable': 'Модель недоступна для текущей версии API. Выберите другую модель в настройках.',
    
    // Error messages
    'errors.translateFailed': 'Не удалось перевести текст',
    'errors.rephraseFailed': 'Не удалось перефразировать текст',
    'errors.summarizeFailed': 'Не удалось резюмировать текст',
    'errors.highlightFailed': 'Не удалось подсветить текст',
    'errors.highlightParsingFailed': 'Не удалось разобрать ответ ИИ',
    'errors.noTextFound': 'На странице не найдено текста для подсветки',
    'errors.noKeywordsFound': 'Не найдено ключевых слов для подсветки',
    'errors.emptyResponse': 'Некорректный ответ от ИИ',
    'errors.noValidJson': 'Не найден корректный JSON в ответе',
    'errors.withReason': 'Причина: {{reason}}',
    
    // Translation
    'translate.autoDetect': 'Автоопределение',
    'translate.translation': 'Перевод:',
    'translate.swapLanguages': 'Поменять языки местами',
    'translate.speakOriginal': 'Озвучить исходный текст',
    'translate.speakTranslation': 'Озвучить перевод',
    'translate.sameLanguages': 'Исходный и целевой языки не могут быть одинаковыми',
    
    // Rephrase
    'rephrase.style': 'Стиль:',
    'rephrase.casual': 'Неформальный',
    'rephrase.formal': 'Формальный',
    'rephrase.professional': 'Профессиональный',
    'rephrase.friendly': 'Дружелюбный',
    'rephrase.academic': 'Академический',
    
    // Chat
    'chat.placeholder': 'Спросите об этом тексте...',
    'chat.sendMessage': 'Отправить сообщение',
    'chat.user': 'Пользователь',
    'chat.ai': 'ИИ',
    
    // Options page
    'options.title': 'AI Text Tools - Настройки',
    'options.languageSettings': 'Настройки языка',
    'options.apiSettings': '🔑 Настройки API',
    'options.geminiApiKey': 'Gemini API ключ:',
    'options.apiKeyPlaceholder': 'Введите ваш API ключ',
    'options.getApiKey': 'Получите API ключ на',
    'options.saveKey': 'Сохранить ключ',
    'options.testKey': 'Проверить ключ',
    'options.showHide': 'Показать/скрыть',
    'options.geminiModelSettings': '🤖 Настройки модели Gemini',
    'options.model': 'Модель:',
    'options.selectModel': 'Выберите модель Gemini для обработки запросов',
    'options.temperature': 'Температура (0.0 - 1.0):',
    'options.temperatureHelp': 'Выше = более креативные ответы, Ниже = более точные ответы',
    'options.maxTokens': 'Максимум токенов:',
    'options.maxTokensHelp': 'Максимальное количество токенов в ответе (100-8192)',
    'options.saveSettings': 'Сохранить настройки',
    'options.resetToDefault': 'Сбросить к умолчанию',
    'options.keyboardShortcuts': '⌨️ Горячие клавиши',
    'options.currentShortcuts': 'Текущие сочетания клавиш:',
    'options.highlightKeywords': 'Подсветка ключевых предложений:',
    'options.clearHighlight': 'Очистить подсветку:',
    'options.changeShortcuts': 'Изменить сочетания',
    'options.dataManagement': '📊 Управление данными',
    'options.history': 'История',
    'options.favorites': 'Избранное',
    'options.stats': 'Статистика',
    'options.searchHistory': 'Поиск в истории...',
    'options.searchFavorites': 'Поиск в избранном...',
    'options.all': 'Все',
    'options.summarize': 'Резюмирование',
    'options.rephrase': 'Перефразирование',
    'options.translate': 'Перевод',
    'options.clearHistory': 'Очистить историю',
    'options.clearFavorites': 'Очистить избранное',
    'options.exportHistory': 'Экспорт истории',
    'options.exportFavorites': 'Экспорт избранного',
    'options.importHistory': 'Импорт истории',
    'options.importFavorites': 'Импорт избранного',
    'options.totalInHistory': 'Всего в истории',
    'options.inFavorites': 'В избранном',
    'options.importExport': '📁 Импорт/Экспорт',
    'options.exportAllData': 'Экспорт всех данных',
    'options.importData': 'Импорт данных',
    'options.clearAllData': 'Очистить все данные',
    
    // Status messages
    'status.apiKeySaved': 'API ключ успешно сохранен',
    'status.apiKeyError': 'Ошибка при сохранении API ключа',
    'status.apiKeyValid': 'API ключ действителен',
    'status.apiKeyInvalid': 'API ключ недействителен или недоступен',
    'status.apiKeyMissing': 'Введите API ключ для проверки',
    'status.testingApiKey': 'Проверка API ключа...',
    'status.invalidApiKeyFormat': 'Неверный формат API ключа',
    'status.apiKeyTestError': 'Ошибка при проверке API ключа. Проверьте подключение к интернету',
    'status.historyCleared': 'История очищена',
    'status.favoritesCleared': 'Избранное очищено',
    'status.historyExported': 'История экспортирована',
    'status.favoritesExported': 'Избранное экспортировано',
    'status.historyImported': 'История импортирована',
    'status.favoritesImported': 'Избранное импортировано',
    'status.allDataExported': 'Все данные экспортированы',
    'status.dataImported': 'Данные импортированы',
    'status.allDataDeleted': 'Все данные удалены',
    'status.itemRemovedFromHistory': 'Элемент удален из истории',
    'status.itemRemovedFromFavorites': 'Элемент удален из избранного',
    'status.errorClearingHistory': 'Ошибка при очистке истории',
    'status.errorClearingFavorites': 'Ошибка при очистке избранного',
    'status.errorExportingHistory': 'Ошибка при экспорте истории',
    'status.errorExportingFavorites': 'Ошибка при экспорте избранного',
    'status.errorImportingHistory': 'Ошибка при импорте истории',
    'status.errorImportingFavorites': 'Ошибка при импорте избранного',
    'status.errorExportingData': 'Ошибка при экспорте данных',
    'status.errorImportingData': 'Ошибка при импорте данных',
    'status.errorDeletingData': 'Ошибка при удалении данных',
    'status.errorRemovingItem': 'Ошибка при удалении элемента',
    'status.modelSettingsSaved': 'Настройки модели сохранены',
    'status.errorSavingSettings': 'Ошибка при сохранении настроек',
    'status.settingsReset': 'Настройки сброшены к умолчанию',
    'status.errorResettingSettings': 'Ошибка при сбросе настроек',
    'status.errorOpeningShortcuts': 'Ошибка при открытии страницы горячих клавиш',
    'status.languageSaved': 'Язык успешно сохранен',
    'status.errorSavingLanguage': 'Ошибка при сохранении языка',
    
    // Confirmations
    'confirm.clearHistory': 'Вы уверены, что хотите очистить всю историю?',
    'confirm.clearFavorites': 'Вы уверены, что хотите очистить все избранное?',
    'confirm.clearAllData': 'Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!',
    
    // Empty states
    'empty.history': 'История пуста',
    'empty.favorites': 'Избранное пусто',
    'empty.loadingHistory': 'Загрузка истории...',
    'empty.loadingFavorites': 'Загрузка избранного...',
    
    // View item modal
    'modal.viewItem': 'Просмотр элемента',
    'modal.close': 'Закрыть',
    'modal.type': 'Тип:',
    'modal.prompt': 'Запрос:',
    'modal.response': 'Ответ:',
    'modal.originalText': 'Исходный текст:',
    'modal.date': 'Дата:',
    'modal.tags': 'Теги:',
    
    // Language names
    'language.english': 'English',
    'language.russian': 'Русский',
    'language.german': 'Немецкий',
    'language.french': 'Французский',
    'language.chinese': 'Китайский',
    'language.auto': 'Автоопределение'
  },
  
  de: {
    // Common
    'common.addToFavorites': '★ Zu Favoriten hinzufügen',
    'common.removeFromFavorites': '★ Aus Favoriten entfernen',
    'common.copy': '📋 Kopieren',
    'common.view': 'Anzeigen',
    'common.translate': 'Übersetzen',
    'common.summarize': 'Zusammenfassen',
    'common.rephrase': 'Umschreiben',
    'common.selectedText': 'Ausgewählter Text wird hier angezeigt',
    'common.noTextSelected': 'Kein Text ausgewählt',
    'common.addedToFavorites': 'Zu Favoriten hinzugefügt',
    'common.removedFromFavorites': 'Aus Favoriten entfernt',
    'common.failedToAddToFavorites': 'Fehler beim Hinzufügen zu Favoriten',
    'common.failedToRemoveFromFavorites': 'Fehler beim Entfernen aus Favoriten',
    'common.noResultToAddToFavorites': 'Kein Ergebnis zum Hinzufügen zu Favoriten',
    'common.cannotAddToFavoritesFromThisTab': 'Kann nicht von dieser Registerkarte zu Favoriten hinzufügen',
    'common.noFavoriteIdFound': 'Keine Favoriten-ID gefunden',
    'common.errorTogglingFavorite': 'Fehler beim Umschalten der Favoriten',
    'common.noTextSelectedToSpeak': 'Kein Text zum Sprechen ausgewählt',
    'common.speechHandlerNotAvailable': 'Sprach-Handler nicht verfügbar',
    'common.translationHandlerNotAvailable': 'Übersetzungs-Handler nicht verfügbar',
    'common.discuss': 'Diskutieren',
    'common.resume': 'Zusammenfassen',
    'common.miniS': 'Z',
    'common.miniR': 'U',
    'common.miniT': 'Ü',
    'common.miniD': 'D',
    
    // Highlight
    'highlight.clearButton': 'Hervorhebungen löschen',
    'highlight.clearButtonTitle': 'Alle Hervorhebungen von der Seite entfernen',
    
    // Side Panel
    'sidepanel.title': 'AI Text Tools',
    'sidepanel.highlightKeywords': 'Schlüsselsätze hervorheben',
    'sidepanel.historyTitle': 'Vorgangsverlauf',
    'sidepanel.favoritesTitle': 'Favoriten',
    'sidepanel.allTypes': 'Alle Typen',
    'sidepanel.searchHistory': 'Verlauf durchsuchen...',
    'sidepanel.searchFavorites': 'Favoriten durchsuchen...',
    'sidepanel.clearAll': 'Alle löschen',
    
    // API Errors
    'api.missingKey': 'API-Schlüssel fehlt oder ist ungültig. Bitte konfigurieren Sie Ihren Gemini API-Schlüssel.',
    'api.visitStudio': 'Besuchen Sie Google AI Studio',
    'api.createApiKey': 'API-Schlüssel erstellen',
    'api.modelUnavailable': 'Modell ist für die aktuelle API-Version nicht verfügbar. Wählen Sie ein anderes Modell in den Einstellungen.',
    
    // Error messages
    'errors.translateFailed': 'Text konnte nicht übersetzt werden',
    'errors.rephraseFailed': 'Text konnte nicht umgeschrieben werden',
    'errors.summarizeFailed': 'Text konnte nicht zusammengefasst werden',
    'errors.withReason': 'Grund: {{reason}}',
    
    // Translation
    'translate.autoDetect': 'Auto-Erkennung',
    'translate.translation': 'Übersetzung:',
    'translate.swapLanguages': 'Sprachen tauschen',
    'translate.speakOriginal': 'Originaltext sprechen',
    'translate.speakTranslation': 'Übersetzung sprechen',
    
    // Rephrase
    'rephrase.style': 'Stil:',
    'rephrase.casual': 'Lässig',
    'rephrase.formal': 'Formell',
    'rephrase.professional': 'Professionell',
    'rephrase.friendly': 'Freundlich',
    'rephrase.academic': 'Akademisch',
    
    // Chat
    'chat.placeholder': 'Fragen Sie über diesen Text...',
    'chat.sendMessage': 'Nachricht senden',
    'chat.user': 'Benutzer',
    'chat.ai': 'KI',
    
    // Options page
    'options.title': 'AI Text Tools - Einstellungen',
    'options.languageSettings': 'Spracheinstellungen',
    'options.apiSettings': '🔑 API-Einstellungen',
    'options.geminiApiKey': 'Gemini API-Schlüssel:',
    'options.apiKeyPlaceholder': 'Geben Sie Ihren API-Schlüssel ein',
    'options.getApiKey': 'API-Schlüssel erhalten bei',
    'options.saveKey': 'Schlüssel speichern',
    'options.testKey': 'Schlüssel testen',
    'options.showHide': 'Anzeigen/Verbergen',
    'options.geminiModelSettings': '🤖 Gemini-Modell-Einstellungen',
    'options.model': 'Modell:',
    'options.selectModel': 'Wählen Sie ein Gemini-Modell für die Verarbeitung von Anfragen',
    'options.temperature': 'Temperatur (0.0 - 1.0):',
    'options.temperatureHelp': 'Höher = kreativere Antworten, Niedriger = genauere Antworten',
    'options.maxTokens': 'Max. Token:',
    'options.maxTokensHelp': 'Maximale Anzahl von Token in der Antwort (100-8192)',
    'options.saveSettings': 'Einstellungen speichern',
    'options.resetToDefault': 'Auf Standard zurücksetzen',
    'options.keyboardShortcuts': '⌨️ Tastenkürzel',
    'options.currentShortcuts': 'Aktuelle Tastenkürzel:',
    'options.highlightKeywords': 'Schlüsselsätze hervorheben:',
    'options.clearHighlight': 'Hervorhebung löschen:',
    'options.changeShortcuts': 'Tastenkürzel ändern',
    'options.dataManagement': '📊 Datenverwaltung',
    'options.history': 'Verlauf',
    'options.favorites': 'Favoriten',
    'options.stats': 'Statistiken',
    'options.searchHistory': 'Verlauf durchsuchen...',
    'options.searchFavorites': 'Favoriten durchsuchen...',
    'options.all': 'Alle',
    'options.summarize': 'Zusammenfassung',
    'options.rephrase': 'Umschreibung',
    'options.translate': 'Übersetzung',
    'options.clearHistory': 'Verlauf löschen',
    'options.clearFavorites': 'Favoriten löschen',
    'options.exportHistory': 'Verlauf exportieren',
    'options.exportFavorites': 'Favoriten exportieren',
    'options.importHistory': 'Verlauf importieren',
    'options.importFavorites': 'Favoriten importieren',
    'options.totalInHistory': 'Gesamt im Verlauf',
    'options.inFavorites': 'In Favoriten',
    'options.importExport': '📁 Import/Export',
    'options.exportAllData': 'Alle Daten exportieren',
    'options.importData': 'Daten importieren',
    'options.clearAllData': 'Alle Daten löschen',
    
    // Status messages
    'status.apiKeySaved': 'API-Schlüssel erfolgreich gespeichert',
    'status.apiKeyError': 'Fehler beim Speichern des API-Schlüssels',
    'status.apiKeyValid': 'API-Schlüssel ist gültig',
    'status.apiKeyInvalid': 'API-Schlüssel ist ungültig oder nicht verfügbar',
    'status.apiKeyMissing': 'Geben Sie einen API-Schlüssel zum Testen ein',
    'status.testingApiKey': 'API-Schlüssel wird getestet...',
    'status.invalidApiKeyFormat': 'Ungültiges API-Schlüssel-Format',
    'status.apiKeyTestError': 'Fehler beim Testen des API-Schlüssels. Überprüfen Sie die Internetverbindung',
    'status.historyCleared': 'Verlauf gelöscht',
    'status.favoritesCleared': 'Favoriten gelöscht',
    'status.historyExported': 'Verlauf exportiert',
    'status.favoritesExported': 'Favoriten exportiert',
    'status.historyImported': 'Verlauf importiert',
    'status.favoritesImported': 'Favoriten importiert',
    'status.allDataExported': 'Alle Daten exportiert',
    'status.dataImported': 'Daten importiert',
    'status.allDataDeleted': 'Alle Daten gelöscht',
    'status.itemRemovedFromHistory': 'Element aus Verlauf entfernt',
    'status.itemRemovedFromFavorites': 'Element aus Favoriten entfernt',
    'status.errorClearingHistory': 'Fehler beim Löschen des Verlaufs',
    'status.errorClearingFavorites': 'Fehler beim Löschen der Favoriten',
    'status.errorExportingHistory': 'Fehler beim Exportieren des Verlaufs',
    'status.errorExportingFavorites': 'Fehler beim Exportieren der Favoriten',
    'status.errorImportingHistory': 'Fehler beim Importieren des Verlaufs',
    'status.errorImportingFavorites': 'Fehler beim Importieren der Favoriten',
    'status.errorExportingData': 'Fehler beim Exportieren der Daten',
    'status.errorImportingData': 'Fehler beim Importieren der Daten',
    'status.errorDeletingData': 'Fehler beim Löschen der Daten',
    'status.errorRemovingItem': 'Fehler beim Entfernen des Elements',
    'status.modelSettingsSaved': 'Modell-Einstellungen gespeichert',
    'status.errorSavingSettings': 'Fehler beim Speichern der Einstellungen',
    'status.settingsReset': 'Einstellungen auf Standard zurückgesetzt',
    'status.errorResettingSettings': 'Fehler beim Zurücksetzen der Einstellungen',
    'status.errorOpeningShortcuts': 'Fehler beim Öffnen der Tastenkürzel-Seite',
    'status.languageSaved': 'Sprache erfolgreich gespeichert',
    'status.errorSavingLanguage': 'Fehler beim Speichern der Sprache',
    
    // Confirmations
    'confirm.clearHistory': 'Sind Sie sicher, dass Sie den gesamten Verlauf löschen möchten?',
    'confirm.clearFavorites': 'Sind Sie sicher, dass Sie alle Favoriten löschen möchten?',
    'confirm.clearAllData': 'Sind Sie sicher, dass Sie ALLE Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden!',
    
    // Empty states
    'empty.history': 'Verlauf ist leer',
    'empty.favorites': 'Favoriten ist leer',
    'empty.loadingHistory': 'Verlauf wird geladen...',
    'empty.loadingFavorites': 'Favoriten werden geladen...',
    
    // View item modal
    'modal.viewItem': 'Element anzeigen',
    'modal.close': 'Schließen',
    'modal.type': 'Typ:',
    'modal.prompt': 'Aufforderung:',
    'modal.response': 'Antwort:',
    'modal.originalText': 'Originaltext:',
    'modal.date': 'Datum:',
    'modal.tags': 'Tags:',
    
    // Language names
    'language.english': 'English',
    'language.russian': 'Russisch',
    'language.german': 'Deutsch',
    'language.french': 'Französisch',
    'language.chinese': 'Chinesisch',
    'language.auto': 'Auto-Erkennung'
  },
  
  fr: {
    // Common
    'common.addToFavorites': '★ Ajouter aux favoris',
    'common.removeFromFavorites': '★ Retirer des favoris',
    'common.copy': '📋 Copier',
    'common.view': 'Voir',
    'common.translate': 'Traduire',
    'common.summarize': 'Résumer',
    'common.rephrase': 'Reformuler',
    'common.selectedText': 'Le texte sélectionné apparaîtra ici',
    'common.noTextSelected': 'Aucun texte sélectionné',
    'common.addedToFavorites': 'Ajouté aux favoris',
    'common.removedFromFavorites': 'Retiré des favoris',
    'common.failedToAddToFavorites': 'Échec de l\'ajout aux favoris',
    'common.failedToRemoveFromFavorites': 'Échec de la suppression des favoris',
    'common.noResultToAddToFavorites': 'Aucun résultat à ajouter aux favoris',
    'common.cannotAddToFavoritesFromThisTab': 'Impossible d\'ajouter aux favoris depuis cet onglet',
    'common.noFavoriteIdFound': 'Aucun ID de favori trouvé',
    'common.errorTogglingFavorite': 'Erreur lors du basculement des favoris',
    'common.noTextSelectedToSpeak': 'Aucun texte sélectionné pour la lecture',
    'common.speechHandlerNotAvailable': 'Gestionnaire de parole non disponible',
    'common.translationHandlerNotAvailable': 'Gestionnaire de traduction non disponible',
    'common.discuss': 'Discuter',
    'common.resume': 'Résumer',
    'common.miniS': 'R',
    'common.miniR': 'P',
    'common.miniT': 'T',
    'common.miniD': 'D',
    
    // Highlight
    'highlight.clearButton': 'Effacer les surlignages',
    'highlight.clearButtonTitle': 'Supprimer tous les surlignages de la page',
    
    // Side Panel
    'sidepanel.title': 'AI Text Tools',
    'sidepanel.highlightKeywords': 'Surligner les phrases clés',
    'sidepanel.historyTitle': 'Historique des opérations',
    'sidepanel.favoritesTitle': 'Favoris',
    'sidepanel.allTypes': 'Tous les types',
    'sidepanel.searchHistory': 'Rechercher dans l\'historique...',
    'sidepanel.searchFavorites': 'Rechercher dans les favoris...',
    'sidepanel.clearAll': 'Tout effacer',
    
    // API Errors
    'api.missingKey': 'Clé API manquante ou invalide. Veuillez configurer votre clé API Gemini.',
    'api.visitStudio': 'Visitez Google AI Studio',
    'api.createApiKey': 'Créer une clé API',
    'api.modelUnavailable': 'Modèle non disponible pour la version API actuelle. Choisissez un autre modèle dans les paramètres.',
    
    // Error messages
    'errors.translateFailed': 'Échec de la traduction du texte',
    'errors.rephraseFailed': 'Échec de la reformulation du texte',
    'errors.summarizeFailed': 'Échec du résumé du texte',
    'errors.withReason': 'Raison : {{reason}}',
    
    // Translation
    'translate.autoDetect': 'Détection automatique',
    'translate.translation': 'Traduction :',
    'translate.swapLanguages': 'Échanger les langues',
    'translate.speakOriginal': 'Lire le texte original',
    'translate.speakTranslation': 'Lire la traduction',
    
    // Rephrase
    'rephrase.style': 'Style :',
    'rephrase.casual': 'Décontracté',
    'rephrase.formal': 'Formel',
    'rephrase.professional': 'Professionnel',
    'rephrase.friendly': 'Amical',
    'rephrase.academic': 'Académique',
    
    // Chat
    'chat.placeholder': 'Posez des questions sur ce texte...',
    'chat.sendMessage': 'Envoyer le message',
    'chat.user': 'Utilisateur',
    'chat.ai': 'IA',
    
    // Options page
    'options.title': 'AI Text Tools - Paramètres',
    'options.languageSettings': 'Paramètres de langue',
    'options.apiSettings': '🔑 Paramètres API',
    'options.geminiApiKey': 'Clé API Gemini :',
    'options.apiKeyPlaceholder': 'Entrez votre clé API',
    'options.getApiKey': 'Obtenir la clé API sur',
    'options.saveKey': 'Sauvegarder la clé',
    'options.testKey': 'Tester la clé',
    'options.showHide': 'Afficher/Masquer',
    'options.geminiModelSettings': '🤖 Paramètres du modèle Gemini',
    'options.model': 'Modèle :',
    'options.selectModel': 'Sélectionnez un modèle Gemini pour traiter les requêtes',
    'options.temperature': 'Température (0.0 - 1.0) :',
    'options.temperatureHelp': 'Plus élevé = réponses plus créatives, Plus bas = réponses plus précises',
    'options.maxTokens': 'Max tokens :',
    'options.maxTokensHelp': 'Nombre maximum de tokens dans la réponse (100-8192)',
    'options.saveSettings': 'Sauvegarder les paramètres',
    'options.resetToDefault': 'Réinitialiser par défaut',
    'options.keyboardShortcuts': '⌨️ Raccourcis clavier',
    'options.currentShortcuts': 'Raccourcis clavier actuels :',
    'options.highlightKeywords': 'Surligner les phrases clés :',
    'options.clearHighlight': 'Effacer le surlignage :',
    'options.changeShortcuts': 'Modifier les raccourcis',
    'options.dataManagement': '📊 Gestion des données',
    'options.history': 'Historique',
    'options.favorites': 'Favoris',
    'options.stats': 'Statistiques',
    'options.searchHistory': 'Rechercher dans l\'historique...',
    'options.searchFavorites': 'Rechercher dans les favoris...',
    'options.all': 'Tous',
    'options.summarize': 'Résumé',
    'options.rephrase': 'Reformulation',
    'options.translate': 'Traduction',
    'options.clearHistory': 'Effacer l\'historique',
    'options.clearFavorites': 'Effacer les favoris',
    'options.exportHistory': 'Exporter l\'historique',
    'options.exportFavorites': 'Exporter les favoris',
    'options.importHistory': 'Importer l\'historique',
    'options.importFavorites': 'Importer les favoris',
    'options.totalInHistory': 'Total dans l\'historique',
    'options.inFavorites': 'Dans les favoris',
    'options.importExport': '📁 Import/Export',
    'options.exportAllData': 'Exporter toutes les données',
    'options.importData': 'Importer les données',
    'options.clearAllData': 'Effacer toutes les données',
    
    // Status messages
    'status.apiKeySaved': 'Clé API sauvegardée avec succès',
    'status.apiKeyError': 'Erreur lors de la sauvegarde de la clé API',
    'status.apiKeyValid': 'Clé API valide',
    'status.apiKeyInvalid': 'Clé API invalide ou indisponible',
    'status.apiKeyMissing': 'Entrez une clé API pour tester',
    'status.testingApiKey': 'Test de la clé API...',
    'status.invalidApiKeyFormat': 'Format de clé API invalide',
    'status.apiKeyTestError': 'Erreur lors du test de la clé API. Vérifiez la connexion internet',
    'status.historyCleared': 'Historique effacé',
    'status.favoritesCleared': 'Favoris effacés',
    'status.historyExported': 'Historique exporté',
    'status.favoritesExported': 'Favoris exportés',
    'status.historyImported': 'Historique importé',
    'status.favoritesImported': 'Favoris importés',
    'status.allDataExported': 'Toutes les données exportées',
    'status.dataImported': 'Données importées',
    'status.allDataDeleted': 'Toutes les données supprimées',
    'status.itemRemovedFromHistory': 'Élément retiré de l\'historique',
    'status.itemRemovedFromFavorites': 'Élément retiré des favoris',
    'status.errorClearingHistory': 'Erreur lors de l\'effacement de l\'historique',
    'status.errorClearingFavorites': 'Erreur lors de l\'effacement des favoris',
    'status.errorExportingHistory': 'Erreur lors de l\'exportation de l\'historique',
    'status.errorExportingFavorites': 'Erreur lors de l\'exportation des favoris',
    'status.errorImportingHistory': 'Erreur lors de l\'importation de l\'historique',
    'status.errorImportingFavorites': 'Erreur lors de l\'importation des favoris',
    'status.errorExportingData': 'Erreur lors de l\'exportation des données',
    'status.errorImportingData': 'Erreur lors de l\'importation des données',
    'status.errorDeletingData': 'Erreur lors de la suppression des données',
    'status.errorRemovingItem': 'Erreur lors de la suppression de l\'élément',
    'status.modelSettingsSaved': 'Paramètres du modèle sauvegardés',
    'status.errorSavingSettings': 'Erreur lors de la sauvegarde des paramètres',
    'status.settingsReset': 'Paramètres réinitialisés par défaut',
    'status.errorResettingSettings': 'Erreur lors de la réinitialisation des paramètres',
    'status.errorOpeningShortcuts': 'Erreur lors de l\'ouverture de la page des raccourcis',
    'status.languageSaved': 'Langue sauvegardée avec succès',
    'status.errorSavingLanguage': 'Erreur lors de la sauvegarde de la langue',
    
    // Confirmations
    'confirm.clearHistory': 'Êtes-vous sûr de vouloir effacer tout l\'historique ?',
    'confirm.clearFavorites': 'Êtes-vous sûr de vouloir effacer tous les favoris ?',
    'confirm.clearAllData': 'Êtes-vous sûr de vouloir supprimer TOUTES les données ? Cette action ne peut pas être annulée !',
    
    // Empty states
    'empty.history': 'L\'historique est vide',
    'empty.favorites': 'Les favoris sont vides',
    'empty.loadingHistory': 'Chargement de l\'historique...',
    'empty.loadingFavorites': 'Chargement des favoris...',
    
    // View item modal
    'modal.viewItem': 'Afficher l\'élément',
    'modal.close': 'Fermer',
    'modal.type': 'Type :',
    'modal.prompt': 'Invite :',
    'modal.response': 'Réponse :',
    'modal.originalText': 'Texte original :',
    'modal.date': 'Date :',
    'modal.tags': 'Tags :',
    
    // Language names
    'language.english': 'English',
    'language.russian': 'Russe',
    'language.german': 'Allemand',
    'language.french': 'Français',
    'language.chinese': 'Chinois',
    'language.auto': 'Détection automatique'
  },
  
  zh: {
    // Common
    'common.addToFavorites': '★ 添加到收藏夹',
    'common.removeFromFavorites': '★ 从收藏夹移除',
    'common.copy': '📋 复制',
    'common.view': '查看',
    'common.translate': '翻译',
    'common.summarize': '总结',
    'common.rephrase': '改写',
    'common.selectedText': '选中的文本将在此显示',
    'common.noTextSelected': '未选择文本',
    'common.addedToFavorites': '已添加到收藏夹',
    'common.removedFromFavorites': '已从收藏夹移除',
    'common.failedToAddToFavorites': '添加到收藏夹失败',
    'common.failedToRemoveFromFavorites': '从收藏夹移除失败',
    'common.noResultToAddToFavorites': '没有结果可添加到收藏夹',
    'common.cannotAddToFavoritesFromThisTab': '无法从此标签页添加到收藏夹',
    'common.noFavoriteIdFound': '未找到收藏夹ID',
    'common.errorTogglingFavorite': '切换收藏夹时出错',
    'common.noTextSelectedToSpeak': '未选择要朗读的文本',
    'common.speechHandlerNotAvailable': '语音处理器不可用',
    'common.translationHandlerNotAvailable': '翻译处理器不可用',
    'common.discuss': '讨论',
    'common.resume': '总结',
    'common.miniS': '总',
    'common.miniR': '改',
    'common.miniT': '翻',
    'common.miniD': '讨',
    
    // Highlight
    'highlight.clearButton': '清除高亮',
    'highlight.clearButtonTitle': '从页面删除所有高亮',
    
    // Side Panel
    'sidepanel.title': 'AI文本工具',
    'sidepanel.highlightKeywords': '高亮关键句子',
    'sidepanel.historyTitle': '操作历史',
    'sidepanel.favoritesTitle': '收藏夹',
    'sidepanel.allTypes': '所有类型',
    'sidepanel.searchHistory': '搜索历史记录...',
    'sidepanel.searchFavorites': '搜索收藏夹...',
    'sidepanel.clearAll': '清除全部',
    
    // API Errors
    'api.missingKey': 'API密钥缺失或无效。请配置您的Gemini API密钥。',
    'api.visitStudio': '访问Google AI Studio',
    'api.createApiKey': '创建API密钥',
    'api.modelUnavailable': '当前API版本不支持此模型。请在设置中选择其他模型。',
    
    // Error messages
    'errors.translateFailed': '翻译文本失败',
    'errors.rephraseFailed': '改写文本失败',
    'errors.summarizeFailed': '总结文本失败',
    'errors.withReason': '原因：{{reason}}',
    
    // Translation
    'translate.autoDetect': '自动检测',
    'translate.translation': '翻译：',
    'translate.swapLanguages': '交换语言',
    'translate.speakOriginal': '朗读原文',
    'translate.speakTranslation': '朗读翻译',
    
    // Rephrase
    'rephrase.style': '风格：',
    'rephrase.casual': '随意',
    'rephrase.formal': '正式',
    'rephrase.professional': '专业',
    'rephrase.friendly': '友好',
    'rephrase.academic': '学术',
    
    // Chat
    'chat.placeholder': '询问关于此文本的问题...',
    'chat.sendMessage': '发送消息',
    'chat.user': '用户',
    'chat.ai': 'AI',
    
    // Options page
    'options.title': 'AI文本工具 - 设置',
    'options.languageSettings': '语言设置',
    'options.apiSettings': '🔑 API设置',
    'options.geminiApiKey': 'Gemini API密钥：',
    'options.apiKeyPlaceholder': '输入您的API密钥',
    'options.getApiKey': '在以下位置获取API密钥',
    'options.saveKey': '保存密钥',
    'options.testKey': '测试密钥',
    'options.showHide': '显示/隐藏',
    'options.geminiModelSettings': '🤖 Gemini模型设置',
    'options.model': '模型：',
    'options.selectModel': '选择Gemini模型来处理请求',
    'options.temperature': '温度（0.0 - 1.0）：',
    'options.temperatureHelp': '更高 = 更有创意的回答，更低 = 更准确的回答',
    'options.maxTokens': '最大令牌数：',
    'options.maxTokensHelp': '回答中的最大令牌数（100-8192）',
    'options.saveSettings': '保存设置',
    'options.resetToDefault': '重置为默认',
    'options.keyboardShortcuts': '⌨️ 键盘快捷键',
    'options.currentShortcuts': '当前键盘快捷键：',
    'options.highlightKeywords': '高亮关键句子：',
    'options.clearHighlight': '清除高亮：',
    'options.changeShortcuts': '更改快捷键',
    'options.dataManagement': '📊 数据管理',
    'options.history': '历史记录',
    'options.favorites': '收藏夹',
    'options.stats': '统计',
    'options.searchHistory': '搜索历史记录...',
    'options.searchFavorites': '搜索收藏夹...',
    'options.all': '全部',
    'options.summarize': '总结',
    'options.rephrase': '改写',
    'options.translate': '翻译',
    'options.clearHistory': '清除历史记录',
    'options.clearFavorites': '清除收藏夹',
    'options.exportHistory': '导出历史记录',
    'options.exportFavorites': '导出收藏夹',
    'options.importHistory': '导入历史记录',
    'options.importFavorites': '导入收藏夹',
    'options.totalInHistory': '历史记录总数',
    'options.inFavorites': '收藏夹中',
    'options.importExport': '📁 导入/导出',
    'options.exportAllData': '导出所有数据',
    'options.importData': '导入数据',
    'options.clearAllData': '清除所有数据',
    
    // Status messages
    'status.apiKeySaved': 'API密钥保存成功',
    'status.apiKeyError': '保存API密钥时出错',
    'status.apiKeyValid': 'API密钥有效',
    'status.apiKeyInvalid': 'API密钥无效或不可用',
    'status.apiKeyMissing': '请输入API密钥进行测试',
    'status.testingApiKey': '测试API密钥...',
    'status.invalidApiKeyFormat': 'API密钥格式无效',
    'status.apiKeyTestError': '测试API密钥时出错。请检查网络连接',
    'status.historyCleared': '历史记录已清除',
    'status.favoritesCleared': '收藏夹已清除',
    'status.historyExported': '历史记录已导出',
    'status.favoritesExported': '收藏夹已导出',
    'status.historyImported': '历史记录已导入',
    'status.favoritesImported': '收藏夹已导入',
    'status.allDataExported': '所有数据已导出',
    'status.dataImported': '数据已导入',
    'status.allDataDeleted': '所有数据已删除',
    'status.itemRemovedFromHistory': '项目已从历史记录中移除',
    'status.itemRemovedFromFavorites': '项目已从收藏夹中移除',
    'status.errorClearingHistory': '清除历史记录时出错',
    'status.errorClearingFavorites': '清除收藏夹时出错',
    'status.errorExportingHistory': '导出历史记录时出错',
    'status.errorExportingFavorites': '导出收藏夹时出错',
    'status.errorImportingHistory': '导入历史记录时出错',
    'status.errorImportingFavorites': '导入收藏夹时出错',
    'status.errorExportingData': '导出数据时出错',
    'status.errorImportingData': '导入数据时出错',
    'status.errorDeletingData': '删除数据时出错',
    'status.errorRemovingItem': '删除项目时出错',
    'status.modelSettingsSaved': '模型设置已保存',
    'status.errorSavingSettings': '保存设置时出错',
    'status.settingsReset': '设置已重置为默认',
    'status.errorResettingSettings': '重置设置时出错',
    'status.errorOpeningShortcuts': '打开快捷键页面时出错',
    'status.languageSaved': '语言保存成功',
    'status.errorSavingLanguage': '保存语言时出错',
    
    // Confirmations
    'confirm.clearHistory': '您确定要清除所有历史记录吗？',
    'confirm.clearFavorites': '您确定要清除所有收藏夹吗？',
    'confirm.clearAllData': '您确定要删除所有数据吗？此操作无法撤销！',
    
    // Empty states
    'empty.history': '历史记录为空',
    'empty.favorites': '收藏夹为空',
    'empty.loadingHistory': '正在加载历史记录...',
    'empty.loadingFavorites': '正在加载收藏夹...',
    
    // View item modal
    'modal.viewItem': '查看项目',
    'modal.close': '关闭',
    'modal.type': '类型：',
    'modal.prompt': '提示：',
    'modal.response': '回答：',
    'modal.originalText': '原始文本：',
    'modal.date': '日期：',
    'modal.tags': '标签：',
    
    // Language names
    'language.english': 'English',
    'language.russian': '俄语',
    'language.german': '德语',
    'language.french': '法语',
    'language.chinese': '中文',
    'language.auto': '自动检测'
  }
};

let currentLocale: string = 'ru';

export function setLocale(locale: string): void {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: string, params?: { [key: string]: string }): string {
  const translation = translations[currentLocale]?.[key];
  if (translation) {
    if (params) {
      return interpolate(translation, params);
    }
    return translation;
  }
  
  // Fallback to English if translation not found
  const fallback = translations['en']?.[key];
  if (fallback) {
    if (params) {
      return interpolate(fallback, params);
    }
    return fallback;
  }
  
  // Return key if no translation found
  return key;
}

function interpolate(template: string, params: { [key: string]: string }): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] || match;
  });
}

export function getAvailableLocales(): string[] {
  return Object.keys(translations);
}

export function getLocaleName(locale: string): string {
  const names: { [key: string]: string } = {
    'en': 'English',
    'ru': 'Русский',
    'de': 'Deutsch',
    'fr': 'Français',
    'zh': '中文'
  };
  return names[locale] || locale;
}
