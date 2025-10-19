export enum ActionType {
  HIGHLIGHT_KEYWORDS = 'HIGHLIGHT_KEYWORDS',
  CLEAR_HIGHLIGHTS = 'CLEAR_HIGHLIGHTS',
  GET_SELECTED_TEXT = 'GET_SELECTED_TEXT',
  CONTEXT_MENU_ACTION = 'CONTEXT_MENU_ACTION',
  REPHRASE = 'REPHRASE',
  TRANSLATE = 'TRANSLATE',
  SUMMARIZE = 'SUMMARIZE',
  OPEN_OPTIONS = 'OPEN_OPTIONS'
}

export interface HistoryItem {
  id: string;
  type: 'summarize' | 'rephrase' | 'translate' | 'discuss';
  prompt: string;
  response: string;
  timestamp: number;
  model?: string;
  originalText?: string;
  metadata?: Record<string, any>;
}

export interface FavoriteItem {
  id: string;
  type: 'summarize' | 'rephrase' | 'translate' | 'discuss';
  prompt: string;
  response: string;
  timestamp: number;
  model?: string;
  tags?: string[];
  originalText?: string;
  metadata?: Record<string, any>;
}

export interface ApiConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
}

export interface TabChangeEvent {
  tabId: string;
  tabIndex: number;
}

export interface TabPanelContent {
  summarize?: {
    summary?: string;
    chatHistory?: Array<{ role: 'user' | 'assistant', content: string }>;
  };
  rephrase?: {
    style?: string;
    result?: string;
  };
  translate?: {
    sourceLanguage?: string;
    targetLanguage?: string;
    result?: string;
  };
}

export interface RephraserConfig {
  style: 'casual' | 'formal' | 'professional' | 'friendly' | 'academic';
  preserveMeaning?: boolean;
  language?: string;
}

export interface RephraserResult {
  rephrasedText: string;
  style: string;
  originalLength: number;
  rephrasedLength: number;
  lengthDelta: number;
}

export interface TranslatorConfig {
  sourceLanguage: LanguageCode;
  targetLanguage: Exclude<LanguageCode, 'auto'>;
  preserveFormatting?: boolean;
}

export interface TranslatorResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string;
  originalLength: number;
  translatedLength: number;
  compressionRatio: number;
}

export interface SpeechConfig {
  text: string;
  languageCode: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  localService: boolean;
}

export type LanguageCode = 'auto' | 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'it' | 'pt';

export interface HighlightData {
  keywords: string[];
  sentences: string[];
}

export interface HighlightResult {
  success: boolean;
  highlightedCount?: number;
  error?: string;
}

export interface SummarizerResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}
