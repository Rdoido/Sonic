import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Marquee from 'react-fast-marquee';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SonicLogo from '../components/SonicLogo';
import GameCard from '../components/GameCard';
import BottomNav from '../components/BottomNav';
import AuthModal from '../components/AuthModal';
import { GAMES_CATALOG } from '../data/games';
import { FaSearch, FaVolumeUp, FaBars, FaFire } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: '🔥', color: '#FF6B00' },
  { id: 'pg', name: 'PG', icon: 'PG', color: '#FFD700' },
  { id: 'tada', name: 'Tada', icon: '👋', color: '#FFA500' },
  { id: 'pp', name: 'PP', icon: '▶', color: '#FF6B00' },
  { id: 'jili', name: 'JILI', icon: '🎰', color: '#3B82F6' },
  { id: 'pesca', name: 'Pesca', icon: '🎣', color: '#22C55E' }
];

const Home = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [recentWinners, setRecentWinners] = useState([]);
  const [balance, setBalance] = useState(0);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    fetchRecentWinners();
    if (user) fetchBalance();
  }, [user]);

  const fetchRecentWinners = async () => {
    try {
      const res = await axios.get(`${API}/games/recent-winners`);
      setRecentWinners(res.data);
    } catch (e) {
      // silent
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/wallet/balance`);
      setBalance(res.data.balance);
    } catch (e) {
      // silent
    }
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen sonic-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="text-white p-2" data-testid="menu-button">
            <FaBars className="w-5 h-5" />
          </button>

          <SonicLogo size="md" />

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate('/perfil')}
                className="px-3 py-1.5 bg-[#1e3a5f] rounded-full text-sm font-bold text-[#FFD700] border border-[#FFD700]/30"
                data-testid="header-balance"
              >
                R$ {balance.toFixed(2)}
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="px-4 py-1.5 rounded-full text-sm font-bold btn-blue"
                  data-testid="header-login-btn"
                >
                  ENTRAR
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-1.5 rounded-full text-sm font-bold btn-green"
                  data-testid="header-register-btn"
                >
                  REGISTRO
                </button>
              </>
            )}
            <button className="text-white p-2" data-testid="search-button">
              <FaSearch className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-3 pt-4">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="promo-banner relative h-32 mb-3"
          data-testid="hero-banner"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800"></div>
            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7594197/pexels-photo-7594197.jpeg')] bg-cover bg-center opacity-30"></div>
            <div className="relative h-full flex items-center justify-between px-5">
              <div>
                <div className="text-yellow-300 text-xs font-bold mb-1 tracking-wider">SONICBET.COM</div>
                <div className="text-white text-3xl font-black leading-none mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  CASHBACK
                </div>
                <div className="text-white text-2xl font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  EM PERDAS
                </div>
                <div className="text-yellow-200 text-sm font-bold mt-1">EM APOSTAS</div>
              </div>
              <div className="text-right space-y-2">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-700 text-xs font-black px-3 py-1.5 rounded-full">
                  DIÁRIO 30%
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-700 text-xs font-black px-3 py-1.5 rounded-full">
                  SEMANAL 30%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promo cards row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="promo-banner h-24 relative cursor-pointer"
            onClick={() => navigate('/promocoes')}
            data-testid="promo-invite"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-700 overflow-hidden">
              <div className="absolute right-0 top-0 text-4xl">👏</div>
              <div className="relative p-3">
                <div className="text-white text-[10px] font-bold leading-tight">CONVIDE 1 PESSOA</div>
                <div className="text-yellow-300 text-base font-black leading-tight mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  E GANHE R$ 50
                </div>
                <div className="text-yellow-200 text-xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  R$ 320
                </div>
                <div className="text-yellow-300 text-[9px] font-bold uppercase">Bônus de check-in</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="promo-banner h-24 relative cursor-pointer"
            data-testid="promo-rtp"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-700 overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center text-4xl">🐰</div>
              <div className="relative p-3">
                <div className="text-white text-xs font-bold tracking-wider">SONIC<span className="text-yellow-300">BET</span></div>
                <div className="text-white text-[10px] font-bold mt-1">RTP</div>
                <div className="text-yellow-300 text-2xl font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  98.8%
                </div>
                <div className="text-yellow-300 text-[10px] font-bold uppercase">+ Top Retorno</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Announcement bar */}
        {showAnnouncement && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1e3a5f]/50 rounded-xl mb-4 border border-white/5" data-testid="announcement-bar">
            <FaVolumeUp className="text-yellow-400 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <Marquee gradient={false} speed={40}>
                <span className="text-slate-300 text-xs mr-12">
                  ✨ Bem-vindo à SonicBet! Em caso de dúvidas, consulte o atendimento ao cliente disponível 24h. Aposte com responsabilidade.
                </span>
                <span className="text-slate-300 text-xs mr-12">
                  🎁 Promoção especial: Ganhe R$ 50 ao convidar um amigo!
                </span>
              </Marquee>
            </div>
            <div className="relative">
              <span className="text-2xl">💬</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                18
              </span>
            </div>
          </div>
        )}

        {/* Live winners ticker */}
        {recentWinners.length > 0 && (
          <div className="mb-4 px-2" data-testid="winners-ticker">
            <Marquee gradient={false} speed={50}>
              {recentWinners.map((w, i) => (
                <div key={i} className="flex items-center gap-2 mx-4 text-xs">
                  <span className="text-yellow-400">🏆</span>
                  <span className="text-slate-300">{w.player}</span>
                  <span className="text-slate-500">ganhou</span>
                  <span className="text-green-400 font-bold">R$ {w.amount.toFixed(2)}</span>
                  <span className="text-slate-500">em</span>
                  <span className="text-yellow-400 font-medium">{w.game}</span>
                </div>
              ))}
            </Marquee>
          </div>
        )}

        {/* Category tabs */}
        <div className="overflow-x-auto no-scrollbar mb-4">
          <div className="flex gap-4 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center min-w-[60px] py-2 transition-all relative ${
                  activeCategory === cat.id ? '' : 'opacity-60'
                }`}
                data-testid={`category-${cat.id}`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"
                  style={{
                    background: activeCategory === cat.id
                      ? `linear-gradient(135deg, ${cat.color}40, ${cat.color}20)`
                      : 'rgba(255,255,255,0.05)',
                    border: activeCategory === cat.id ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.1)',
                    color: cat.color
                  }}
                >
                  {cat.icon}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    activeCategory === cat.id ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {cat.name}
                </span>
                {activeCategory === cat.id && (
                  <div className="absolute -bottom-1 w-6 h-0.5 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <FaFire className="text-orange-500" />
            <span className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Popular
            </span>
            <span className="text-slate-500 text-sm">/</span>
            <span className="text-yellow-400 text-sm font-bold">100</span>
            <span className="text-slate-500 text-xs">Todos</span>
          </div>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6" data-testid="games-grid">
          {GAMES_CATALOG.map((game) => (
            <GameCard key={game.id} game={game} showCountdown={game.countdown} />
          ))}
        </div>

        {/* About section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#0d1f3a] border border-white/5 rounded-2xl p-5 mb-6"
          data-testid="about-section"
        >
          <h3 className="text-white font-black text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Sobre a SonicBet
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Plataforma de jogos legalizada com licença de operação. Oferecemos os melhores jogos
            PG Soft, Pragmatic Play e outros provedores premiados, com RTP até 98.8%.
            Saques rápidos via PIX e atendimento 24/7.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs font-bold">
              ✓ Plataforma Licenciada
            </div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-bold">
              ✓ PIX Instantâneo
            </div>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold">
              ✓ Suporte 24h
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-xs pb-4">
          <p>© 2026 SonicBet. Todos os direitos reservados.</p>
          <p className="mt-1">Jogue com responsabilidade. Proibido para menores de 18 anos.</p>
        </div>
      </div>

      <BottomNav />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
};

export default Home;
