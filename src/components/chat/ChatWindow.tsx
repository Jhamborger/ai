'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/store/use-workspace-store';
import { send } from 'ai'; // Using Vercel AI SDK helper if applicable, or custom fetch
import { cn } from '@/lib/utils';
import { Send, Trash2, PlusCircle } from 'lucide-react';

export function ChatWindow() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: input,
          conversationId: 'default-conv', // Should be from store
          userId: 'default-user',        // Should be from auth
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: assistantContent }];
          }
          return [...prev, { role: 'assistant', content: assistantContent }];
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto border-x bg-zinc-950 text-zinc-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
            <div className={cn(
              'max-w-[80%] p-3 rounded-2xl',
              m.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800'
            )}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="relative flex items-center">
          <input
            className="w-full p-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
            placeholder="Ask AETDRIXZ AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 p-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
