import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Trash2,
  MessageSquare,
  Sparkles,
  Plus,
  Menu,
  X,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock theme context
const useTheme = () => {
  const [theme, setTheme] = useState('light');
  return { theme, setTheme };
};

// Define storage API if not available
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key);
        return value ? { value } : null;
      } catch (error) {
        console.error('Storage get error:', error);
        return null;
      }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Storage set error:', error);
      }
    },
    list: async (prefix) => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        return { keys };
      } catch (error) {
        console.error('Storage list error:', error);
        return { keys: [] };
      }
    },
    delete: async (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Storage delete error:', error);
      }
    }
  };
}

const ChatPage = () => {
  const { theme, setTheme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize user and load conversations
  useEffect(() => {
    const initUser = async () => {
      let user = "default-user";
      setUserId(user);

      // Load sidebar preference
      try {
        const sidebarResult = await window.storage.get('sidebarOpen');
        if (sidebarResult) {
          setSidebarOpen(sidebarResult.value === 'true');
        }
      } catch {
        setSidebarOpen(true);
      }

      await loadConversations(user);
    };
    initUser();
  }, []);

  // Save sidebar preference
  useEffect(() => {
    if (userId) {
      window.storage.set('sidebarOpen', String(sidebarOpen));
    }
  }, [sidebarOpen, userId]);

  // Load conversations from storage
  const loadConversations = async (uid) => {
    try {
      const result = await window.storage.list(`conv_${uid}_`);
      if (result && result.keys) {
        const convPromises = result.keys.map(async (key) => {
          try {
            const data = await window.storage.get(key);
            return data ? JSON.parse(data.value) : null;
          } catch {
            return null;
          }
        });
        const convs = (await Promise.all(convPromises)).filter(Boolean);
        convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setConversations(convs);
        
        if (convs.length === 0) {
          createNewConversation(uid);
        } else {
          setCurrentConversationId(convs[0].id);
          setMessages(convs[0].messages || []);
        }
      } else {
        createNewConversation(uid);
      }
    } catch (error) {
      console.log("No existing conversations, starting fresh");
      createNewConversation(uid);
    }
  };

  // Create new conversation
  const createNewConversation = async (uid = userId) => {
    const newConv = {
      id: `conv_${Date.now()}`,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await window.storage.set(`conv_${uid}_${newConv.id}`, JSON.stringify(newConv));
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Save conversation
  const saveConversation = async (convId, newMessages) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const updatedConv = {
      ...conv,
      messages: newMessages,
      updatedAt: new Date().toISOString(),
      title: conv.title === "New Chat" && newMessages.length > 0
        ? newMessages[0].text.substring(0, 40) + (newMessages[0].text.length > 40 ? "..." : "")
        : conv.title,
    };

    try {
      await window.storage.set(`conv_${userId}_${convId}`, JSON.stringify(updatedConv));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? updatedConv : c))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId) => {
    try {
      await window.storage.delete(`conv_${userId}_${convId}`);
      const newConvs = conversations.filter((c) => c.id !== convId);
      setConversations(newConvs);
      
      if (currentConversationId === convId) {
        if (newConvs.length > 0) {
          setCurrentConversationId(newConvs[0].id);
          setMessages(newConvs[0].messages || []);
        } else {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // Switch conversation
  const switchConversation = (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages || []);
      inputRef.current?.focus();
    }
  };

  // Rename conversation
  const renameConversation = async (convId, newTitle) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const updatedConv = { ...conv, title: newTitle };
    try {
      await window.storage.set(`conv_${userId}_${convId}`, JSON.stringify(updatedConv));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? updatedConv : c))
      );
      setEditingConvId(null);
    } catch (error) {
      console.error("Error renaming conversation:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversationId) return;

    const userMessage = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Simulated AI response for demo
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiMessage = {
        sender: "ai",
        text: "This is a demo response. In production, this would connect to your AI backend at http://localhost:5001/chat",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      await saveConversation(currentConversationId, finalMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      await saveConversation(currentConversationId, finalMessages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMessages = messages.length;
  const currentConv = conversations.find(c => c.id === currentConversationId);

  return (
    <div className={`h-full ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`flex h-full ${theme === 'dark' ? 'bg-[#1a1b26]' : 'bg-white'}`}>
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 ease-in-out ${
            theme === 'dark' 
              ? 'bg-[#1a1b26] border-gray-800/30' 
              : 'bg-white/80 backdrop-blur-xl border-slate-200/60'
          } border-r flex flex-col overflow-hidden`}
          style={{ flexShrink: 0 }}
        >
          {sidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className={`p-5 space-y-3 border-b ${theme === 'dark' ? 'border-gray-800/30' : 'border-slate-200/60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600' 
                        : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                    } flex items-center justify-center shadow-lg shadow-purple-500/30`}>
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Chats
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className={`h-9 w-9 p-0 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>

                <Button
                  onClick={() => createNewConversation()}
                  className={`w-full h-11 rounded-xl font-medium ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30'
                  } transition-all`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Chat
                </Button>

                {/* Search */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm ${
                      theme === 'dark'
                        ? 'bg-[#24263a] border-gray-800/30 text-white placeholder:text-gray-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    } border focus:outline-none focus:ring-2 ${
                      theme === 'dark' ? 'focus:ring-purple-600/50' : 'focus:ring-blue-500/50'
                    } transition-all`}
                  />
                </div>
              </div>



              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className={`h-16 w-16 mx-auto mb-3 rounded-2xl ${
                      theme === 'dark' ? 'bg-[#24263a]' : 'bg-slate-100'
                    } flex items-center justify-center`}>
                      <MessageSquare className={`h-8 w-8 ${theme === 'dark' ? 'text-gray-600' : 'text-slate-400'}`} />
                    </div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-slate-400'}`}>
                      {searchQuery ? 'Try a different search' : 'Start a new chat to begin'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative rounded-xl p-3 cursor-pointer transition-all ${
                        currentConversationId === conv.id
                          ? theme === 'dark'
                            ? 'bg-[#7c3aed]/20 border-2 border-[#7c3aed]/50'
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300/60 shadow-md shadow-blue-200/50'
                          : theme === 'dark'
                          ? 'hover:bg-[#24263a] border-2 border-transparent'
                          : 'hover:bg-slate-50/80 border-2 border-transparent'
                      }`}
                      onClick={() => switchConversation(conv.id)}
                    >
                      {editingConvId === conv.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                renameConversation(conv.id, editingTitle);
                              }
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              theme === 'dark'
                                ? 'bg-[#24263a] text-white border-gray-700'
                                : 'bg-white border-slate-300'
                            } border focus:outline-none focus:ring-2 ${
                              theme === 'dark' ? 'focus:ring-purple-600' : 'focus:ring-blue-500'
                            }`}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => renameConversation(conv.id, editingTitle)}
                            className={`h-8 w-8 p-0 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
                                  currentConversationId === conv.id
                                    ? theme === 'dark' ? 'text-purple-400' : 'text-blue-600'
                                    : theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
                                }`} />
                                <h3 className={`text-sm font-semibold truncate ${
                                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                                }`}>
                                  {conv.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                  {conv.messages.length} messages
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-600' : 'text-slate-300'}>•</span>
                                <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}>
                                  {new Date(conv.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 rounded-lg ${
                                  theme === 'dark'
                                    ? 'hover:bg-[#2a2d42] text-gray-400 hover:text-white'
                                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingConvId(conv.id);
                                  setEditingTitle(conv.title);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this conversation?')) {
                                    deleteConversation(conv.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Sidebar Footer */}
              <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800/30' : 'border-slate-200/60'} space-y-2`}>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'} text-center font-medium`}>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} total
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className={`${
            theme === 'dark'
              ? 'bg-[#1a1b26] border-gray-800/30'
              : 'bg-white/90 backdrop-blur-xl border-slate-200/60'
          } border-b px-6 py-4`}>
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className={`h-10 w-10 p-0 rounded-xl ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600'
                      : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                  } flex items-center justify-center shadow-lg ${
                    theme === 'dark' ? 'shadow-purple-500/30' : 'shadow-blue-500/30'
                  }`}>
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className={`text-xl font-bold ${
                      theme === 'dark'
                        ? 'text-white'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
                    }`}>
                      {currentConv?.title || "AI Assistant"}
                    </h1>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                      {totalMessages > 0
                        ? `${totalMessages} message${totalMessages !== 1 ? "s" : ""}`
                        : "Start a conversation"}
                    </p>
                  </div>
                  {currentConv && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete conversation "${currentConv.title}"? This action cannot be undone.`)) {
                          deleteConversation(currentConv.id);
                        }
                      }}
                      className={`h-10 w-10 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-[#1a1b26]' : ''}`}>
            <div className="max-w-4xl mx-auto px-6 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className={`h-28 w-28 rounded-3xl ${
                    theme === 'dark'
                      ? 'bg-[#7c3aed]/10 border-2 border-[#7c3aed]/30'
                      : 'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-2 border-blue-200/50'
                  } flex items-center justify-center mb-8 animate-pulse shadow-2xl ${
                    theme === 'dark' ? 'shadow-purple-900/30' : 'shadow-blue-300/40'
                  }`}>
                    <Sparkles className={`h-14 w-14 ${theme === 'dark' ? 'text-purple-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-4`}>
                    Welcome to AI Assistant
                  </h3>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} max-w-lg leading-relaxed mb-10`}>
                    Ask me anything! I'm here to help with your questions,
                    provide information, or just have a friendly conversation.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge className={`text-sm px-5 py-2.5 rounded-xl font-medium ${
                      theme === 'dark'
                        ? 'bg-[#7c3aed]/20 text-purple-200 hover:bg-[#7c3aed]/30 border-2 border-[#7c3aed]/40'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-200/60'
                    } cursor-pointer transition-all`}>
                      💡 Get help
                    </Badge>
                    <Badge className={`text-sm px-5 py-2.5 rounded-xl font-medium ${
                      theme === 'dark'
                        ? 'bg-[#3b82f6]/20 text-blue-200 hover:bg-[#3b82f6]/30 border-2 border-[#3b82f6]/40'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-2 border-indigo-200/60'
                    } cursor-pointer transition-all`}>
                      📚 Learn something
                    </Badge>
                    <Badge className={`text-sm px-5 py-2.5 rounded-xl font-medium ${
                      theme === 'dark'
                        ? 'bg-[#ec4899]/20 text-pink-200 hover:bg-[#ec4899]/30 border-2 border-[#ec4899]/40'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-2 border-purple-200/60'
                    } cursor-pointer transition-all`}>
                      💬 Chat freely
                    </Badge>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 mb-6 ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      {message.sender === "ai" && (
                        <div className={`flex-shrink-0 h-11 w-11 rounded-2xl ${
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600'
                            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                        } flex items-center justify-center shadow-lg ${
                          theme === 'dark' ? 'shadow-purple-500/30' : 'shadow-blue-500/30'
                        }`}>
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}

                      <div className={`max-w-[75%] md:max-w-[70%]`}>
                        <div
                          className={`rounded-2xl px-5 py-3.5 shadow-lg ${
                            message.sender === "user"
                              ? theme === 'dark'
                                ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-purple-500/30'
                                : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/30'
                              : message.isError
                              ? theme === 'dark'
                                ? 'bg-red-900/30 text-red-200 border-2 border-red-800/50'
                                : 'bg-gradient-to-br from-red-50 to-red-100 text-red-800 border-2 border-red-200'
                              : theme === 'dark'
                              ? 'bg-[#24263a] border-2 border-gray-700/30 text-gray-100'
                              : 'bg-white border-2 border-slate-200/60 text-slate-800 shadow-slate-200/50'
                          }`}
                        >
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'} mt-2 px-2 font-medium ${
                          message.sender === "user" ? "text-right" : "text-left"
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>

                      {message.sender === "user" && (
                        <div className={`flex-shrink-0 h-11 w-11 rounded-2xl ${
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600'
                            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                        } flex items-center justify-center shadow-lg ${
                          theme === 'dark' ? 'shadow-purple-500/30' : 'shadow-blue-500/30'
                        }`}>
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-4 mb-6 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className={`flex-shrink-0 h-11 w-11 rounded-2xl ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600'
                          : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                      } flex items-center justify-center shadow-lg ${
                        theme === 'dark' ? 'shadow-purple-500/30' : 'shadow-blue-500/30'
                      }`}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="max-w-[70%]">
                        <div className={`rounded-2xl px-5 py-3.5 ${
                          theme === 'dark' ? 'bg-[#24263a] border-2 border-gray-700/30' : 'bg-white border-2 border-slate-200/60'
                        } shadow-lg`}>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              <span className={`h-2.5 w-2.5 ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'} rounded-full animate-bounce`}></span>
                              <span className={`h-2.5 w-2.5 ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'} rounded-full animate-bounce [animation-delay:0.2s]`}></span>
                              <span className={`h-2.5 w-2.5 ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'} rounded-full animate-bounce [animation-delay:0.4s]`}></span>
                            </div>
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                              AI is thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className={`${
            theme === 'dark'
              ? 'bg-[#1a1b26] border-gray-800/30'
              : 'bg-white/90 backdrop-blur-xl border-slate-200/60'
          } border-t px-6 py-5`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={(el) => {
                      textareaRef.current = el;
                      inputRef.current = el;
                    }}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    className={`w-full px-5 py-4 pr-20 rounded-2xl border-2 ${
                      theme === 'dark'
                        ? 'bg-[#24263a] border-gray-700/30 text-white placeholder:text-gray-500 focus:border-purple-600 focus:ring-purple-900/30'
                        : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-100'
                    } focus:ring-4 outline-none resize-none transition-all shadow-sm`}
                    rows="1"
                    style={{
                      minHeight: "56px",
                      maxHeight: "120px",
                    }}
                    disabled={isLoading}
                  />
                  <div className={`absolute right-4 bottom-4 text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-slate-400'} font-semibold`}>
                    {inputMessage.length}/1000
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`h-[56px] px-7 rounded-2xl font-medium ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/30'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30'
                  } hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-slate-500'} mt-3 text-center font-medium`}>
                Press <kbd className={`px-2.5 py-1 ${theme === 'dark' ? 'bg-[#24263a] border-gray-700 text-gray-300' : 'bg-slate-100 border-slate-300 text-slate-700'} border rounded-lg font-semibold`}>Enter</kbd> to send •{" "}
                <kbd className={`px-2.5 py-1 ${theme === 'dark' ? 'bg-[#24263a] border-gray-700 text-gray-300' : 'bg-slate-100 border-slate-300 text-slate-700'} border rounded-lg font-semibold`}>Shift + Enter</kbd> for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;