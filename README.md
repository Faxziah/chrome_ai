# AI Text Tools - Chrome Extension

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

**An intelligent Chrome extension that leverages Google's Gemini AI to enhance text processing capabilities directly in your browser.**

## 🎯 Overview

AI Text Tools transforms how users interact with web content by providing instant AI-powered text analysis, summarization, translation, and intelligent highlighting. Built for the Google Chrome Built-in AI Challenge 2025, this extension demonstrates the power of integrating advanced AI capabilities into everyday browsing experiences.

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
   git clone https://github.com/yourusername/chrome-ai-text-tools.git
   cd chrome-ai-text-tools
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

## 📖 Usage Guide

### Text Processing Workflow
1. **Select any text** on a webpage
2. **Right-click** to access context menu options:
   - Summarize text
   - Rephrase text
   - Translate text
   - Discuss with AI
3. **View results** in the popup interface
4. **Save to favorites** or history for future reference

### Keyboard Shortcuts
- `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac) - Highlight keywords
- `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) - Clear highlights

### Chat Interface
1. Open the extension popup
2. Navigate to the "Chat" tab
3. Type your request and receive AI assistance
4. View conversation history and manage interactions

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
- **Vitest** - Comprehensive testing framework

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Chrome browser

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/chrome-ai-text-tools.git
cd chrome-ai-text-tools

# Install dependencies
npm install

# Build the extension
npm run build

# Run in development mode
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Building for Production
```bash
# Clean previous builds
npm run clean

# Build optimized version
npm run build
```

## 🧪 Testing & Quality Assurance

### Test Coverage
- **Unit Tests** - Comprehensive component testing
- **Integration Tests** - API and service integration testing
- **E2E Tests** - End-to-end user workflow testing
- **Coverage Target** - 80%+ code coverage

### Quality Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting standards
- **Chrome Extension Standards** - Manifest V3 compliance

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
- English (en) - Default
- German (de) - Deutsch
- French (fr) - Français  
- Chinese (zh) - 中文
- Russian (ru) - Русский

### Localization Features
- **Dynamic Language Switching** - Change interface language without restart
- **Context-Aware Translation** - AI-powered translation with cultural context
- **RTL Support** - Right-to-left language support ready
- **Cultural Adaptation** - Region-specific formatting and conventions

## 📊 Performance Metrics

### Optimization Achievements
- **Bundle Size** - Optimized to under 2MB total
- **Load Time** - Sub-100ms extension initialization
- **Memory Usage** - Minimal memory footprint
- **API Efficiency** - Intelligent caching and request optimization

### Browser Compatibility
- **Chrome 88+** - Full feature support
- **Chromium-based Browsers** - Edge, Brave, Opera compatibility
- **Cross-Platform** - Windows, macOS, Linux support

## 🏆 Google Chrome Built-in AI Challenge 2025

This project is specifically designed and submitted for the **Google Chrome Built-in AI Challenge 2025**, showcasing innovative AI integration in browser extensions.

### Challenge Alignment
- ✅ **AI Innovation** - Advanced Gemini API integration with streaming responses
- ✅ **User Experience** - Intuitive, accessible interface design
- ✅ **Performance** - Optimized for speed and efficiency
- ✅ **Accessibility** - Multi-language support and keyboard navigation
- ✅ **Technical Excellence** - Modern architecture with comprehensive testing

### Unique Value Proposition
- **First-of-its-kind** AI-powered webpage highlighting
- **Seamless integration** with existing browsing workflows
- **Multi-modal AI interaction** (text, speech, visual)
- **Enterprise-ready** security and privacy standards

## 📈 Future Roadmap

### Planned Features
- **Voice Input** - Speech-to-text for hands-free operation
- **Team Collaboration** - Shared highlights and annotations
- **Advanced Analytics** - Reading pattern insights
- **API Integration** - Third-party service connections
- **Mobile Support** - Companion mobile app

### Community Contributions
- **Open Source** - Community-driven development
- **Plugin System** - Extensible architecture for custom features
- **Documentation** - Comprehensive developer resources
- **Tutorials** - Step-by-step usage guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Community

- **Documentation** - [Wiki](https://github.com/yourusername/chrome-ai-text-tools/wiki)
- **Issues** - [GitHub Issues](https://github.com/yourusername/chrome-ai-text-tools/issues)
- **Discussions** - [GitHub Discussions](https://github.com/yourusername/chrome-ai-text-tools/discussions)
- **Email** - support@ai-text-tools.com

## 🙏 Acknowledgments

- **Google** - For the Gemini AI API and Chrome extension platform
- **Open Source Community** - For the amazing tools and libraries
- **Contributors** - Everyone who has helped improve this project

---

**Built with ❤️ for the Google Chrome Built-in AI Challenge 2025**

*Transforming web browsing through intelligent AI integration*