import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import GameThumbnail from './GameThumbnail';

const PROVIDER_COLORS = {
  PG: 'bg-yellow-400 text-yellow-950',
  PP: 'bg-orange-500 text-white',
  JILI: 'bg-blue-500 text-white',
  SPRIBE: 'bg-red-500 text-white',
  EVO: 'bg-fuchsia-500 text-white',
  TADA: 'bg-amber-500 text-amber-950'
};

const GameCard = ({ game, size = 'md', showCountdown = false, index = 0 }) => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 24, seconds: 13 });

  useEffect(() => {
    if (!showCountdown) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 24, seconds: 13 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showCountdown]);

  const sizes = {
    sm: 'aspect-square',
    md: 'aspect-square',
    lg: 'aspect-[4/5]'
  };

  const handleClick = (e) => {
    if (!user) {
      e.preventDefault();
      setAuthOpen(true);
    }
  };

  const providerStyle = PROVIDER_COLORS[game.provider] || 'bg-slate-500 text-white';

  return (
    <>
      <Link
        to={user ? `/game/${game.id}` : '#'}
        onClick={handleClick}
        className="block"
        data-testid={`game-card-${game.id}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, type: 'spring', stiffness: 100 }}
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.97 }}
          className={`game-card-modern ${sizes[size]} relative cursor-pointer`}
        >
          {/* Original AI-style thumbnail */}
          <GameThumbnail game={game} />

          {/* Provider tag */}
          <div className={`absolute top-1.5 left-1.5 z-20 ${providerStyle} text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md`}>
            {game.provider}
          </div>

          {/* Hot badge */}
          {game.hot && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-1.5 right-1.5 z-20"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-[10px] shadow-lg shadow-red-500/50">
                🔥
              </div>
            </motion.div>
          )}

          {/* Countdown overlay */}
          {showCountdown && game.countdown && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-600/40 z-10 backdrop-blur-[2px]">
              <div className="bg-gradient-to-br from-red-600 to-red-700 text-white px-3 py-2 rounded-lg text-center shadow-xl">
                <div className="text-[9px] uppercase tracking-wider font-bold">Mina Misteriosa</div>
                <div className="text-lg font-black font-mono">
                  00:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Bottom gradient for text legibility */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

          {/* Game name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 z-20">
            <div
              className="text-white font-black text-[11px] sm:text-xs text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {game.name}
            </div>
          </div>

          {/* Shine sweep on hover */}
          <div className="game-shine pointer-events-none" />
        </motion.div>
      </Link>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode="login" onModeChange={() => {}} />
    </>
  );
};

export default GameCard;
