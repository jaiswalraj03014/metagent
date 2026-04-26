"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import logo from '../assets/logo.png'; 

// Define our types
type Message = { role: string; content: string };
type ChatSession = { id: string; title: string; messages: Message[] };

export default function MetagentUI() {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  
  // The Welcome Modal State
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Session-based chats with the new, authoritative greeting
  const [chats, setChats] = useState<ChatSession[]>([
    { 
      id: '1', 
      title: 'New Chat', 
      messages: [{ role: 'system', content: "Hello. I am Metagent, your dedicated agent for exploring enterprise data. I am connected to your OpenMetadata context and ready to help you analyze your schemas safely. What would you like to know?" }] 
    }
  ]);
  const [activeChatId, setActiveChatId] = useState<string>('1');

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // --- EFFECTS ---
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('metagent_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeChat.messages]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- ACTIONS ---
  
  const closeWelcome = () => {
    localStorage.setItem('metagent_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    setChats(prev => [
      { id: newId, title: 'New Chat', messages: [{ role: 'system', content: "New session started. I am Metagent, your data context agent. What are we analyzing today?" }] },
      ...prev
    ]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
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
      
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, { role: 'system', content: data.reply }] };
        }
        return chat;
      }));
    } catch (error) {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, { role: 'system', content: 'Connection failed. Please check your network and try again.' }] };
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
      
      {/* THE WELCOME MODAL */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative max-w-sm w-full rounded-3xl p-8 overflow-hidden shadow-2xl shadow-purple-900/50 border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6F1695]/90 to-[#A44C93]/90 backdrop-blur-xl"></div>
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}>
            </div>

            <div className="relative z-10 text-white space-y-6">
              <div className="flex justify-center mb-6">
                <Image src={logo} alt="Logo" width={80} height={80} className="object-contain" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight mb-1">Welcome</h2>
                <p className="text-xs text-purple-200 uppercase tracking-wider">Enterprise Data AI</p>
              </div>
              
              <ul className="space-y-4 text-sm text-purple-50 leading-relaxed font-medium list-disc list-inside">
                <li><strong>Temporary Memory:</strong> This session is local. If you refresh the page, your chat history instantly clears.</li>
                <li><strong>No Hallucinations:</strong> Answers are strictly grounded in your live OpenMetadata schemas.</li>
                <li><strong>Secure:</strong> Built-in guardrails automatically block queries for PII and sensitive data.</li>
              </ul>

              <button 
                onClick={closeWelcome} 
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Let's Chat
              </button>
            </div>
          </div>
        </div>
      )}

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
              Chat: {chat.title}
            </button>
          ))}
        </div>

        <div className={`p-4 border-t ${borderCol} w-64`}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
              ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
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
            <div className="hidden sm:block">
               <Image src={logo} alt="Brand Logo" width={32} height={32} className="object-contain" />
            </div>
          </div>
        </header>

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
              placeholder="Message your data context..."
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
        </div>

      </main>
    </div>
  );
}