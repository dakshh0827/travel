// ============================================================
//  components/LoadingIndicator.jsx — Agent Thinking Animation
// ============================================================
'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { icon: '🔍', text: 'Parsing your vibe...' },
  { icon: '🗺️', text: 'Researching destinations...' },
  { icon: '💎', text: 'Finding hidden gems...' },
  { icon: '✍️',  text: 'Writing your itinerary...' },
];

export function LoadingIndicator() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const step = STEPS[stepIndex];

  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-tl-sm border border-purple-100 px-5 py-4 shadow-sm max-w-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-bounce">{step.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-700">{step.text}</p>
            <div className="flex gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= stepIndex ? 'bg-purple-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
