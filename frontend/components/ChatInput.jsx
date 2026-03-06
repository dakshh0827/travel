// ============================================================
//  components/ChatInput.jsx — Message Input Bar
// ============================================================
'use client';

import { useState, useRef, useEffect } from 'react';

export function ChatInput({ onSend, isLoading, placeholder }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    // Send on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm
                     focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent
                     disabled:bg-gray-50 disabled:text-gray-400
                     placeholder-gray-400 text-gray-800 bg-white shadow-sm
                     transition-all duration-200"
        />
        <span className="absolute right-3 bottom-3 text-gray-300 text-xs">
          {value.length > 0 ? `${value.length}` : ''}
        </span>
      </div>

      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center
                   hover:bg-purple-700 disabled:bg-gray-200 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm flex-shrink-0"
        aria-label="Send message"
      >
        {isLoading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <span className="text-base">→</span>
        )}
      </button>
    </div>
  );
}
