import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.full_name || 'Supervisor'}! I am your HostelWise AI assistant. I have reviewed the real-time energy logs and student check-ins for your hostel. How can I help you optimize energy audit workflows today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "How can I improve our power factor efficiency?",
    "Give me quick energy audit advice for lighting schedules.",
    "Explain standard practices to control baseload standby losses.",
    "Summarize energy checks during active vs passive student cycles."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;
    setError('');
    
    // Add user message
    const userMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await api.post('/ai/chat', { message: textToSend });
      const aiResponse = { sender: 'ai', text: response.data.response };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error("AI assistant connection error:", err);
      setError(err.response?.data?.detail || "Could not connect to Ollama local instance. Please make sure Ollama is running and has the model installed.");
      
      // Add error mock response
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "Error: I am unable to connect to the local Ollama LLM endpoint. Please verify Ollama is started locally and the Llama3/Gemma model is downloaded."
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
            AI Audit Assistant
          </h2>
          <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary">
            Conversational smart auditor powered by local Large Language Models (Ollama).
          </p>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Left Chat logs column */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium overflow-hidden">
          {/* Scrollable messages container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3.5 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Icon avatar */}
                <div className={`w-8 h-8 rounded-premium-sm flex items-center justify-center shrink-0 ${
                  m.sender === 'user' 
                    ? 'bg-brand-veryLightBlue text-brand-primary' 
                    : 'bg-brand-primary text-white shadow-premium'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className={`p-4 rounded-premium text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-brand-primary text-white font-semibold'
                    : 'bg-brand-bg dark:bg-slate-900/50 text-brand-textPrimary dark:text-dark-textPrimary border border-brand-border/40 dark:border-dark-border/40'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-3.5 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-premium-sm bg-brand-primary text-white shadow-premium flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-brand-bg dark:bg-slate-900/50 text-brand-textSecondary border border-brand-border/40 dark:border-dark-border/40 p-4 rounded-premium text-xs flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-textSecondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-textSecondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-textSecondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>AI is auditing your hostel...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Connection Error banner */}
          {error && (
            <div className="px-6 py-3.5 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/50 flex items-center gap-2 text-xs font-semibold text-brand-danger">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-danger" />
              <span>{error}</span>
            </div>
          )}

          {/* Form input bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="p-4 bg-brand-bg/50 dark:bg-slate-900/20 border-t border-brand-border dark:border-dark-border flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about hostel energy efficiency or occupancy metrics..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-brand-border dark:border-dark-border text-xs rounded-premium-sm focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary font-semibold placeholder:font-normal placeholder:text-brand-textSecondary"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-xs rounded-premium-sm shadow-premium flex items-center gap-1.5 transition-all duration-200 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:shadow-none disabled:text-brand-textSecondary"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </form>
        </div>

        {/* Right prompts guidance column */}
        <div className="w-full lg:w-[280px] space-y-6">
          
          {/* Quick recommendations box */}
          <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium">
            <h4 className="font-extrabold text-xs text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-primary" />
              Quick Prompts
            </h4>
            <div className="space-y-3">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  disabled={sending}
                  className="w-full text-left p-3 rounded-premium-sm border border-brand-border dark:border-dark-border bg-brand-bg/40 dark:bg-slate-900/30 text-[11px] font-semibold text-brand-textSecondary hover:border-brand-primary hover:text-brand-primary transition-all duration-200 block leading-relaxed disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Model info card */}
          <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium">
            <h4 className="font-extrabold text-xs text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">
              Auditor Engine Details
            </h4>
            <div className="space-y-2 text-[10px] font-semibold text-brand-textSecondary">
              <div className="flex justify-between">
                <span>LLM Engine</span>
                <span className="text-brand-primary">Ollama Local</span>
              </div>
              <div className="flex justify-between">
                <span>Default Model</span>
                <span className="text-brand-textPrimary dark:text-dark-textPrimary font-bold">Llama 3 (8B)</span>
              </div>
              <div className="flex justify-between">
                <span>Scope Filtering</span>
                <span className="text-brand-success">Database Enabled</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AIAssistant;
