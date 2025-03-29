import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Sun, Moon, Send, Bot, User, Plus, Settings, ChevronDown, ChevronsLeft, ChevronsRight, MessageSquare } from 'lucide-react'; // Import icons
import './App.css';

// Define message type
type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

// Define model type (simple for now)
type AIModel = {
  id: string;
  name: string;
};

export default function ChatPage() {
  // State variables
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('model-a');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  // Placeholder for API keys - In a real app, this would be more complex and secure
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});

  const models: AIModel[] = [
    { id: 'model-a', name: 'GPT-4o Mini' },
    { id: 'model-b', name: 'Claude 3 Sonnet' },
    { id: 'model-c', name: 'Llama 3 8B' },
  ];

  // Ref for scrolling to the bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to handle sending messages
  const handleSendMessage = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');

    // Simulate AI response, now aware of the selected model
    setTimeout(() => {
      const currentModelName = models.find(m => m.id === selectedModel)?.name || 'AI';
      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        // Updated response to reflect current model and imply context awareness
        text: `(${currentModelName}): You said "${userMessage.text}". I'm now responding based on our conversation so far.`,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
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

  // Placeholder function for adding API keys
  const handleAddApiKey = () => {
    const modelId = prompt(`Enter model ID to add key for (e.g., ${models.map(m=>m.id).join(', ')}):`);
    if (!modelId || !models.some(m => m.id === modelId)) {
        alert('Invalid or no model ID entered.');
        return;
    }
    const apiKey = prompt(`Enter API Key for ${models.find(m=>m.id === modelId)?.name}:`);
    if (modelId && apiKey) {
      setApiKeys(prev => ({ ...prev, [modelId]: apiKey }));
      alert(`API Key added for ${models.find(m=>m.id === modelId)?.name}. (Note: This is stored in component state and not secure or used in this demo)`);
      console.log('Current API Keys:', { ...apiKeys, [modelId]: apiKey }); // Log for debugging
    } else {
        alert('API Key addition cancelled or invalid input.');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}> 
        <div className={`sidebar-content ${isSidebarCollapsed ? 'sidebar-centered' : ''}`}> 
          {/* Model Selector Dropdown */}
          <div className="model-dropdown">
            <button
              onClick={() => !isSidebarCollapsed && setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isSidebarCollapsed}
              className={`dropdown-button ${isSidebarCollapsed ? 'dropdown-button-centered' : ''}`}
            >
              {isSidebarCollapsed ? (
                 <Bot size={18} className="flex-shrink-0" />
              ) : (
                <>
                  <span className="text-sm font-medium truncate">{models.find(m => m.id === selectedModel)?.name || 'Select Model'}</span>
                  <ChevronDown size={16} className={`dropdown-icon ${isModelDropdownOpen ? 'dropdown-icon-rotated' : ''}`} />
                </>
              )}
            </button>
            {!isSidebarCollapsed && isModelDropdownOpen && (
              <div className="dropdown-menu">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelDropdownOpen(false);
                      // setMessages([]); // Removed this line to preserve context
                    }}
                    className={`dropdown-item ${selectedModel === model.id ? 'dropdown-item-selected' : ''}`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="chat-history no-scrollbar">
            {!isSidebarCollapsed && <h2 className="history-title">History</h2>}
            {/* Example History Item */}
            <button className={`history-item ${isSidebarCollapsed ? 'history-item-centered' : ''}`}> 
              <MessageSquare size={16} className={`history-item-icon ${!isSidebarCollapsed ? 'history-item-icon-with-margin' : ''}`} />
              {!isSidebarCollapsed && <span>Previous chat...</span>}
            </button>
            <button className={`history-item ${isSidebarCollapsed ? 'history-item-centered' : ''}`}> 
              <MessageSquare size={16} className={`history-item-icon ${!isSidebarCollapsed ? 'history-item-icon-with-margin' : ''}`} />
              {!isSidebarCollapsed && <span>Another chat...</span>}
            </button>
            {/* Add more chat history items here */}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`sidebar-footer ${isSidebarCollapsed ? 'sidebar-footer-spaced' : ''}`}> 
           <button
            onClick={handleAddApiKey}
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
              <p className="empty-state-model">Selected Model: {models.find(m => m.id === selectedModel)?.name || 'N/A'}</p>
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
                placeholder={`Message ${models.find(m => m.id === selectedModel)?.name || 'AI'}... (Shift+Enter for newline)`}
                rows={1}
                className="input-textarea"
                style={{ maxHeight: '150px', overflowY: 'auto' }} // Prevent excessive growth
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="disclaimer">AI responses may be inaccurate. Check important info.</p>
          </div>
        </div>
      </div>
    </div>
  );
}