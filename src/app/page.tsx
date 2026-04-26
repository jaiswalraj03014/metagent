"use client";

import { useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([{ role: 'system', content: 'Hello! I am Metagent. What data would you like to explore?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'system', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: '🚨 Connection failed.' }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 font-sans">
      <header className="mb-6 mt-4 text-center">
        <h1 className="text-3xl font-bold text-blue-400 mb-2">🧠 Metagent</h1>
        <p className="text-slate-400 text-sm">Enterprise Data Governance & Context AI</p>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-700 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none whitespace-pre-wrap'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 rounded-2xl rounded-bl-none px-5 py-3 animate-pulse">
              Analyzing schema...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a table, column, or data type..."
          className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}