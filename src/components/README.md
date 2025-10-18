# Components Directory

This directory contains reusable UI components for the AI Text Tools extension.

## Current Components

### Tabs (`tabs.ts`)
Material Design 3 tabs component with keyboard navigation and ARIA accessibility.

**Features:**
- Secondary tabs style with animated underline indicator
- Full keyboard navigation (Arrow keys, Home, End)
- ARIA-compliant for screen readers
- Event-driven architecture with 'tabChange' events
- Lazy content rendering for performance

**Usage:**
```typescript
import { Tabs } from './tabs';

const tabs = new Tabs([
  { id: 'summarize', label: 'Summarize' },
  { id: 'rephrase', label: 'Rephrase' },
  { id: 'translate', label: 'Translate' }
]);

const html = tabs.render();
// Inject html into DOM
tabs.attachEventListeners(shadowRoot);

tabs.addEventListener('tabChange', (event) => {
  console.log('Tab changed:', event.detail.tabId);
});
```

### Rephraser (`rephraser.ts`)
AI-powered text rephrasing component with multiple style options.

**Features:**
- Five rephrasing styles: Casual, Formal, Professional, Friendly, Academic
- Style-specific prompt engineering for consistent tone
- Streaming support for real-time output
- Preserves original meaning while changing expression
- Configurable language support

**Usage:**
```typescript
import { Rephraser } from './rephraser';
import { GeminiService } from '../services/gemini-api';

const geminiService = new GeminiService(apiKey);
const rephraser = new Rephraser(geminiService);

const result = await rephraser.rephrase(
  'Your text here',
  { style: 'professional', language: 'Russian' }
);

console.log(result.rephrasedText);
console.log(`Length changed by ${result.lengthDelta} characters`);
```

**Streaming usage:**
```typescript
const result = await rephraser.rephraseWithStream(
  'Your text here',
  { style: 'casual' },
  (chunk) => {
    // Update UI with each chunk
    console.log('Received chunk:', chunk);
  }
);
```

### Translator (`translator.ts`)
AI-powered translation component with auto-detection and text-to-speech support.

**Features:**
- Translation between 10 languages: EN, RU, ES, FR, DE, ZH, JA, KO, IT, PT
- Automatic source language detection via Gemini
- Preserves text formatting (line breaks, lists, structure)
- Streaming support for real-time translation display
- Integration with Web Speech API for text-to-speech
- Language swap functionality

**Usage:**
```typescript
import { Translator } from './translator';
import { GeminiService } from '../services/gemini-api';

const geminiService = new GeminiService(apiKey);
const translator = new Translator(geminiService);

// Auto-detect source language
const result = await translator.translate(
  'Hello, world!',
  { sourceLanguage: 'auto', targetLanguage: 'ru' }
);

console.log(result.translatedText); // "Привет, мир!"
console.log(result.detectedLanguage); // "en"

// Explicit source language
const result2 = await translator.translate(
  'Bonjour le monde',
  { sourceLanguage: 'fr', targetLanguage: 'en' }
);
```

**Streaming usage:**
```typescript
const result = await translator.translateWithStream(
  'Long text here...',
  { sourceLanguage: 'en', targetLanguage: 'es' },
  (chunk) => {
    // Update UI with each chunk
    console.log('Received chunk:', chunk);
  }
);
```

**Text-to-speech integration:**
The Translator component is designed to work with Web Speech API through PopupIntegration. The integration layer handles voice selection, language mapping, and speech synthesis.

## Future Components

The following components will be added in subsequent phases:

- **Summarizer** (Phase 5): Text summarization with AI chat interface
- **HistoryViewer** (Phase 8): Display and manage operation history
- **FavoritesManager** (Phase 8): Manage favorite translations/summaries

## Design Principles

1. **Shadow DOM Compatible**: All components must work within Shadow DOM isolation
2. **Event-Driven**: Use custom events for component communication
3. **Accessible**: Follow ARIA best practices and keyboard navigation standards
4. **Material Design**: Adhere to Material Design 3 specifications
5. **Type-Safe**: Use TypeScript interfaces from `src/types/index.ts`
6. **Testable**: Keep components pure and side-effect free where possible

## Styling

Components should use CSS custom properties defined in `popup-ui.ts` for theming:
- `--primary-color`: Main brand color
- `--secondary-color`: Secondary text color
- `--popup-bg`: Background color
- `--popup-text`: Text color
- `--popup-border`: Border color
- Spacing: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`

This ensures consistent styling and dark mode support across all components.
