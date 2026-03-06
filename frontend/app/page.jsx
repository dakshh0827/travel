// ============================================================
//  app/page.jsx — Main Chat Page
// ============================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { LoadingIndicator } from '../components/LoadingIndicator';

const EXAMPLE_PROMPTS = [
  "I want to go somewhere in Himachal at high altitude with a group of 6 friends for 4 days. We want snow, stargazing, wooden homestays, travel within 7-8 hours from Delhi and budget of 5000 per head.",
  "Solo trip for 5 days in Rajasthan, want desert vibes, old forts, local food. Budget ₹3000/day, starting from Jaipur.",
  "Me and my partner want a quiet hill station for 3 days. No crowds, good cafes, under ₹4000 per head. From Bangalore.",
  "Group of 4, first trip to Northeast India, 7 days, want waterfalls and living root bridges, budget 8000 per head from Delhi.",
];

export default function HomePage() {
  const [messages, setMessages]     = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [sessionId, setSessionId]   = useState('');
  const bottomRef                   = useRef(null);

  useEffect(() => {
    // Create or restore session ID
    const stored = localStorage.getItem('travel_session_id') || uuidv4();
    setSessionId(stored);
    localStorage.setItem('travel_session_id', stored);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { id: uuidv4(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Something went wrong');
      }

      const data = await res.json();

      setMessages(prev => [...prev, {
        id:           uuidv4(),
        role:         'assistant',
        content:      data.itinerary,
        intent:       data.intent,
        destinations: data.destinations,
        meta:         data.meta,
      }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        id:      uuidv4(),
        role:    'assistant',
        content: `Oof, hit a snag 😅 — ${err.message}. Try again?`,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (prompt) => sendMessage(prompt);

  const clearChat = () => {
    setMessages([]);
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('travel_session_id', newSessionId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Travel Companion</h1>
            <p className="text-xs text-purple-600 font-medium">AI-powered • Gen-Z friendly • No boring itineraries</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
          >
            New Trip
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 ? (
          <WelcomeScreen
            examples={EXAMPLE_PROMPTS}
            onExampleClick={handleExampleClick}
          />
        ) : (
          <div className="space-y-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 max-w-3xl mx-auto w-full">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder="Tell me your vibe, budget, and where you want to go... 🗺️"
        />
        <p className="text-xs text-gray-400 text-center mt-2">
          Be specific: mention group size, budget, duration, and your vibe for the best itinerary
        </p>
      </div>
    </div>
  );
}
