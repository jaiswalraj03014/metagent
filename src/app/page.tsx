"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import logo from '../assets/logo.png'; 
import ReactMarkdown from 'react-markdown';

// Define our types
type Message = { role: string; content: string };
type ChatSession = { id: string; title: string; messages: Message[]; isPinned?: boolean };

// The tables we KNOW work for the demo
const DEMO_TABLES = [
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.user_entity", name: "user_entity (PII Demo)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.bot_entity", name: "bot_entity (Security Demo)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.ACT_HI_PROCINST", name: "ACT_HI_PROCINST (Auto-Doc Demo)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.table_entity", name: "table_entity (Core Metadata)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.role_entity", name: "role_entity (Governance)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.team_entity", name: "team_entity (Organization)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.dashboard_entity", name: "dashboard_entity (Analytics)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.pipeline_entity", name: "pipeline_entity (Engineering)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.topic_entity", name: "topic_entity (Streaming)" },
    { fqn: "local_mysql.openmetadata_db.openmetadata_db.audit_log_event", name: "audit_log_event (Tracking)" }
];
const DEFAULT_TABLE_FQN = DEMO_TABLES[0]!.fqn;

export default function MetagentUI() {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Table Selection State
  const [selectedTable, setSelectedTable] = useState(DEFAULT_TABLE_FQN);

  // Chat Actions State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Session-based chats
  const defaultGreeting = "Hello. I am Metagent, your dedicated agent for exploring enterprise data. I am connected to your OpenMetadata context and ready to help you analyze your schemas safely. What would you like to know?";
  
  const [chats, setChats] = useState<ChatSession[]>([
    { id: '1', title: 'New Chat', messages: [{ role: 'system', content: defaultGreeting }] }
  ]);
  const [activeChatId, setActiveChatId] = useState<string>('1');

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // --- EFFECTS ---
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('metagent_welcome_seen');
    if (!hasSeenWelcome) setShowWelcome(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- CHAT ACTIONS ---

  const createNewChat = () => {
    const newId = Date.now().toString();
    setChats(prev => [
      { id: newId, title: 'New Chat', messages: [{ role: 'system', content: "New session started. I am Metagent, your data context agent. What are we analyzing today?" }] },
      ...prev
    ]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remainingChats = chats.filter(c => c.id !== id);
    
    if (remainingChats.length === 0) {
      // If we deleted the last chat, create a new one automatically
      const newId = Date.now().toString();
      setChats([{ id: newId, title: 'New Chat', messages: [{ role: 'system', content: defaultGreeting }] }]);
      setActiveChatId(newId);
    } else {
      setChats(remainingChats);
      if (activeChatId === id) setActiveChatId(remainingChats[0]!.id);
    }
    setMenuOpenId(null);
  };

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    setMenuOpenId(null);
  };

  const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
    }
    setEditingId(null);
  };

  const closeWelcome = () => {
    localStorage.setItem('metagent_welcome_seen', 'true');
    setShowWelcome(false);
  };

  // --- MESSAGE SENDING ---
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        // Only auto-rename if the chat is still named "New Chat" and isn't pinned
        const newTitle = (chat.title === 'New Chat' && chat.messages.length === 1) 
          ? userMessage.slice(0, 25) + '...' 
          : chat.title;
        return { ...chat, title: newTitle, messages: [...chat.messages, { role: 'user', content: userMessage }] };
      }
      return chat;
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          tableFQN: selectedTable // Passing the selected table to the backend
        })
      });
      const data = await res.json();
      
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) return { ...chat, messages: [...chat.messages, { role: 'system', content: data.reply }] };
        return chat;
      }));
    } catch (error) {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) return { ...chat, messages: [...chat.messages, { role: 'system', content: 'Connection failed. Please check your network and try again.' }] };
        return chat;
      }));
    }
    setIsLoading(false);
  };

  // Sort chats so pinned chats are always at the top
  const sortedChats = [...chats].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

  // --- DYNAMIC THEME CLASSES ---
  const bgMain = isDarkMode ? 'bg-[#05070a]' : 'bg-slate-50';
  const bgSidebar = isDarkMode ? 'bg-[#0a0c12]' : 'bg-slate-100';
  const textMain = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const borderCol = isDarkMode ? 'border-white/10' : 'border-slate-200';
  const botBubble = isDarkMode ? 'bg-slate-800 text-slate-300 shadow-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100';
  const dropdownBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl';
  const dropdownItemHover = isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700';

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

        <div className="flex-1 overflow-y-auto px-3 w-64 space-y-1 relative pb-4">
          <p className="px-2 text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Sessions</p>
          
          {sortedChats.map(chat => (
            <div key={chat.id} className="relative group">
              {editingId === chat.id ? (
                // RENAME INPUT MODE
                <div className={`flex items-center px-3 py-2.5 rounded-lg border focus-within:border-purple-500 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}>
                  <input 
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveRename(chat.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveRename(chat.id) }}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-inherit"
                  />
                </div>
              ) : (
                // STANDARD CHAT BUTTON MODE
                <button
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors pr-8 ${
                    activeChatId === chat.id 
                      ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-black shadow-sm font-medium')
                      : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-200/50')
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    {chat.isPinned ? (
                      <svg className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                    ) : '💬'} 
                    <span className="truncate">{chat.title}</span>
                  </span>
                  
                  {/* The 3-Dots Menu Trigger */}
                  <div 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-500/20"
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === chat.id ? null : chat.id) }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                  </div>
                </button>
              )}

              {/* ACTION MENU DROPDOWN */}
              {menuOpenId === chat.id && (
                <>
                  {/* Invisible Overlay to close menu on outside click */}
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)}></div>
                  <div className={`absolute right-2 top-10 z-40 w-36 py-1 rounded-xl border shadow-xl ${dropdownBg}`}>
                    <button onClick={(e) => startRename(e, chat.id, chat.title)} className={`w-full text-left px-4 py-2 text-sm transition-colors ${dropdownItemHover}`}>
                      Rename
                    </button>
                    <button onClick={(e) => togglePin(e, chat.id)} className={`w-full text-left px-4 py-2 text-sm transition-colors ${dropdownItemHover}`}>
                      {chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                    </button>
                    <div className={`my-1 border-t ${borderCol}`}></div>
                    <button onClick={(e) => deleteChat(e, chat.id)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                      Delete Chat
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* --- TABLE SELECTOR IN SIDEBAR --- */}
        <div className={`p-4 border-t ${borderCol} w-64`}>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2 tracking-wider">Active Table Context</p>
          <div className="relative">
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className={`w-full appearance-none px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {DEMO_TABLES.map((table) => (
                <option key={table.fqn} value={table.fqn}>
                  {table.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
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
            {activeChat?.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'brand-gradient-bg text-white shadow-lg shadow-purple-500/20 rounded-tr-sm' 
                    : `${botBubble} rounded-tl-sm`
                }`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown 
                      className="flex flex-col gap-2"
                      components={{
                        strong: ({node, ...props}) => <strong className="font-semibold text-purple-400" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                        li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
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