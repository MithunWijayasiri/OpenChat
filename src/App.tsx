import { useState, useEffect, useRef, FormEvent, ChangeEvent, useCallback } from 'react';
import { Sun, Moon, Send, Bot, User, Plus, Settings, ChevronDown, ChevronsLeft, ChevronsRight, MessageSquare, X, PlusSquare, Trash2, Edit, MoreHorizontal, Key, Palette, Database, Info, Loader2, Search, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

// Represents an available AI model fetched from a provider
type AvailableModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
};

// Represents a single chat message
type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  modelId?: string;
};

// Represents a configured AI model
type AIModel = {
  id: string;
  name: string;
  provider?: Provider;
};

// Supported AI providers
type Provider = 'OpenRouter' | 'Anthropic' | 'Google' | 'OpenAI' | 'Deepseek';

// Structure for storing API keys
type APIKeyStorage = {
  [key: string]: { 
    provider: Provider, 
    key: string,
    name?: string
  }
};

// Represents a chat session history
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Component to render code blocks with syntax highlighting and copy functionality
const CodeBlock = ({ 
  language, 
  value, 
  isDark 
}: { 
  language: string; 
  value: string; 
  isDark: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-language">{language || 'code'}</span>
        <button onClick={handleCopy} className="code-copy-btn">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '13px',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// Renders Markdown content with custom components
const MarkdownMessage = ({ content, isDark }: { content: string; isDark: boolean }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          
          if (isInline) {
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          }
          
          return (
            <CodeBlock
              language={match ? match[1] : ''}
              value={String(children).replace(/\n$/, '')}
              isDark={isDark}
            />
          );
        },
        p({ children }) {
          return <p className="markdown-p">{children}</p>;
        },
        h1({ children }) {
          return <h1 className="markdown-h1">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="markdown-h2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="markdown-h3">{children}</h3>;
        },
        ul({ children }) {
          return <ul className="markdown-ul">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="markdown-ol">{children}</ol>;
        },
        li({ children }) {
          return <li className="markdown-li">{children}</li>;
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className="markdown-blockquote">{children}</blockquote>;
        },
        table({ children }) {
          return <table className="markdown-table">{children}</table>;
        },
        th({ children }) {
          return <th className="markdown-th">{children}</th>;
        },
        td({ children }) {
          return <td className="markdown-td">{children}</td>;
        },
        hr() {
          return <hr className="markdown-hr" />;
        },
        strong({ children }) {
          return <strong className="markdown-strong">{children}</strong>;
        },
        em({ children }) {
          return <em className="markdown-em">{children}</em>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Modal for application settings (appearance, data, about)
const SettingsModal = ({ 
  isOpen, 
  onClose,
  theme,
  onThemeChange,
  onClearAllData,
  apiKeysCount,
  chatsCount
}: { 
  isOpen: boolean, 
  onClose: () => void,
  theme: 'light' | 'dark',
  onThemeChange: (theme: 'light' | 'dark') => void,
  onClearAllData: () => void,
  apiKeysCount: number,
  chatsCount: number
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container settings-modal">
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="modal-close-button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content settings-content">
          {/* Appearance Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Palette size={18} />
              <h3>Appearance</h3>
            </div>
            <div className="settings-option">
              <span>Theme</span>
              <div className="settings-toggle-group">
                <button 
                  className={`settings-toggle-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => onThemeChange('light')}
                >
                  <Sun size={14} />
                  Light
                </button>
                <button 
                  className={`settings-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => onThemeChange('dark')}
                >
                  <Moon size={14} />
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Data & Storage Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Database size={18} />
              <h3>Data & Storage</h3>
            </div>
            <div className="settings-info">
              <div className="settings-info-item">
                <span>API Keys stored</span>
                <span className="settings-info-value">{apiKeysCount}</span>
              </div>
              <div className="settings-info-item">
                <span>Chat conversations</span>
                <span className="settings-info-value">{chatsCount}</span>
              </div>
            </div>
            <div className="settings-option">
              {!showClearConfirm ? (
                <button 
                  className="settings-danger-btn"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 size={14} />
                  Clear All Data
                </button>
              ) : (
                <div className="settings-confirm-group">
                  <span className="settings-confirm-text">Are you sure? This cannot be undone.</span>
                  <div className="settings-confirm-buttons">
                    <button 
                      className="settings-cancel-btn"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="settings-danger-btn"
                      onClick={() => {
                        onClearAllData();
                        setShowClearConfirm(false);
                        onClose();
                      }}
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Info size={18} />
              <h3>About</h3>
            </div>
            <div className="settings-about">
              <p><strong>OpenGPT</strong></p>
              <p className="settings-about-desc">A simple, modern chat interface for interacting with various AI models.</p>
              <p className="settings-version">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal to edit the title of a chat conversation
const ChatTitleEditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialTitle 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (title: string) => void,
  initialTitle: string
}) => {
  const [title, setTitle] = useState(initialTitle);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-container-sm">
        <div className="modal-header">
          <h2>Edit Chat Title</h2>
          <button onClick={onClose} className="modal-close-button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">
          <div className="modal-form-group">
            <label htmlFor="chatTitle">Title</label>
            <input 
              type="text" 
              id="chatTitle" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              placeholder="Enter chat title"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            onClick={() => {
              if (title.trim()) {
                onSave(title.trim());
                onClose();
              }
            }} 
            disabled={!title.trim()}
            className="modal-button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal for managing API keys and fetching available models
const ApiKeyModal = ({ isOpen, onClose, onAddKey }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddKey: (provider: Provider, model: string, apiKey: string, modelName: string) => void 
}) => {
  const [provider, setProvider] = useState<Provider>('OpenRouter');
  const [model, setModel] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [hasValidKey, setHasValidKey] = useState(false);

  // Resets modal state on provider change or close
  useEffect(() => {
    setAvailableModels([]);
    setModel('');
    setModelName('');
    setModelError(null);
    setShowModelDropdown(false);
    setModelSearchQuery('');
    setHasValidKey(false);
  }, [provider, isOpen]);

  // Fetches available models from the selected provider
  const fetchModels = async () => {
    if (!apiKey.trim()) {
      setModelError('Please enter an API key first');
      return;
    }

    setIsLoadingModels(true);
    setModelError(null);
    setAvailableModels([]);

    try {
      let models: AvailableModel[] = [];

      switch (provider) {
        case 'OpenRouter':
          const orResponse = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': window.location.origin,
            }
          });
          if (!orResponse.ok) throw new Error('Invalid API key or failed to fetch models');
          const orData = await orResponse.json();
          models = orData.data?.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            description: m.description,
            context_length: m.context_length
          })) || [];
          break;

        case 'OpenAI':
          const oaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            }
          });
          if (!oaiResponse.ok) throw new Error('Invalid API key or failed to fetch models');
          const oaiData = await oaiResponse.json();
          // Filter to show only chat models
          models = oaiData.data
            ?.filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
            .map((m: any) => ({
              id: m.id,
              name: m.id,
            }))
            .sort((a: AvailableModel, b: AvailableModel) => a.name.localeCompare(b.name)) || [];
          break;

        case 'Anthropic':
          // Anthropic doesn't have a public models endpoint, so we provide known models
          // These are fetched from their documentation - user's key validity will be checked on first use
          models = [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest Claude Sonnet model' },
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Latest Claude Opus model' },
            { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: 'Hybrid model with extended thinking' },
          ];
          // Validate the key by making a minimal request
          try {
            const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'hi' }]
              })
            });
            if (!testResponse.ok && testResponse.status === 401) {
              throw new Error('Invalid API key');
            }
          } catch (e: any) {
            if (e.message === 'Invalid API key') throw e;
            // Network errors are okay, key might still be valid
          }
          break;

        case 'Google':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (!googleResponse.ok) throw new Error('Invalid API key or failed to fetch models');
          const googleData = await googleResponse.json();
          models = googleData.models
            ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => ({
              id: m.name.replace('models/', ''),
              name: m.displayName || m.name.replace('models/', ''),
              description: m.description,
            })) || [];
          break;

        case 'Deepseek':
          // Deepseek uses OpenAI-compatible API
          const dsResponse = await fetch('https://api.deepseek.com/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            }
          });
          if (!dsResponse.ok) throw new Error('Invalid API key or failed to fetch models');
          const dsData = await dsResponse.json();
          models = dsData.data?.map((m: any) => ({
            id: m.id,
            name: m.id,
          })) || [];
          
          // If no models returned, provide known Deepseek models
          if (models.length === 0) {
            models = [
              { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose chat model' },
              { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized for coding tasks' },
              { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'Advanced reasoning model' },
            ];
          }
          break;
      }

      setAvailableModels(models);
      setHasValidKey(true);
      if (models.length === 0) {
        setModelError('No models found for this provider');
      }
    } catch (error: any) {
      console.error('Error fetching models:', error);
      setModelError(error.message || 'Failed to fetch models. Check your API key.');
      setHasValidKey(false);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Filters available models based on user search input
  const filteredModels = availableModels.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  // Updates state with selected model details
  const selectModel = (selectedModel: AvailableModel) => {
    setModel(selectedModel.id);
    setModelName(selectedModel.name);
    setShowModelDropdown(false);
    setModelSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container api-key-modal">
        <div className="modal-header">
          <h2>Add API Key</h2>
          <button onClick={onClose} className="modal-close-button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">
          <div className="modal-form-group">
            <label htmlFor="provider">Provider</label>
            <select 
              id="provider" 
              value={provider} 
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="modal-input"
            >
              <option value="OpenRouter">OpenRouter</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Google">Google</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Deepseek">Deepseek</option>
            </select>
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="apiKey">API Key</label>
            <div className="api-key-input-group">
              <input 
                type="password" 
                id="apiKey" 
                placeholder="Enter API key" 
                value={apiKey} 
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setHasValidKey(false);
                  setAvailableModels([]);
                }}
                className="modal-input"
              />
              <button 
                className="fetch-models-btn"
                onClick={fetchModels}
                disabled={!apiKey.trim() || isLoadingModels}
                title="Fetch available models"
              >
                {isLoadingModels ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </div>
            {hasValidKey && (
              <span className="api-key-valid">✓ API key validated</span>
            )}
          </div>

          <div className="modal-form-group">
            <label htmlFor="model">Model</label>
            {availableModels.length > 0 ? (
              <div className="model-selector">
                <div 
                  className="model-selector-trigger"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                >
                  {model ? (
                    <span className="model-selected">{modelName || model}</span>
                  ) : (
                    <span className="model-placeholder">Select a model...</span>
                  )}
                  <ChevronDown size={16} className={showModelDropdown ? 'rotate' : ''} />
                </div>
                
                {showModelDropdown && (
                  <div className="model-selector-dropdown">
                    <div className="model-search">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="model-list">
                      {filteredModels.length > 0 ? (
                        filteredModels.map((m) => (
                          <div
                            key={m.id}
                            className={`model-option ${model === m.id ? 'selected' : ''}`}
                            onClick={() => selectModel(m)}
                          >
                            <div className="model-option-info">
                              <span className="model-option-name">{m.name}</span>
                              <span className="model-option-id">{m.id}</span>
                            </div>
                            {m.context_length && (
                              <span className="model-option-context">{(m.context_length / 1000).toFixed(0)}k</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="model-list-empty">No models found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="model-fetch-prompt">
                {isLoadingModels ? (
                  <div className="model-loading">
                    <Loader2 size={16} className="spin" />
                    <span>Fetching available models...</span>
                  </div>
                ) : modelError ? (
                  <div className="model-error">{modelError}</div>
                ) : (
                  <div className="model-hint">
                    Enter your API key and click <RefreshCw size={12} /> to fetch available models
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-form-group">
            <label htmlFor="modelName">Display Name <span className="optional-label">(optional)</span></label>
            <input 
              type="text" 
              id="modelName" 
              placeholder={model ? `${provider} - ${model}` : "Display name for this model"} 
              value={modelName} 
              onChange={(e) => setModelName(e.target.value)}
              className="modal-input"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            onClick={() => {
              if (model && apiKey) {
                onAddKey(
                  provider, 
                  model, 
                  apiKey, 
                  modelName || `${provider} - ${model}`
                );
                onClose();
              }
            }} 
            disabled={!model || !apiKey}
            className="modal-button"
          >
            Add Model
          </button>
        </div>
      </div>
    </div>
  );
};

// Prepares the message history for the specific provider API
const prepareMessagesForAPI = (messages: Message[], currentUserMessage: string, provider: Provider): any => {
  // Filter messages for the current conversation
  const conversationMessages = messages.slice(-10); // Last 10 messages for context
  
  switch (provider) {
    case 'OpenRouter':
    case 'OpenAI':
    case 'Deepseek':
      return {
        messages: [
          ...conversationMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: 'user', content: currentUserMessage }
        ]
      };
      
    case 'Anthropic':
      return {
        messages: [
          ...conversationMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: 'user', content: currentUserMessage }
        ],
        max_tokens: 1024
      };
      
    case 'Google':
      return {
        contents: [
          ...conversationMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: currentUserMessage }] }
        ]
      };
      
    default:
      throw new Error(`Unsupported provider for context: ${provider}`);
  }
};

export default function ChatPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatToEdit, setChatToEdit] = useState<string | null>(null);
  const [chatIdWithMenuOpen, setChatIdWithMenuOpen] = useState<string | null>(null);
  
  const [apiKeys, setApiKeys] = useState<APIKeyStorage>({});

  // List of available AI models
  const [models, setModels] = useState<AIModel[]>([]);

  // Reference to the end of the message list for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref for model dropdown
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Creates a new chat session
  const createNewChat = useCallback(() => {
    // Check if the most recent chat is empty to prevent spamming
    if (chats.length > 0 && chats[0].messages.length === 0) {
      setCurrentChatId(chats[0].id);
      setMessages([]);
      setChats(prevChats => prevChats.map(c => 
        c.id === chats[0].id ? { ...c, modelId: selectedModel } : c
      ));
      return;
    }

    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      modelId: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChatId);
    setMessages([]);
  }, [selectedModel, chats]);

  // Generates a chat title based on the first user message
  const generateChatTitle = useCallback((): string => {
    if (messages.length === 0) return 'New Chat';
    
    // Use first user message as title, truncated
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.text.substring(0, 20);
      return title.length < firstUserMessage.text.length ? `${title}...` : title;
    }
    
    // Fallback to date
    return `Chat ${new Date().toLocaleDateString()}`;
  }, [messages]);

  // Updates the current chat in the history list
  const updateCurrentChat = useCallback(() => {
    if (!currentChatId) return;
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: [...messages],
              modelId: selectedModel,
              title: chat.title === 'New Chat' ? generateChatTitle() : chat.title,
              updatedAt: new Date()
            }
          : chat
      )
    );
  }, [currentChatId, messages, selectedModel, generateChatTitle]);
  
  // Closes the chat options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setChatIdWithMenuOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Closes the model selector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initializes theme from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Applies the selected theme to the document and persists it
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Auto-scrolls to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persists the current chat when messages are updated
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      updateCurrentChat();
    }
  }, [messages, currentChatId, updateCurrentChat]);

  // Hydrates application state from local storage
  useEffect(() => {
    const savedChats = localStorage.getItem('opengpt-chats');
    const savedApiKeys = localStorage.getItem('opengpt-apikeys');
    const savedModels = localStorage.getItem('opengpt-models');
    
    if (savedApiKeys) {
      try {
        setApiKeys(JSON.parse(savedApiKeys));
      } catch (e) {
        console.error('Error loading API keys:', e);
      }
    }
    
    if (savedModels) {
      try {
        setModels(JSON.parse(savedModels));
      } catch (e) {
        console.error('Error loading models:', e);
      }
    }
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        if (parsedChats.length > 0) {
          setChats(parsedChats);
          setCurrentChatId(parsedChats[0].id);
          setMessages(parsedChats[0].messages || []);
          if (parsedChats[0].modelId) {
            setSelectedModel(parsedChats[0].modelId);
          }
        }
      } catch (e) {
        console.error('Error loading chats:', e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Persists chat history to local storage
  useEffect(() => {
    if (isInitialized && chats.length > 0) {
      localStorage.setItem('opengpt-chats', JSON.stringify(chats));
    } else if (isInitialized && chats.length === 0) {
      localStorage.removeItem('opengpt-chats');
    }
  }, [chats, isInitialized]);

  // Persists API keys to local storage
  useEffect(() => {
    if (isInitialized) {
      if (Object.keys(apiKeys).length > 0) {
        localStorage.setItem('opengpt-apikeys', JSON.stringify(apiKeys));
      } else {
        localStorage.removeItem('opengpt-apikeys');
      }
    }
  }, [apiKeys, isInitialized]);

  // Persists model configuration to local storage
  useEffect(() => {
    if (isInitialized) {
      if (models.length > 0) {
        localStorage.setItem('opengpt-models', JSON.stringify(models));
      } else {
        localStorage.removeItem('opengpt-models');
      }
    }
  }, [models, isInitialized]);

  // Switches the active chat session
  const switchChat = (chatId: string) => {
    // Save current chat first
    if (currentChatId && messages.length > 0) {
      updateCurrentChat();
    }
    
    // Find and load the selected chat
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages(selectedChat.messages);
      setSelectedModel(selectedChat.modelId);
    }
  };

  // Deletes a specific chat session
  const deleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    
    const remainingChats = chats.filter(chat => chat.id !== chatId);
    setChats(remainingChats);
    
    // If we deleted the current chat, switch to the first available chat or clear
    if (chatId === currentChatId) {
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
        setMessages(remainingChats[0].messages || []);
        setSelectedModel(remainingChats[0].modelId || '');
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
    
    setChatIdWithMenuOpen(null);
  };

  // Clears all application data from local storage
  const clearAllData = () => {
    localStorage.removeItem('opengpt-chats');
    localStorage.removeItem('opengpt-apikeys');
    localStorage.removeItem('opengpt-models');
    setChats([]);
    setApiKeys({});
    setModels([]);
    setCurrentChatId(null);
    setMessages([]);
    setSelectedModel('');
  };

  // Opens the edit title modal for a specific chat
  const editChatTitle = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    setChatToEdit(chatId);
    setChatIdWithMenuOpen(null);
  };

  // Updates the chat title
  const saveChatTitle = (newTitle: string) => {
    if (!chatToEdit) return;
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatToEdit
          ? { ...chat, title: newTitle }
          : chat
      )
    );
    
    setChatToEdit(null);
  };

  // Toggles the visibility of the chat options menu
  const toggleChatMenu = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    setChatIdWithMenuOpen(prev => prev === chatId ? null : chatId);
  };

  // Toggles between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Toggles the sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Handles message submission and AI response generation
  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!selectedModel) {
      return;
    }
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim(),
      modelId: selectedModel,
    };

    // Make sure we have a current chat BEFORE adding the message
    let chatId = currentChatId;
    if (!chatId) {
      const newChatId = Date.now().toString();
      const newChat: Chat = {
        id: newChatId,
        title: 'New Chat',
        messages: [userMessage],
        modelId: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChats(prevChats => [newChat, ...prevChats]);
      setCurrentChatId(newChatId);
      chatId = newChatId;
    }

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Verifies API key availability for the selected model
      const apiKeyInfo = apiKeys[selectedModel];
      
      // Create AI response
      let aiResponseText = '';
      
      if (apiKeyInfo) {
        // Executes the API request using the stored key
        try {
          // Formats the request body
          const reqBody = prepareMessagesForAPI(
            messages, 
            userMessage.text, 
            apiKeyInfo.provider
          );
          
          // Sends the request to the provider
          let response;
          
          switch (apiKeyInfo.provider) {
            case 'OpenRouter':
              response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKeyInfo.key}`,
                  'HTTP-Referer': window.location.origin,
                  'X-Title': 'OpenChat'
                },
                body: JSON.stringify({
                  model: selectedModel,
                  ...reqBody
                })
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
              }
              
              const orData = await response.json();
              aiResponseText = orData.choices[0]?.message?.content || 'No response content';
              break;
              
            case 'Anthropic':
              response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKeyInfo.key,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: selectedModel,
                  ...reqBody
                })
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Anthropic API error (${response.status}): ${errorData}`);
              }
              
              const anthropicData = await response.json();
              aiResponseText = anthropicData.content[0]?.text || 'No response content';
              break;
              
            case 'Google':
              response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKeyInfo.key}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqBody)
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Google API error (${response.status}): ${errorData}`);
              }
              
              const googleData = await response.json();
              aiResponseText = googleData.candidates[0]?.content?.parts[0]?.text || 'No response content';
              break;
              
            case 'OpenAI':
              response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKeyInfo.key}`
                },
                body: JSON.stringify({
                  model: selectedModel,
                  ...reqBody
                })
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`OpenAI API error (${response.status}): ${errorData}`);
              }
              
              const openaiData = await response.json();
              aiResponseText = openaiData.choices[0]?.message?.content || 'No response content';
              break;
              
            case 'Deepseek':
              response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKeyInfo.key}`
                },
                body: JSON.stringify({
                  model: selectedModel,
                  ...reqBody
                })
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Deepseek API error (${response.status}): ${errorData}`);
              }
              
              const deepseekData = await response.json();
              aiResponseText = deepseekData.choices[0]?.message?.content || 'No response content';
              break;
              
            default:
              throw new Error(`Unsupported provider: ${apiKeyInfo.provider}`);
          }
        } catch (apiError: any) {
          console.error('API request failed:', apiError);
          aiResponseText = `Error: ${apiError.message || 'Unknown API error'}`;
        }
      } else {
        // Handles missing API keys
        const currentModelName = models.find(m => m.id === selectedModel)?.name || 'AI';
        aiResponseText = `(${currentModelName}): This is a placeholder response. Please add an API key for this model to get real responses.`;
      }
      
      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        modelId: selectedModel,
      };

      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error: any) {
      // Handle error
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Error: ${error.message || 'There was an error processing your request. Please try again.'}`,
        modelId: selectedModel,
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Updates input state and auto-resizes the textarea
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea (simple version)
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Handles key press events for message submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      // Reset height after sending
      e.currentTarget.style.height = 'auto';
    }
  };

  // Adds a new API key and model configuration
  const handleAddApiKey = (provider: Provider, modelId: string, apiKey: string, modelName: string) => {
    // Store the API key
    setApiKeys(prev => ({ 
      ...prev, 
      [modelId]: { 
        provider, 
        key: apiKey,
        name: modelName 
      } 
    }));
    
    // Add to models list if not already there
    if (!models.some(m => m.id === modelId)) {
      setModels(prev => [
        ...prev,
        { id: modelId, name: modelName, provider }
      ]);
      
      // Auto-select the newly added model
      setSelectedModel(modelId);
    }
    
    console.log(`API Key added for ${provider} model: ${modelId} (${modelName})`);
  };

  // Removes a model and its associated API key
  const deleteModel = (modelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering model selection
    
    const newModels = models.filter(m => m.id !== modelId);
    setModels(newModels);
    
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[modelId];
      return newKeys;
    });

    if (selectedModel === modelId) {
      if (newModels.length > 0) {
        setSelectedModel(newModels[0].id);
      } else {
        setSelectedModel('');
      }
    }
  };

  return (
    <div className="app-container">
      {/* API Key Modal */}
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onAddKey={handleAddApiKey}
      />

      {/* Chat Title Edit Modal */}
      <ChatTitleEditModal
        isOpen={chatToEdit !== null}
        onClose={() => setChatToEdit(null)}
        onSave={saveChatTitle}
        initialTitle={chatToEdit ? (chats.find(c => c.id === chatToEdit)?.title || '') : ''}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        onClearAllData={clearAllData}
        apiKeysCount={Object.keys(apiKeys).length}
        chatsCount={chats.length}
      />

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}> 
        <div className={`sidebar-content ${isSidebarCollapsed ? 'sidebar-centered' : ''}`}> 
          {/* New Chat Button */}
          <button 
            onClick={createNewChat}
            className={`new-chat-button ${isSidebarCollapsed ? 'new-chat-button-centered' : ''}`}
          >
            <PlusSquare size={16} className={`new-chat-icon ${!isSidebarCollapsed ? 'new-chat-icon-with-margin' : ''}`} />
            {!isSidebarCollapsed && <span>New Chat</span>}
          </button>

          {/* Model Selector Dropdown */}
          <div className="model-dropdown" ref={modelDropdownRef}>
            <button
              onClick={() => !isSidebarCollapsed && setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isSidebarCollapsed || models.length === 0}
              className={`dropdown-button ${isSidebarCollapsed ? 'dropdown-button-centered' : ''}`}
            >
              {isSidebarCollapsed ? (
                 <Bot size={18} className="flex-shrink-0" />
              ) : (
                <>
                  <span className="text-sm font-medium truncate">
                    {models.length === 0 
                      ? 'No models available' 
                      : models.find(m => m.id === selectedModel)?.name || 'Select Model'}
                  </span>
                  {models.length > 0 && (
                    <ChevronDown size={16} className={`dropdown-icon ${isModelDropdownOpen ? 'dropdown-icon-rotated' : ''}`} />
                  )}
                </>
              )}
            </button>
            {!isSidebarCollapsed && isModelDropdownOpen && models.length > 0 && (
              <div className="dropdown-menu">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`dropdown-item ${selectedModel === model.id ? 'dropdown-item-selected' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                  >
                    <span className="dropdown-item-name">{model.name}</span>
                    {model.provider && <span className="dropdown-item-provider">({model.provider})</span>}
                    <button 
                      className="dropdown-item-delete"
                      onClick={(e) => deleteModel(model.id, e)}
                      title="Remove model"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="chat-history no-scrollbar">
            {!isSidebarCollapsed && <h2 className="history-title">History</h2>}
            {/* Chat History Items */}
            {chats.map((chat) => (
              <div 
                key={chat.id}
                className="history-item-container"
              >
                <div 
                  role="button"
                  onClick={() => switchChat(chat.id)}
                  className={`history-item ${isSidebarCollapsed ? 'history-item-centered' : ''} ${currentChatId === chat.id ? 'history-item-active' : ''}`}
                > 
                  <MessageSquare size={16} className={`history-item-icon ${!isSidebarCollapsed ? 'history-item-icon-with-margin' : ''}`} />
                  {!isSidebarCollapsed && (
                    <span className="history-item-title" title={chat.title}>
                      {chat.title}
                    </span>
                  )}
                  {!isSidebarCollapsed && (
                    <button 
                      className="history-item-menu-button"
                      onClick={(e) => toggleChatMenu(chat.id, e)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </div>

                {/* Chat options menu */}
                {!isSidebarCollapsed && chatIdWithMenuOpen === chat.id && (
                  <div className="history-item-menu">
                    <button 
                      className="history-item-menu-option"
                      onClick={(e) => editChatTitle(chat.id, e)}
                    >
                      <Edit size={14} />
                      <span>Rename</span>
                    </button>
                    <button 
                      className="history-item-menu-option history-item-menu-option-delete"
                      onClick={(e) => deleteChat(chat.id, e)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`sidebar-footer ${isSidebarCollapsed ? 'sidebar-footer-spaced' : ''}`}> 
           <button
            onClick={() => setIsApiKeyModalOpen(true)}
            title="Add API Key"
            className={`footer-button ${isSidebarCollapsed ? 'footer-button-centered' : ''}`}
          >
            <Plus size={16} className={`footer-button-icon ${!isSidebarCollapsed ? 'footer-button-icon-with-margin' : ''}`} />
            {!isSidebarCollapsed && <span>Add API Key</span>}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`footer-button ${isSidebarCollapsed ? 'footer-button-centered' : ''}`}
          >
            {theme === 'light' ? <Moon size={16} className={`footer-button-icon ${!isSidebarCollapsed ? 'footer-button-icon-with-margin' : ''}`} /> : <Sun size={16} className={`footer-button-icon ${!isSidebarCollapsed ? 'footer-button-icon-with-margin' : ''}`} />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button
            title="Settings"
            className={`footer-button ${isSidebarCollapsed ? 'footer-button-centered' : ''}`}
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings size={16} className={`footer-button-icon ${!isSidebarCollapsed ? 'footer-button-icon-with-margin' : ''}`} />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>
          {/* Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className={`footer-button ${isSidebarCollapsed ? 'footer-button-centered' : ''}`}
          >
            {isSidebarCollapsed ? <ChevronsRight size={16} className="footer-button-icon" /> : <ChevronsLeft size={16} className="footer-button-icon footer-button-icon-with-margin" />}
            {!isSidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
                  {/* Message List */}
                <div className="message-list message-list-spaced">
                  {messages.length === 0 && (
                    <div className="empty-state">
                      <Bot size={48} className="empty-state-icon" />
                      <p className="empty-state-text">How can I help you today?</p>
                      {models.length === 0 ? (
                        <>
                          <p className="empty-state-model">No models available. Add an API key to get started.</p>
                          <button 
                            className="empty-state-button"
                            onClick={() => setIsApiKeyModalOpen(true)}
                          >
                            <Key size={16} />
                            Add API Key
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="empty-state-model">
                            Selected Model: {models.find(m => m.id === selectedModel)?.name || 'None selected'}
                          </p>
                                            {apiKeys[selectedModel] && (
                                              <p className="empty-state-provider">Provider: {apiKeys[selectedModel].provider}</p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {messages.map((message) => (            <div key={message.id} className={`message-container ${message.sender === 'user' ? 'message-container-user' : 'message-container-ai'}`}> 
              <div className={`message-bubble-container ${message.sender === 'user' ? 'message-bubble-container-user' : 'message-bubble-container-ai'}`}> 
                <div className={`avatar ${message.sender === 'ai' ? 'avatar-ai' : 'avatar-user'}`}> 
                  {message.sender === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`message-bubble ${message.sender === 'user' ? 'message-bubble-user' : 'message-bubble-ai'}`}>
                  {message.sender === 'ai' ? (
                    <div className="markdown-content">
                      <MarkdownMessage content={message.text} isDark={theme === 'dark'} />
                    </div>
                  ) : (
                    <p className="message-text">{message.text}</p>
                  )}
                </div>
                {message.sender === 'user' && (
                  <button
                    className="copy-message-btn"
                    onClick={async () => {
                      await navigator.clipboard.writeText(message.text);
                    }}
                    title="Copy message"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <form onSubmit={handleSendMessage} className="input-form">
              <textarea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={models.length === 0 
                  ? 'Add an API key first to start chatting...' 
                  : `Message ${models.find(m => m.id === selectedModel)?.name || 'AI'}... (Shift+Enter for newline)`}
                rows={1}
                className="input-textarea"
                style={{ maxHeight: '150px', overflowY: 'auto' }} // Prevent excessive growth
                disabled={models.length === 0}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || models.length === 0 || !selectedModel}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="disclaimer">
              {isLoading 
                ? 'Generating response...' 
                : models.length === 0 
                  ? 'Please add an API key to start chatting'
                  : 'AI responses may be inaccurate. Check important info.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}