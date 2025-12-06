# OpenGPT

A modern, minimal web-based chat interface for interacting with various AI models.

## Features

- **Modern Minimal Aesthetic** - Clean UI with dark/light mode
- **Multi-Provider Support** - OpenRouter, Anthropic, Google, OpenAI, Deepseek
- **Dynamic Model Discovery** - Automatically fetch available models from each provider
- **Chat History** - Persistent local storage of conversations
- **Markdown Rendering** - AI responses with syntax-highlighted code blocks, formatted text, tables, and more
- **Context-Aware Conversations** - AI remembers previous messages within each chat
- **Responsive Design** - Collapsible sidebar, works on desktop and mobile
- **Settings** - Theme switching, data management, about information

## Technologies

- React + TypeScript
- React Markdown with GitHub Flavored Markdown support
- Syntax Highlighter for code blocks
- Lucide React icons
- Modern CSS with CSS variables

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm (Install with `npm install -g pnpm` if you don't have it)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MithunWijayasiri/OpenGPT.git
   cd OpenGPT
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Start the development server
   ```bash
   pnpm start
   ```

The app will open at `http://localhost:3000`

## Usage

1. **Add API Key** - Click "Add API Key" in the sidebar to configure a provider
2. **Fetch Models** - Enter your API key and click the refresh button to see available models
3. **Select Model** - Choose a model from the dropdown list
4. **Start Chatting** - Type your message and press Enter (Shift+Enter for newline)
5. **Manage Chats** - Chat history is automatically saved locally

## Features in Detail

### Multi-Provider Support
- **OpenRouter**: Access 200+ models from various providers
- **OpenAI**: GPT-4, GPT-3.5, and other models
- **Anthropic**: Claude models (3, 3.5, 4 and latest)
- **Google**: Gemini models
- **Deepseek**: DeepSeek Chat and specialized models

### Smart Model Discovery
- Fetch latest available models directly from provider APIs
- Search and filter models by name or ID
- View context window sizes for models that provide them

### Rich Message Formatting
- Code blocks with syntax highlighting for 100+ languages
- Copy buttons for easy code copying
- Headers, lists, tables, blockquotes, and links
- Inline code formatting

### Data Persistence
- Chat history saved locally in browser storage
- API keys stored locally (never sent to servers)
- Model configurations remembered between sessions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
