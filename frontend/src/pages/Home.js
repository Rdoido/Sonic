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
import HeroCarousel from '../components/HeroCarousel';
import CheckInWidget from '../components/CheckInWidget';
import { GAMES_CATALOG } from '../data/games';
import { FaSearch, FaVolumeUp, FaBars, FaFire, FaTrophy, FaShieldAlt, FaBolt } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: '🔥', color: '#FF6B00' },
  { id: 'pg', name: 'PG Soft', icon: 'PG', color: '#FFD700' },
  { id: 'pp', name: 'Pragmatic', icon: '▶', color: '#FF6B00' },
  { id: 'jili', name: 'JILI', icon: '🎰', color: '#3B82F6' },
  { id: 'tada', name: 'Crash', icon: '🚀', color: '#EC4899' },
  { id: 'pesca', name: 'Mini', icon: '🎯', color: '#22C55E' }
];

const Home = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [recentWinners, setRecentWinners] = useState([]);
  const [balance, setBalance] = useState(0);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

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

  const handleSlideClick = (slide) => {
    if (slide.link === 'register') {
      openAuth('register');
    } else if (slide.link?.startsWith('/')) {
      // Game / page link, require auth if user not logged in for game pages
      if (slide.link.startsWith('/game') && !user) {
        openAuth('login');
      } else {
        navigate(slide.link);
      }
    }
  };

  // Filter games based on active category
  const filteredGames = activeCategory === 'popular'
    ? GAMES_CATALOG.filter((g) => g.popular)
    : GAMES_CATALOG.filter((g) => g.category === activeCategory);

  return (
    <div className="min-h-screen sonic-bg-modern pb-24">
      {/* Decorative ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-yellow-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0a1628]/80 border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="text-white p-2 hover:bg-white/5 rounded-lg transition" data-testid="menu-button">
            <FaBars className="w-5 h-5" />
          </button>

          <SonicLogo size="md" />

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate('/perfil')}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur rounded-full text-sm font-bold text-yellow-300 border border-yellow-400/40 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/30 transition-all"
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
            <button className="text-white p-2 hover:bg-white/5 rounded-lg transition" data-testid="search-button">
              <FaSearch className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-3 pt-4">
        {/* Hero Carousel */}
        <HeroCarousel onSlideClick={handleSlideClick} />

        {/* Daily Check-in (for logged-in users only) */}
        {user && <CheckInWidget />}

        {/* Quick stats / promo strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-modern p-3 text-center"
            data-testid="quick-stat-winners"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/20 mx-auto mb-1">
              <FaTrophy className="text-yellow-400 text-sm" />
            </div>
            <div className="text-white text-base font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
              12.847
            </div>
            <div className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">Ganhadores hoje</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card-modern p-3 text-center"
            data-testid="quick-stat-rtp"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20 mx-auto mb-1">
              <FaBolt className="text-green-400 text-sm" />
            </div>
            <div className="text-white text-base font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
              98.8%
            </div>
            <div className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">RTP máximo</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-modern p-3 text-center"
            data-testid="quick-stat-secure"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 mx-auto mb-1">
              <FaShieldAlt className="text-blue-400 text-sm" />
            </div>
            <div className="text-white text-base font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
              24/7
            </div>
            <div className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">Suporte</div>
          </motion.div>
        </div>

        {/* Announcement bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 announcement-bar-modern" data-testid="announcement-bar">
          <FaVolumeUp className="text-yellow-400 flex-shrink-0 animate-pulse" />
          <div className="flex-1 overflow-hidden">
            <Marquee gradient={false} speed={40}>
              <span className="text-slate-300 text-xs mr-12">
                ✨ Bem-vindo à SonicBet! Aposte com responsabilidade e divirta-se.
              </span>
              <span className="text-slate-300 text-xs mr-12">
                🎁 Bônus de boas-vindas R$ 10 ao se cadastrar!
              </span>
              <span className="text-slate-300 text-xs mr-12">
                🏆 Saques via PIX em até 24h — Suporte 24/7.
              </span>
            </Marquee>
          </div>
          <div className="relative">
            <span className="text-xl">💬</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              18
            </span>
          </div>
        </div>

        {/* Live winners ticker */}
        {recentWinners.length > 0 && (
          <div className="mb-5 px-2 py-2 rounded-xl bg-gradient-to-r from-emerald-500/5 via-green-500/10 to-emerald-500/5 border border-green-500/20" data-testid="winners-ticker">
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
          <div className="flex gap-3 px-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center min-w-[64px] py-1.5 transition-all relative ${
                    isActive ? '' : 'opacity-60 hover:opacity-90'
                  }`}
                  data-testid={`category-${cat.id}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${cat.color}55, ${cat.color}22)`
                        : 'rgba(255,255,255,0.05)',
                      border: isActive ? `1.5px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                      color: cat.color,
                      boxShadow: isActive ? `0 8px 24px ${cat.color}33` : 'none'
                    }}
                  >
                    {cat.icon}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-semibold ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {cat.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="category-indicator"
                      className="absolute -bottom-1 w-6 h-0.5 bg-green-500 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <FaFire className="text-orange-500" />
            <span className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {CATEGORIES.find((c) => c.id === activeCategory)?.name || 'Popular'}
            </span>
            <span className="text-slate-500 text-sm">/</span>
            <span className="text-yellow-400 text-sm font-bold">{filteredGames.length}</span>
            <span className="text-slate-500 text-xs">jogos</span>
          </div>
          <button className="text-xs text-slate-400 hover:text-white transition" data-testid="see-all-games">
            Ver todos →
          </button>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6" data-testid="games-grid">
          {filteredGames.map((game, idx) => (
            <GameCard key={game.id} game={game} showCountdown={game.countdown} index={idx} />
          ))}
        </div>

        {/* About section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-modern p-5 mb-6"
          data-testid="about-section"
        >
          <h3 className="text-white font-black text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
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
