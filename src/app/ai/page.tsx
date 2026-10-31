/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, FileText, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { chatRepo, type ChatMessage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { SmoothInput } from "@/components/ui/SmoothInput";

export default function AIPage() {
  const [context, setContext] = useState("Entire Library");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = chatRepo.getHistory();
    if (history.length === 0) {
      const initialMessage: ChatMessage = {
        id: Date.now(),
        role: "assistant",
        content: "Hi! I'm your Exam OS Assistant. I can help you answer questions based on your uploaded study materials and official notifications. What would you like to know?",
        timestamp: Date.now()
      };
      chatRepo.addMessage(initialMessage);
      setMessages([initialMessage]);
    } else {
      setMessages(history);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };
    
    chatRepo.addMessage(userMsg);
    setMessages(chatRepo.getHistory());
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm currently running in development mode without a connected LLM backend. This is a simulated response. In production, I would query the selected context (" + context + ") to answer your question.",
        timestamp: Date.now(),
        isDevelopment: true
      };
      chatRepo.addMessage(aiMsg);
      setMessages(chatRepo.getHistory());
    }, 1000);
  };

  const handleClear = () => {
    chatRepo.clear();
    setMessages([]);
    // Re-seed initial
    setTimeout(() => {
      const initialMessage: ChatMessage = {
        id: Date.now(),
        role: "assistant",
        content: "Hi! I'm your Exam OS Assistant. I can help you answer questions based on your uploaded study materials and official notifications. What would you like to know?",
        timestamp: Date.now()
      };
      chatRepo.addMessage(initialMessage);
      setMessages([initialMessage]);
    }, 100);
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-8 flex flex-col bg-surface">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface">
        <div>
          <h1 className="text-xl font-semibold -tracking-[0.02em] text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Assistant
          </h1>
          <p className="text-xs text-foreground-muted mt-1">Document-grounded AI is being connected.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-foreground-muted hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground-muted">Context:</span>
            <select 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="px-3 py-1.5 bg-surface-elevated border border-border rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Entire Library</option>
              <option>IBPS Clerk 2026</option>
              <option>SBI Clerk 2026</option>
              <option>Current Note</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-surface-elevated border border-border text-foreground' : 'bg-primary/20 text-primary'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className="space-y-2">
              <div className={`${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none' : 'bg-surface-elevated border border-border rounded-2xl rounded-tl-none'} p-4 text-sm leading-relaxed text-foreground`}>
                {msg.isDevelopment && <span className="block text-xs font-bold text-warning mb-2">[DEMO MODE]</span>}
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface border-t border-border shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          <SmoothInput 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question based on ${context}...`} 
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-foreground-muted mt-2 font-medium uppercase tracking-wider">
          AI can make mistakes. Check the source documents.
        </p>
      </div>
    </div>
  );
}
