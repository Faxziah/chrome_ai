# AI Text Tools - Chrome Extension

<p align="center">
  <img src="icons/icon128.png" alt="Extension Icon" width="96" height="96" />
</p>

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange?logo=google)

**An intelligent Chrome extension that leverages Google's Gemini AI to enhance text processing capabilities directly in your browser.**

<p align="center">
  <img src="screenshots/1_summarize.png" alt="Summarize Screenshot" width="900" />
</p>

## 🎯 Overview

AI Text Tools transforms how users interact with web content by providing instant AI-powered text analysis, summarization, translation, and intelligent highlighting. This extension demonstrates the power of integrating advanced AI capabilities into everyday browsing experiences.

## ✨ Key Features

### 🤖 AI-Powered Text Processing
- **Smart Summarization** - Extract key insights with multiple styles (brief, detailed, bullet-points)
- **Intelligent Rephrasing** - Rewrite content in various tones (casual, formal, professional, friendly, academic)
- **Multi-Language Translation** - Real-time translation with auto-detection and formatting preservation
- **Contextual Highlighting** - AI-driven keyword and sentence highlighting on any webpage
- **Interactive Chat** - Engage in natural conversations about selected text

### 🚀 Advanced Capabilities
- **Streaming Responses** - Real-time text generation for seamless user experience
- **Comprehensive History** - Track and manage all AI interactions
- **Smart Favorites** - Save important results for quick access
- **Text-to-Speech** - Audio playback of AI-generated content in multiple languages
- **Keyboard Shortcuts** - Efficient workflow with customizable hotkeys
- **Multi-Language Support** - Interface available in English, German, French, Chinese, and Russian

### 🔧 Technical Excellence
- **Secure Architecture** - Local storage with Chrome's security standards
- **Cross-Site Compatibility** - Works seamlessly on all websites
- **Responsive Design** - Optimized for all screen sizes and devices
- **Extensive Customization** - Comprehensive settings and configuration options
- **Performance Optimized** - Fast, efficient processing with minimal resource usage

## 🚀 Quick Start

### Prerequisites
- Google Chrome browser (version 88 or higher)
- Google Gemini API key ([Get free API key](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Faxziah/chrome_ai.git
   cd chrome_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project folder
   - The extension will appear in your Chrome toolbar

5. **Configure API Key**
   - Click the extension icon in your toolbar
   - Navigate to the "Settings" tab
   - Enter your Gemini API key
   - Configure AI model settings (temperature, max tokens)
   - Click "Save" to activate the extension

## 🧪 Development & Testing

### Quick Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Faxziah/chrome_ai.git
   cd chrome_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome Developer Mode**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top right corner)
   - Click **"Load unpacked"**
   - Select the project folder (the folder containing `manifest.json`)
   - Extension will appear in your Chrome toolbar

5. **Configure API Key** (Required for functionality)
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey) (free)
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the API key
   - Click the extension icon → Go to **"Settings"** tab
   - Paste your Gemini API key and click **"Save"**

### Testing Features

The extension works on **any webpage**. Test all features:

- **Text Summarization** - Select text → Right-click → "Summarize text"
- **Text Rephrasing** - Select text → Right-click → "Rephrase text" → Choose tone
- **Translation** - Select text → Right-click → "Translate text" → Select language
- **AI Chat** - Select text → Right-click → "Discuss with AI"
- **AI Highlighting** - Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac)
- **History & Favorites** - Click extension icon to view and manage all interactions
- **Text-to-Speech** - Use audio playback for AI responses
- **Multi-Language UI** - Change interface language in Settings

### Troubleshooting

- **Extension not loading?** Make sure Developer mode is enabled in `chrome://extensions/`
- **API errors?** Verify your API key is correct in Settings
- **Features not working?** Ensure you've built the extension with `npm run build`
- **Build issues?** Check Node.js version (requires 18+)

## 📖 Usage Guide

### Text Processing Workflow
1. **Select any text** on a webpage
2. Access context menu options:
   - Summarize text
   - Rephrase text
   - Translate text
   - Discuss with AI
   - Highlight key paragraphs
3. **View results** in the popup interface
4. **Save to favorites** or view history for future reference

### Keyboard Shortcuts
- `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) - Highlight keywords
- `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) - Clear highlights

## 🏗️ Technical Architecture

### Project Structure
```
src/
├── components/          # Core business logic components
│   ├── chat.ts         # AI chat interface
│   ├── summarizer.ts   # Text summarization logic
│   ├── translator.ts   # Translation services
│   ├── rephraser.ts    # Text rephrasing logic
│   └── tabs.ts         # Tab management
├── content/            # Content script implementations
│   ├── content-script.ts
│   ├── highlight.ts    # AI-powered highlighting
│   ├── popup-ui.ts     # Popup interface
│   ├── handlers/       # Event handlers
│   └── speech-utils.ts # Text-to-speech utilities
├── services/           # Core services and APIs
│   ├── gemini-api.ts   # Gemini AI integration
│   ├── storage.ts      # Data persistence
│   ├── history.ts      # History management
│   └── favorites.ts    # Favorites system
├── popup/              # Extension popup interface
├── options/            # Settings and configuration
├── sidepanel/          # Side panel interface
├── utils/              # Utility functions
│   └── i18n.ts         # Internationalization
└── types/              # TypeScript definitions
```

### Technology Stack
- **TypeScript** - Type-safe development with comprehensive type definitions
- **Chrome Manifest V3** - Latest extension standard with enhanced security
- **Google Gemini API** - Advanced AI processing and generation
- **Rollup** - Efficient module bundling and optimization
- **Material Design** - Modern, accessible UI framework
- **Web Speech API** - Cross-platform text-to-speech functionality

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Chrome browser

## 🔐 Security & Privacy

### Data Protection
- **Local Storage Only** - All data stored locally using Chrome's secure storage
- **No External Tracking** - Zero user behavior monitoring or data collection
- **API Key Security** - Secure local storage of credentials with no external transmission
- **Open Source** - Transparent, auditable codebase

### Privacy Compliance
- **GDPR Compliant** - No personal data collection or processing
- **Chrome Web Store Standards** - Full compliance with extension policies
- **User Control** - Complete user control over data and API usage

## 🌍 Internationalization

### Supported Languages
- English (en)
- German (de)
- French (fr)
- Chinese (zh)
- Russian (ru)

### Key Highlights
- **AI Innovation** - Advanced Gemini API integration with streaming responses
- **User Experience** - Intuitive, accessible interface design
- **Performance** - Optimized for speed and efficiency
- **Accessibility** - Multi-language support and keyboard navigation
- **Technical Excellence** - Modern architecture with TypeScript and Manifest V3

### Unique Features
- **AI-powered webpage highlighting** - Intelligent keyword and sentence detection
- **Seamless integration** - Works on any website with context menu and keyboard shortcuts
- **Multi-modal interaction** - Text processing, speech synthesis, and visual highlighting
- **Privacy-focused** - All data stored locally, no external tracking

*Transforming web browsing through intelligent AI integration*