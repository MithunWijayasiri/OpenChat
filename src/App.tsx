import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Sun, Moon, Send, Bot, User, Plus, Settings, ChevronDown, ChevronsLeft, ChevronsRight, MessageSquare, X, PlusSquare, Trash2, Edit, MoreHorizontal } from 'lucide-react'; // Added Trash2, Edit and MoreHorizontal icons
import './App.css';

// Define message type
type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  modelId?: string;
};

// Define model type (simple for now)
type AIModel = {
  id: string;
  name: string;
  provider?: Provider;
};

// Define provider type
type Provider = 'OpenRouter' | 'Anthropic' | 'Google' | 'OpenAI' | 'Deepseek';

// Define API key storage type
type APIKeyStorage = {
  [key: string]: { 
    provider: Provider, 
    key: string,
    name?: string
  }
};

// Define chat history type
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Chat Title Edit Modal
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

// API Key Modal Component
const ApiKeyModal = ({ isOpen, onClose, onAddKey }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddKey: (provider: Provider, model: string, apiKey: string, modelName: string) => void 
}) => {
  const [provider, setProvider] = useState<Provider>('OpenRouter');
  const [model, setModel] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
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
            <label htmlFor="model">Model ID</label>
            <input 
              type="text" 
              id="model" 
              placeholder="Enter model identifier (e.g., gpt-4)" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="modal-input"
            />
          </div>
          <div className="modal-form-group">
            <label htmlFor="modelName">Display Name</label>
            <input 
              type="text" 
              id="modelName" 
              placeholder="Display name for this model" 
              value={modelName} 
              onChange={(e) => setModelName(e.target.value)}
              className="modal-input"
            />
          </div>
          <div className="modal-form-group">
            <label htmlFor="apiKey">API Key</label>
            <input 
              type="password" 
              id="apiKey" 
              placeholder="Enter API key" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
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

// Real API function to connect to different providers
const sendChatRequest = async (
  message: string, 
  modelId: string, 
  apiKey: string, 
  provider: Provider
): Promise<string> => {
  console.log(`Sending request to ${provider} model: ${modelId}`);
  
  try {
    let response;
    
    switch (provider) {
      case 'OpenRouter':
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OpenGPT Chat'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: message }]
          })
        });
        break;
        
      case 'Anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: message }],
            max_tokens: 1024
          })
        });
        break;
        
      case 'Google':
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: message }] }]
          })
        });
        break;
        
      case 'OpenAI':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: message }]
          })
        });
        break;
        
      case 'Deepseek':
        response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: message }]
          })
        });
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract the text content based on provider-specific response format
    let responseText = '';
    
    switch (provider) {
      case 'OpenRouter':
      case 'OpenAI':
      case 'Deepseek':
        responseText = data.choices[0]?.message?.content || 'No response content';
        break;
        
      case 'Anthropic':
        responseText = data.content[0]?.text || 'No response content';
        break;
        
      case 'Google':
        responseText = data.candidates[0]?.content?.parts[0]?.text || 'No response content';
        break;
        
      default:
        responseText = 'Unrecognized response format';
    }
    
    return responseText;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Function to handle conversation history for better context
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
  // State variables
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Chat history management
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatToEdit, setChatToEdit] = useState<string | null>(null);
  const [chatIdWithMenuOpen, setChatIdWithMenuOpen] = useState<string | null>(null);
  
  // API keys storage
  const [apiKeys, setApiKeys] = useState<APIKeyStorage>({});

  // Initial built-in models - now empty
  const [models, setModels] = useState<AIModel[]>([]);

  // Ref for scrolling to the bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setChatIdWithMenuOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Effect to handle theme changes based on system preference or saved state
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Effect to apply theme class to HTML element and save preference
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Effect to scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to save current chat to history when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      updateCurrentChat();
    }
  }, [messages]);

  // Effect to create a new chat when the app loads if no chats exist
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    } else if (!currentChatId) {
      setCurrentChatId(chats[0].id);
      setMessages(chats[0].messages);
      setSelectedModel(chats[0].modelId);
    }
  }, []);

  // Function to create a new chat
  const createNewChat = () => {
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
  };

  // Function to update current chat in history
  const updateCurrentChat = () => {
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
  };

  // Function to switch to a different chat
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

  // Function to delete a chat
  const deleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    
    if (chats.length <= 1) {
      // Don't delete the last chat, create a new one first
      createNewChat();
    }
    
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // If we deleted the current chat, switch to the first available chat
    if (chatId === currentChatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        switchChat(remainingChats[0].id);
      }
    }
    
    setChatIdWithMenuOpen(null);
  };

  // Function to edit a chat title
  const editChatTitle = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    setChatToEdit(chatId);
    setChatIdWithMenuOpen(null);
  };

  // Function to save edited chat title
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

  // Function to toggle chat options menu
  const toggleChatMenu = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering chat selection
    setChatIdWithMenuOpen(prev => prev === chatId ? null : chatId);
  };

  // Generate a title based on first message or default to timestamp
  const generateChatTitle = (): string => {
    if (messages.length === 0) return 'New Chat';
    
    // Use first user message as title, truncated
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.text.substring(0, 20);
      return title.length < firstUserMessage.text.length ? `${title}...` : title;
    }
    
    // Fallback to date
    return `Chat ${new Date().toLocaleDateString()}`;
  };

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to handle sending messages
  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim(),
      modelId: selectedModel,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Make sure we have a current chat
    if (!currentChatId) {
      createNewChat();
    }

    try {
      // Check if selected model has an API key
      const apiKeyInfo = apiKeys[selectedModel];
      
      // Create AI response
      let aiResponseText = '';
      
      if (apiKeyInfo) {
        // If we have API key info, use the actual API request
        try {
          // Prepare the request body with conversation context
          const reqBody = prepareMessagesForAPI(
            messages, 
            userMessage.text, 
            apiKeyInfo.provider
          );
          
          // Make the API request
          let response;
          
          switch (apiKeyInfo.provider) {
            case 'OpenRouter':
              response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKeyInfo.key}`,
                  'HTTP-Referer': window.location.origin,
                  'X-Title': 'OpenGPT Chat'
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
        // Fallback to simulated response for built-in models
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

  // Function to handle input change
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea (simple version)
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Function to handle Enter key press in textarea (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      // Reset height after sending
      e.currentTarget.style.height = 'auto';
    }
  };

  // Function for adding API keys and creating a new model entry
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
          <div className="model-dropdown">
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
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`dropdown-item ${selectedModel === model.id ? 'dropdown-item-selected' : ''}`}
                  >
                    {model.name}
                    {model.provider && <span className="dropdown-item-provider">({model.provider})</span>}
                  </button>
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
                <button 
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
                </button>

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
            onClick={() => alert('Settings/Account area placeholder.')}
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
                <p className="empty-state-model">No models available. Please add an API key first.</p>
              ) : (
                <p className="empty-state-model">
                  Selected Model: {models.find(m => m.id === selectedModel)?.name || 'None selected'}
                </p>
              )}
              {apiKeys[selectedModel] && (
                <p className="empty-state-provider">Provider: {apiKeys[selectedModel].provider}</p>
              )}
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`message-container ${message.sender === 'user' ? 'message-container-user' : 'message-container-ai'}`}> 
              <div className={`message-bubble-container ${message.sender === 'user' ? 'message-bubble-container-user' : 'message-bubble-container-ai'}`}> 
                <div className={`avatar ${message.sender === 'ai' ? 'avatar-ai' : 'avatar-user'}`}> 
                  {message.sender === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`message-bubble ${message.sender === 'user' ? 'message-bubble-user' : 'message-bubble-ai'}`}>
                  <p className="message-text">{message.text}</p>
                </div>
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
                disabled={!inputMessage.trim() || isLoading || models.length === 0}
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