import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { GAMES_CATALOG } from '../data/games';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaPlay, FaPlus, FaMinus } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BET_OPTIONS = [1, 2, 5, 10, 25, 50, 100];

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [reelSymbols, setReelSymbols] = useState(['?', '?', '?']);

  const game = GAMES_CATALOG.find((g) => g.id === gameId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    if (!game) {
      navigate('/');
      return;
    }
    fetchBalance();
  }, [user, gameId, authLoading]);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/wallet/balance`);
      setBalance(res.data.balance);
    } catch (e) {}
  };

  const spin = async () => {
    if (betAmount > balance) {
      toast.error('Saldo insuficiente. Faça um depósito!');
      return;
    }

    setPlaying(true);
    setShowResult(false);
    setResult(null);

    // Animate reels with random symbols during spin
    const spinSymbols = ['🎰', '💎', '⭐', '7️⃣', '🍀', '👑', '💰', '🎲'];
    const spinInterval = setInterval(() => {
      setReelSymbols([
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)],
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)],
        spinSymbols[Math.floor(Math.random() * spinSymbols.length)]
      ]);
    }, 80);

    try {
      const res = await axios.post(`${API}/games/${gameId}/play`, { bet_amount: betAmount });
      // Wait minimum 1.5s for animation
      setTimeout(() => {
        clearInterval(spinInterval);
        setReelSymbols(res.data.symbols);
        setResult(res.data);
        setBalance(res.data.new_balance);
        setShowResult(true);
        setPlaying(false);

        if (res.data.result === 'win') {
          if (res.data.multiplier >= 10) {
            toast.success(`🎉 JACKPOT! Você ganhou R$ ${res.data.win_amount.toFixed(2)}!`, { duration: 4000 });
          } else {
            toast.success(`🎊 Você ganhou R$ ${res.data.win_amount.toFixed(2)}!`);
          }
        }
      }, 1500);
    } catch (error) {
      clearInterval(spinInterval);
      setPlaying(false);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao jogar');
    }
  };

  if (!game) return null;

  const adjustBet = (delta) => {
    const idx = BET_OPTIONS.indexOf(betAmount);
    const newIdx = Math.max(0, Math.min(BET_OPTIONS.length - 1, idx + delta));
    setBetAmount(BET_OPTIONS[newIdx]);
  };

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <div className="text-center">
            <div className="text-white font-black text-base" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="game-title">
              {game.name}
            </div>
            <div className="text-yellow-400 text-[10px] uppercase tracking-wider">
              {game.provider} • RTP {game.rtp}%
            </div>
          </div>
          <div className="px-3 py-1 bg-[#1e3a5f] rounded-full text-xs font-bold text-yellow-400" data-testid="game-balance">
            R$ {balance.toFixed(2)}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Game Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative h-48 rounded-2xl overflow-hidden mb-4 bg-gradient-to-br ${game.bg}`}
          data-testid="game-banner"
        >
          {game.image ? (
            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">
              {game.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
            <div>
              <div className="text-white text-2xl font-black drop-shadow-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {game.name}
              </div>
              <div className="text-yellow-300 text-xs font-bold">Multiplicador até 50x!</div>
            </div>
            <div className="bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded">
              {game.provider}
            </div>
          </div>
        </motion.div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-br from-[#1a2c4e] to-[#0d1f3a] border-2 border-yellow-500/30 rounded-2xl p-6 mb-4 relative overflow-hidden" data-testid="slot-machine">
          <div className="absolute top-0 left-0 right-0 h-1 gold-gradient"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 gold-gradient"></div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {reelSymbols.map((symbol, idx) => (
              <motion.div
                key={`${idx}-${symbol}-${result?.game_id}`}
                initial={playing ? { y: -50, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: showResult ? idx * 0.15 : 0, duration: 0.3 }}
                className={`aspect-square bg-[#0a1628] rounded-2xl flex items-center justify-center text-6xl border-2 ${
                  showResult && result?.result === 'win'
                    ? 'border-yellow-500 pulse-glow'
                    : 'border-[#1e3a5f]'
                }`}
                data-testid={`reel-${idx}`}
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
                data-testid="game-result-message"
              >
                {result.result === 'win' ? (
                  <div>
                    <div className="text-green-400 text-3xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {result.multiplier >= 10 ? 'JACKPOT! 🎰' : 'GANHOU! 🎉'}
                    </div>
                    <div className="text-yellow-400 text-2xl font-bold mt-1">
                      + R$ {result.win_amount.toFixed(2)}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      Multiplicador: {result.multiplier.toFixed(1)}x
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-slate-400 text-xl font-bold">Tente novamente!</div>
                    <div className="text-red-400 text-sm">- R$ {result.bet_amount.toFixed(2)}</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bet Controls */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-4">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 text-center">
            Valor da Aposta
          </div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => adjustBet(-1)}
              disabled={playing}
              className="w-12 h-12 rounded-full bg-[#1e3a5f] hover:bg-[#274a7c] flex items-center justify-center text-white disabled:opacity-30"
              data-testid="bet-decrease"
            >
              <FaMinus />
            </button>
            <div className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-xl py-3 text-center">
              <div className="text-slate-400 text-xs">Aposta</div>
              <div className="text-yellow-400 text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="current-bet">
                R$ {betAmount.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => adjustBet(1)}
              disabled={playing}
              className="w-12 h-12 rounded-full bg-[#1e3a5f] hover:bg-[#274a7c] flex items-center justify-center text-white disabled:opacity-30"
              data-testid="bet-increase"
            >
              <FaPlus />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 50].map((v) => (
              <button
                key={v}
                onClick={() => setBetAmount(v)}
                disabled={playing}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  betAmount === v
                    ? 'btn-primary'
                    : 'bg-[#0a1628] border border-[#1e3a5f] text-white hover:border-yellow-500'
                }`}
                data-testid={`quick-bet-${v}`}
              >
                R$ {v}
              </button>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={playing || betAmount > balance}
          className="w-full btn-primary py-5 rounded-2xl font-black text-xl disabled:opacity-50 flex items-center justify-center gap-3 pulse-glow"
          data-testid="spin-button"
        >
          {playing ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>GIRANDO...</span>
            </>
          ) : (
            <>
              <FaPlay />
              <span>JOGAR (R$ {betAmount})</span>
            </>
          )}
        </button>

        {balance < betAmount && (
          <button
            onClick={() => navigate('/deposito')}
            className="w-full mt-3 btn-green py-3 rounded-xl font-bold text-sm"
            data-testid="deposit-redirect-btn"
          >
            💰 Depositar para continuar jogando
          </button>
        )}

        {/* Game Info */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mt-4 mb-4" data-testid="game-info">
          <h3 className="text-white font-bold text-sm mb-2">Como Jogar</h3>
          <ul className="space-y-1 text-slate-400 text-xs">
            <li>• Escolha o valor da sua aposta</li>
            <li>• Pressione JOGAR para girar os símbolos</li>
            <li>• Ganhe multiplicadores de até 50x sua aposta!</li>
            <li>• RTP oficial: {game.rtp}%</li>
          </ul>
        </div>
      </div>


      {/* Fortune Rabbit Demo Integration */}
      {gameId === 'fortune-rabbit' && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-black rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500">
              <div className="text-black font-black text-sm uppercase tracking-wider">
                Fortune Rabbit Demo
              </div>
              <a
                href="https://demofortunerabbit.com/#demo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition"
              >
                Abrir em Tela Cheia
              </a>
            </div>

            <div className="relative w-full" style={{ height: '80vh', minHeight: '650px' }}>
              <iframe
                src="https://demofortunerabbit.com/#demo"
                title="Fortune Rabbit Demo"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}


      <BottomNav />
    </div>
  );
};

export default GamePage;
