// ============================================================
//  components/WelcomeScreen.jsx — Initial Empty State UI
// ============================================================
'use client';

export function WelcomeScreen({ examples, onExampleClick }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Hero */}
      <div className="text-6xl mb-4">✈️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Your AI Travel Buddy
      </h2>
      <p className="text-gray-500 text-base max-w-md mb-8">
        Tell me your vibe, budget, and where you want to explore.
        I'll plan a trip that actually slaps — not some boring packaged tour.
      </p>

      {/* Example prompts */}
      <div className="w-full max-w-2xl">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Try one of these
        </p>
        <div className="grid gap-3">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => onExampleClick(example)}
              className="text-left text-sm text-gray-600 bg-white border border-gray-200
                         rounded-xl px-4 py-3 hover:border-purple-300 hover:bg-purple-50
                         hover:text-purple-700 transition-all duration-200 shadow-sm
                         group"
            >
              <span className="mr-2 group-hover:animate-bounce inline-block">🗺️</span>
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-8">
        {['Hidden gems', 'Budget-friendly', 'Group trips', 'Solo travel', 'Mountain vibes', 'Desert escapes'].map(tag => (
          <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
