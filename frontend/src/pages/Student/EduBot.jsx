import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trash2, MessageSquare, Sparkles, Plus, Edit2, Check, ChevronLeft, ChevronRight, Search, Upload } from "lucide-react";
import { sendChatMessage, uploadFile } from "../../services/chatService";

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return { theme };
};

if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key);
        return value ? { value } : null;
      } catch (error) {
        return null;
      }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {}
    },
    list: async (prefix) => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        return { keys };
      } catch (error) {
        return { keys: [] };
      }
    },
    delete: async (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {}
    }
  };
}

const ChatPage = () => {
  const { theme } = useTheme();
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initUser = async () => {
      let user = "default-user";
      setUserId(user);

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

  useEffect(() => {
    if (userId) {
      window.storage.set('sidebarOpen', String(sidebarOpen));
    }
  }, [sidebarOpen, userId]);

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
      createNewConversation(uid);
    }
  };

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
    } catch (error) {}
  };

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
    } catch (error) {}
  };

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
    } catch (error) {}
  };

  const switchConversation = (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages || []);
      inputRef.current?.focus();
    }
  };

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
    } catch (error) {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(inputMessage, userId);

      const aiMessage = {
        sender: "ai",
        text: response.answer || response.message || "I received your message but couldn't generate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      await saveConversation(currentConversationId, finalMessages);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsLoading(true);

      try {
        // Upload the file and get AI analysis
        const response = await uploadFile(file);

        // Create a user message indicating file upload
        const userMessage = {
          sender: "user",
          text: `Uploaded file: ${file.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        // Create AI response with file analysis
        const aiMessage = {
          sender: "ai",
          text: response.answer || "I've analyzed your file and provided a summary above.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        const newMessages = [...messages, userMessage, aiMessage];
        setMessages(newMessages);
        await saveConversation(currentConversationId, newMessages);
      } catch (error) {
        console.error("File upload error:", error);
        const errorMessage = {
          sender: "ai",
          text: "Sorry, I couldn't process your file. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        };

        const newMessages = [...messages, errorMessage];
        setMessages(newMessages);
        await saveConversation(currentConversationId, newMessages);
      } finally {
        setIsLoading(false);
        setSelectedFile(null);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMessages = messages.length;
  const currentConv = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="h-full w-full">
      <div className="flex h-full bg-background">
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-card border-r border-border flex flex-col overflow-hidden`} style={{ flexShrink: 0 }}>
          {sidebarOpen && (
            <>
              <div className="p-5 space-y-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <MessageSquare className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h2 className="font-bold text-lg text-foreground">Chats</h2>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
                <button onClick={() => createNewConversation()} className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />New Chat
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">{searchQuery ? 'Try a different search' : 'Start a new chat'}</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div key={conv.id} className={`group relative rounded-xl p-3 cursor-pointer transition-all ${currentConversationId === conv.id ? 'bg-primary/10 border-2 border-primary/50' : 'hover:bg-secondary/50 border-2 border-transparent'}`} onClick={() => switchConversation(conv.id)}>
                      {editingConvId === conv.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') renameConversation(conv.id, editingTitle); }} className="flex-1 px-3 py-2 rounded-lg text-sm bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
                          <button onClick={() => renameConversation(conv.id, editingTitle)} className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <MessageSquare className={`h-4 w-4 flex-shrink-0 ${currentConversationId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                              <h3 className="text-sm font-semibold truncate text-foreground">{conv.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium text-muted-foreground">{conv.messages.length} messages</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-muted-foreground/70">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setEditingConvId(conv.id); setEditingTitle(conv.title); }}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv); setShowDeleteModal(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center font-medium">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>
              </div>
            </>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="h-10 w-10 rounded-xl hover:bg-accent flex items-center justify-center">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{currentConv?.title || "AI Assistant"}</h1>
                    <p className="text-sm text-muted-foreground">{totalMessages > 0 ? `${totalMessages} message${totalMessages !== 1 ? "s" : ""}` : "Start a conversation"}</p>
                  </div>
                  {currentConv && (
                    <button onClick={() => { setConversationToDelete(currentConv); setShowDeleteModal(true); }} className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center ml-4">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="h-28 w-28 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-8 animate-pulse shadow-xl">
                    <Sparkles className="h-14 w-14 text-primary" />
                  </div>
                  <h3 className="text-4xl font-bold text-foreground mb-4">Welcome to AI Assistant</h3>
                  <p className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-10">Ask me anything! I'm here to help with your questions.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <span className="text-sm px-5 py-2.5 rounded-xl font-medium bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/20 cursor-pointer transition-all">💡 Get help</span>
                    <span className="text-sm px-5 py-2.5 rounded-xl font-medium bg-secondary/50 text-foreground hover:bg-secondary border-2 border-border cursor-pointer transition-all">📚 Learn</span>
                    <span className="text-sm px-5 py-2.5 rounded-xl font-medium bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/20 cursor-pointer transition-all">💬 Chat</span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 mb-6 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.sender === "ai" && (
                        <div className="flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="max-w-[75%] md:max-w-[70%]">
                        <div className={`rounded-2xl px-5 py-3.5 shadow-lg ${msg.sender === "user" ? 'bg-primary text-primary-foreground' : msg.isError ? 'bg-destructive/10 text-destructive border-2 border-destructive/20' : 'bg-card border-2 border-border text-card-foreground'}`}>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-2 px-2 font-medium ${msg.sender === "user" ? "text-right" : "text-left"}`}>{msg.timestamp}</p>
                      </div>
                      {msg.sender === "user" && (
                        <div className="flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 mb-6">
                      <div className="flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="rounded-2xl px-5 py-3.5 bg-card border-2 border-border shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <span className="h-2.5 w-2.5 bg-muted-foreground rounded-full animate-bounce"></span>
                            <span className="h-2.5 w-2.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                            <span className="h-2.5 w-2.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">AI thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
          <div className="bg-card border-t border-border px-6 py-5">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea ref={(el) => { textareaRef.current = el; inputRef.current = el; }} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." className="w-full px-5 py-4 pr-20 rounded-2xl border-2 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all shadow-sm" rows="1" style={{ minHeight: "56px", maxHeight: "120px" }} disabled={isLoading} />
                  <div className="absolute right-4 bottom-4 text-xs text-muted-foreground font-semibold">{inputMessage.length}/1000</div>
                </div>
                <button onClick={handleUploadClick} className="h-[56px] px-5 rounded-2xl font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </button>
                <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} className="h-[56px] px-7 rounded-2xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,application/pdf,text/*" />
              <p className="text-xs text-muted-foreground mt-3 text-center font-medium">Press <kbd className="px-2.5 py-1 bg-secondary border border-border text-foreground rounded-lg font-semibold">Enter</kbd> to send • <kbd className="px-2.5 py-1 bg-secondary border border-border text-foreground rounded-lg font-semibold">Shift+Enter</kbd> for new line</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && conversationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border-2 border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Conversation</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "{conversationToDelete.title}"? This will permanently remove the conversation and all its messages.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConversationToDelete(null);
                }}
                className="flex-1 h-11 rounded-xl font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteConversation(conversationToDelete.id);
                  setShowDeleteModal(false);
                  setConversationToDelete(null);
                }}
                className="flex-1 h-11 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
