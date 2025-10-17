export interface HistoryItem {
  id: string;
  type: 'summarize' | 'rephrase' | 'translate';
  prompt: string;
  response: string;
  timestamp: number;
  model?: string;
  originalText?: string;
  metadata?: Record<string, any>;
}

export interface FavoriteItem {
  id: string;
  type: 'summarize' | 'rephrase' | 'translate';
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
