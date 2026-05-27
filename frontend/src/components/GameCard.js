import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

const GameCard = ({ game, size = 'md', showCountdown = false }) => {
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

  return (
    <>
      <Link
        to={user ? `/game/${game.id}` : '#'}
        onClick={handleClick}
        className="block"
        data-testid={`game-card-${game.id}`}
      >
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`game-card ${sizes[size]} relative bg-gradient-to-br ${game.bg} cursor-pointer`}
        >
          {/* Provider tag */}
          <div className="absolute top-2 left-2 z-20 bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">
            {game.provider}
          </div>

          {/* Hot badge */}
          {game.hot && (
            <div className="absolute top-2 right-2 z-20">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px]">
                🔥
              </div>
            </div>
          )}

          {/* Game image or emoji */}
          {game.image ? (
            <img
              src={game.image}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                {game.emoji}
              </div>
            </div>
          )}

          {/* Countdown overlay */}
          {showCountdown && game.countdown && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-600/30 z-10">
              <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-center">
                <div className="text-[10px] uppercase tracking-wider">Mina Misteriosa</div>
                <div className="text-xl font-black font-mono">
                  00:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Game name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-2 z-10">
            <div
              className="text-white font-black text-sm text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {game.name}
            </div>
          </div>
        </motion.div>
      </Link>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode="login" onModeChange={() => {}} />
    </>
  );
};

export default GameCard;
