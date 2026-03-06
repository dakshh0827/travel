// ============================================================
//  components/MessageBubble.jsx — Chat Message Renderer
// ============================================================
'use client';

import ReactMarkdown from 'react-markdown';

export function MessageBubble({ message }) {
  const isUser      = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] w-full">
          {/* Agent avatar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs">
              ✈️
            </div>
            <span className="text-xs font-medium text-gray-500">Travel Companion</span>
            {message.intent?.destination && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {message.intent.destination}
              </span>
            )}
          </div>

          {/* Itinerary card */}
          <div className={`bg-white rounded-2xl rounded-tl-sm shadow-sm border ${message.isError ? 'border-red-200' : 'border-purple-100'} overflow-hidden`}>
            {/* Card header with trip stats */}
            {message.intent && !message.isError && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-purple-100 flex flex-wrap gap-3 text-xs text-gray-600">
                {message.intent.duration && (
                  <span className="flex items-center gap-1">
                    <span>📅</span> {message.intent.duration} days
                  </span>
                )}
                {message.intent.groupSize && (
                  <span className="flex items-center gap-1">
                    <span>👥</span> {message.intent.groupSize} people
                  </span>
                )}
                {message.intent.budget && (
                  <span className="flex items-center gap-1">
                    <span>💰</span> ₹{message.intent.budget.toLocaleString()}/head
                  </span>
                )}
                {message.meta?.hiddenGems > 0 && (
                  <span className="flex items-center gap-1">
                    <span>💎</span> {message.meta.hiddenGems} hidden gems
                  </span>
                )}
              </div>
            )}

            {/* Itinerary content */}
            <div className="px-5 py-4 itinerary-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Copy button */}
            {!message.isError && (
              <div className="px-4 pb-3 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    alert('Itinerary copied! ✅');
                  }}
                  className="text-xs text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-purple-50"
                >
                  📋 Copy itinerary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
