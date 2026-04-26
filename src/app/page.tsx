"use client";

import { useState, useEffect, useRef } from 'react';

// Define our types
type Message = { role: string; content: string };
type ChatSession = { id: string; title: string; messages: Message[] };

export default function MetagentUI() {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  
  // Session-based chats
  const [chats, setChats] = useState<ChatSession[]>([
    { 
      id: '1', 
      title: 'New Chat', 
      messages: [{ role: 'system', content: "Hello! I'm Metagent. I'm connected to your OpenMetadata context. How can I help?" }] 
    }
  ]);
  const [activeChatId, setActiveChatId] = useState<string>('1');

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // --- EFFECTS ---
  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeChat.messages]);

  // Apply dark mode to HTML tag for scrollbars
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- ACTIONS ---
  const createNewChat = () => {
    const newId = Date.now().toString();
    setChats(prev => [
      { id: newId, title: 'New Chat', messages: [{ role: 'system', content: "New session started. What's on your mind?" }] },
      ...prev
    ]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Auto-close on mobile
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Update the active chat with the user's message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        // Auto-rename the chat based on the first question
        const newTitle = chat.messages.length === 1 ? userMessage.slice(0, 25) + '...' : chat.title;
        return { ...chat, title: newTitle, messages: [...chat.messages, { role: 'user', content: userMessage }] };
      }
      return chat;
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await res.json();
      
      // Update the active chat with AI response
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, { role: 'system', content: data.reply }] };
        }
        return chat;
      }));
    } catch (error) {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, { role: 'system', content: '🚨 Connection failed.' }] };
        }
        return chat;
      }));
    }
    
    setIsLoading(false);
  };

  // --- DYNAMIC THEME CLASSES ---
  const bgMain = isDarkMode ? 'bg-[#05070a]' : 'bg-slate-50';
  const bgSidebar = isDarkMode ? 'bg-[#0a0c12]' : 'bg-slate-100';
  const textMain = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const borderCol = isDarkMode ? 'border-white/10' : 'border-slate-200';
  const botBubble = isDarkMode ? 'bg-slate-800 text-slate-300 shadow-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100';

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${bgMain} ${textMain}`}>
      
      {/* SIDEBAR */}
      <aside 
        className={`fixed md:relative z-20 h-full flex flex-col transition-all duration-300 ease-in-out ${bgSidebar} border-r ${borderCol}
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden border-transparent'} `}
      >
        <div className="p-4 w-64">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center gap-2 brand-gradient-bg text-white px-4 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20"
          >
            <span className="text-xl leading-none">+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 w-64 space-y-1">
          <p className="px-2 text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Sessions</p>
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left px-3 py-3 rounded-lg text-sm truncate transition-colors ${
                activeChatId === chat.id 
                  ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-black shadow-sm font-medium')
                  : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-200/50')
              }`}
            >
              💬 {chat.title}
            </button>
          ))}
        </div>

        {/* SETTINGS (Theme Toggle) */}
        <div className={`p-4 border-t ${borderCol} w-64`}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
              ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <span>{isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            <span className="text-xs border px-2 py-1 rounded-md opacity-50 border-current">Toggle</span>
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        
        {/* HEADER */}
        <header className={`flex items-center justify-between p-4 border-b ${borderCol} ${isDarkMode ? 'bg-[#05070a]/80' : 'bg-slate-50/80'} backdrop-blur-md absolute top-0 w-full z-10`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-md transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="font-bold tracking-tight brand-text-gradient hidden sm:block">METAGENT</h2>
          </div>
        </header>

        {/* CHAT MESSAGES */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-12 pt-24 pb-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'brand-gradient-bg text-white shadow-lg shadow-purple-500/20 rounded-tr-sm' 
                    : `${botBubble} rounded-tl-sm whitespace-pre-wrap`
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`${botBubble} rounded-2xl rounded-tl-sm px-6 py-4 flex gap-1.5 items-center`}>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INPUT BOX */}
        <div className={`p-4 md:p-6 pb-6 md:pb-8 bg-gradient-to-t ${isDarkMode ? 'from-[#05070a] via-[#05070a]/90' : 'from-slate-50 via-slate-50/90'} to-transparent`}>
          <form 
            onSubmit={sendMessage} 
            className={`max-w-3xl mx-auto flex items-end p-2 rounded-2xl shadow-xl transition-all duration-300 border focus-within:border-purple-500/50 focus-within:ring-2 ring-purple-500/20
              ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Message Metagent..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 resize-none max-h-32 min-h-[44px]"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="brand-gradient-bg text-white p-2.5 m-1 rounded-xl transition-all disabled:opacity-30 disabled:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
          <p className={`text-center text-[10px] mt-3 tracking-wide ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Metagent can make mistakes. Verify critical database schemas.
          </p>
        </div>

      </main>
    </div>
  );
}