import { motion } from 'framer-motion';

/**
 * Renders a rich, original-looking SVG thumbnail for each game
 * based on game.id. Acts as a fallback when no image is provided.
 */
const GameThumbnail = ({ game }) => {
  const id = game.id;

  // Common decorative starburst (used by many slots)
  const Starburst = ({ color = '#fff' }) => (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + Math.cos((i * Math.PI) / 6) * 80}
          y2={50 + Math.sin((i * Math.PI) / 6) * 80}
          stroke={color}
          strokeWidth="0.3"
        />
      ))}
    </svg>
  );

  const ScatterDots = ({ count = 12, color = '#fff' }) => (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
      {[...Array(count)].map((_, i) => (
        <circle
          key={i}
          cx={Math.random() * 100}
          cy={Math.random() * 100}
          r={Math.random() * 1.5 + 0.4}
          fill={color}
        />
      ))}
    </svg>
  );

  const designs = {
    'fortune-tiger': {
      bg: 'from-red-700 via-orange-600 to-amber-500',
      glow: '#FFD700',
      content: (
        <>
          <Starburst color="#FFD700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(255,200,0,0.8)]">🐯</div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-300 text-3xl opacity-60 -z-0">
            福
          </div>
        </>
      )
    },
    'fortune-rabbit': {
      bg: 'from-pink-500 via-rose-400 to-amber-300',
      glow: '#FFE5B4',
      content: (
        <>
          <Starburst color="#fff" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(255,255,255,0.6)]">🐰</div>
          </div>
          <div className="absolute bottom-8 left-2 text-yellow-200 text-2xl opacity-70">🥕</div>
          <div className="absolute top-3 right-2 text-yellow-300 text-xl opacity-80">✨</div>
        </>
      )
    },
    'fortune-snake': {
      bg: 'from-emerald-700 via-green-500 to-lime-400',
      glow: '#86EFAC',
      content: (
        <>
          <ScatterDots count={20} color="#86EFAC" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(132,250,176,0.8)]">🐍</div>
          </div>
          <div className="absolute top-2 right-2 text-emerald-200 text-xl opacity-80">💎</div>
        </>
      )
    },
    'fortune-ox': {
      bg: 'from-yellow-600 via-red-600 to-rose-800',
      glow: '#FFD700',
      content: (
        <>
          <Starburst color="#FFD700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(255,200,0,0.8)]">🐂</div>
          </div>
          <div className="absolute bottom-8 left-2 text-yellow-300 text-xl opacity-70">🪙</div>
        </>
      )
    },
    'fortune-mouse': {
      bg: 'from-orange-400 via-amber-400 to-yellow-300',
      glow: '#FEF08A',
      content: (
        <>
          <ScatterDots count={15} color="#fff" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(255,255,200,0.8)]">🐭</div>
          </div>
          <div className="absolute top-3 left-2 text-yellow-100 text-xl opacity-80">🧀</div>
        </>
      )
    },
    'mina-misteriosa': {
      bg: 'from-amber-700 via-yellow-600 to-orange-700',
      glow: '#FFD700',
      content: (
        <>
          <Starburst color="#FFD700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(255,200,0,0.8)]">💎</div>
          </div>
          <div className="absolute bottom-8 right-2 text-amber-300 text-xl opacity-80">⛏️</div>
        </>
      )
    },
    'gates-olympus': {
      bg: 'from-indigo-700 via-blue-600 to-cyan-400',
      glow: '#67E8F9',
      content: (
        <>
          <ScatterDots count={20} color="#fff" />
          {/* Lightning bolts */}
          <svg className="absolute top-3 left-3 w-8 h-8 text-yellow-300 drop-shadow-[0_0_8px_#FDE047]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
          </svg>
          <svg className="absolute bottom-8 right-2 w-6 h-6 text-yellow-200 opacity-70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl drop-shadow-[0_4px_20px_rgba(253,224,71,0.9)]">⚡</div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-200 text-2xl opacity-40">Ω</div>
        </>
      )
    },
    'sweet-bonanza': {
      bg: 'from-pink-400 via-fuchsia-400 to-purple-500',
      glow: '#F0ABFC',
      content: (
        <>
          <ScatterDots count={15} color="#fff" />
          <div className="absolute top-3 left-2 text-3xl">🍬</div>
          <div className="absolute top-2 right-3 text-2xl">🍭</div>
          <div className="absolute bottom-8 left-3 text-2xl">🍓</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl drop-shadow-[0_4px_20px_rgba(240,171,252,0.9)]">🍩</div>
          </div>
        </>
      )
    },
    'aviator': {
      bg: 'from-red-700 via-rose-600 to-slate-900',
      glow: '#F87171',
      content: (
        <>
          <ScatterDots count={25} color="#fff" />
          {/* Trajectory line */}
          <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 0 90 Q 50 90 90 10" stroke="#FCD34D" strokeWidth="0.6" fill="none" strokeDasharray="2,2" />
          </svg>
          <div className="absolute top-4 right-4 text-5xl rotate-[-30deg] drop-shadow-[0_4px_20px_rgba(248,113,113,0.9)]">
            ✈️
          </div>
          <div className="absolute bottom-7 left-3 text-yellow-300 text-xl font-black">×100</div>
        </>
      )
    },
    'dragon-hatch': {
      bg: 'from-purple-800 via-violet-700 to-fuchsia-600',
      glow: '#C084FC',
      content: (
        <>
          <Starburst color="#C084FC" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(192,132,252,0.9)]">🐉</div>
          </div>
          <div className="absolute top-3 right-2 text-violet-200 text-xl opacity-80">🥚</div>
        </>
      )
    },
    'wild-bandito': {
      bg: 'from-orange-600 via-red-700 to-amber-800',
      glow: '#FB923C',
      content: (
        <>
          <ScatterDots count={20} color="#fff" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(251,146,60,0.9)]">🤠</div>
          </div>
          <div className="absolute bottom-8 right-3 text-orange-200 text-xl opacity-80">🌵</div>
        </>
      )
    },
    'sugar-rush': {
      bg: 'from-cyan-300 via-pink-300 to-fuchsia-400',
      glow: '#F9A8D4',
      content: (
        <>
          <ScatterDots count={18} color="#fff" />
          <div className="absolute top-3 left-2 text-2xl">🍬</div>
          <div className="absolute bottom-8 left-3 text-2xl">🍭</div>
          <div className="absolute top-3 right-3 text-2xl">🧁</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl drop-shadow-[0_4px_20px_rgba(249,168,212,0.9)]">🍰</div>
          </div>
        </>
      )
    },
    'lucky-neko': {
      bg: 'from-rose-500 via-red-500 to-yellow-500',
      glow: '#FBBF24',
      content: (
        <>
          <Starburst color="#FBBF24" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl drop-shadow-[0_4px_20px_rgba(251,191,36,0.9)]">🐱</div>
          </div>
          <div className="absolute top-3 right-2 text-yellow-200 text-xl opacity-80">🪙</div>
        </>
      )
    },
    'aztec-gold': {
      bg: 'from-amber-800 via-yellow-600 to-emerald-700',
      glow: '#FBBF24',
      content: (
        <>
          <Starburst color="#FBBF24" />
          {/* Pyramid silhouette */}
          <svg className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-12 opacity-50" viewBox="0 0 100 50" fill="#451A03">
            <polygon points="50,5 95,45 5,45" />
          </svg>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-5xl drop-shadow-[0_4px_20px_rgba(251,191,36,0.9)]">
            👑
          </div>
          <div className="absolute bottom-8 right-2 text-amber-300 text-lg opacity-80">💰</div>
        </>
      )
    },
    'mahjong-ways': {
      bg: 'from-red-800 via-rose-700 to-amber-600',
      glow: '#FBBF24',
      content: (
        <>
          <Starburst color="#FBBF24" />
          {/* Mahjong tile silhouettes */}
          <div className="absolute top-3 left-3 w-6 h-8 bg-amber-200/80 rounded-sm flex items-center justify-center text-[10px] font-black text-red-700 rotate-[-8deg]">
            東
          </div>
          <div className="absolute top-3 right-3 w-6 h-8 bg-amber-200/80 rounded-sm flex items-center justify-center text-[10px] font-black text-red-700 rotate-[8deg]">
            南
          </div>
          <div className="absolute bottom-9 left-3 w-6 h-8 bg-amber-200/80 rounded-sm flex items-center justify-center text-[10px] font-black text-red-700 rotate-[6deg]">
            西
          </div>
          <div className="absolute bottom-9 right-3 w-6 h-8 bg-amber-200/80 rounded-sm flex items-center justify-center text-[10px] font-black text-red-700 rotate-[-6deg]">
            北
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl drop-shadow-[0_4px_20px_rgba(251,191,36,0.9)]">🀄</div>
          </div>
        </>
      )
    },
    'crazy-time': {
      bg: 'from-fuchsia-600 via-purple-600 to-blue-700',
      glow: '#F0ABFC',
      content: (
        <>
          <ScatterDots count={20} color="#fff" />
          {/* Wheel segments */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full relative"
              style={{
                background: 'conic-gradient(#EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6, #EC4899, #EF4444)',
                boxShadow: '0 0 30px rgba(240, 171, 252, 0.6)'
              }}
            >
              <div className="absolute inset-2 rounded-full bg-purple-900 flex items-center justify-center text-white text-xl font-black">
                ★
              </div>
            </motion.div>
          </div>
        </>
      )
    },
    'plinko': {
      bg: 'from-cyan-500 via-teal-500 to-emerald-500',
      glow: '#67E8F9',
      content: (
        <>
          {/* Plinko pegs */}
          <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
            {[...Array(5)].map((_, row) =>
              [...Array(row + 3)].map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={50 - (row + 2) * 5 + col * 10}
                  cy={20 + row * 12}
                  r="1.5"
                  fill="#fff"
                />
              ))
            )}
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-10">
            <div className="text-3xl drop-shadow-[0_4px_10px_rgba(103,232,249,0.9)]">🟡</div>
          </div>
          <div className="absolute top-2 right-2 text-cyan-100 text-xl font-black opacity-80">×</div>
        </>
      )
    },
  };

  const design = designs[id] || {
    bg: game.bg || 'from-slate-700 to-slate-900',
    content: (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl">{game.emoji || '🎰'}</div>
      </div>
    )
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${design.bg} overflow-hidden`}>
      {design.content}
    </div>
  );
};

export default GameThumbnail;
