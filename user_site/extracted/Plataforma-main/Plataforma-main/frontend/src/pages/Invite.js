import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaCopy, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Invite = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    axios.get(`${API}/referral/info`).then((r) => setInfo(r.data)).catch(() => {});
  }, [user, loading]);

  const inviteLink = `${window.location.origin}?ref=${user?.invite_code}`;

  const copy = (text, msg = 'Copiado!') => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const shareWhatsapp = () => {
    const text = `🎰 Junte-se a mim na SonicBet! Use meu código ${user.invite_code} e ganhe bônus de boas-vindas! ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTelegram = () => {
    const text = `🎰 Junte-se a mim na SonicBet! Use meu código ${user.invite_code} e ganhe bônus de boas-vindas!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!user || !info) {
    return (
      <div className="min-h-screen sonic-bg flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full dot-1"></span>
          <span className="w-2 h-2 bg-yellow-500 rounded-full dot-2"></span>
          <span className="w-2 h-2 bg-yellow-500 rounded-full dot-3"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="invite-title">
            Convidar Amigos
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl p-6 text-center mb-4 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-5xl">🎁</div>
          <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Programa de Indicação</div>
          <div className="text-white text-4xl font-black mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            R$ 50,00
          </div>
          <div className="text-white/90 text-sm mt-1">por cada amigo cadastrado</div>
          <div className="mt-2 inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
            + 5% de comissão vitalícia
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4" data-testid="stat-invited">
            <div className="text-slate-400 text-xs uppercase">Convidados</div>
            <div className="text-white text-3xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {info.invited_count}
            </div>
          </div>
          <div className="bg-[#0d1f3a] border border-yellow-500/30 rounded-2xl p-4" data-testid="stat-earned">
            <div className="text-slate-400 text-xs uppercase">Ganhos</div>
            <div className="text-yellow-400 text-3xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              R$ {info.total_earned.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Code */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-4">
          <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Seu código</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#0a1628] border border-yellow-500/30 rounded-xl px-4 py-3 text-2xl font-black text-white tracking-widest text-center" data-testid="invite-code-display">
              {user.invite_code}
            </div>
            <button
              onClick={() => copy(user.invite_code, 'Código copiado!')}
              className="btn-primary px-4 py-3 rounded-xl"
              data-testid="copy-code-btn"
            >
              <FaCopy />
            </button>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-5 mb-4">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Seu link</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2 text-slate-300 text-xs truncate" data-testid="invite-link-display">
              {inviteLink}
            </div>
            <button
              onClick={() => copy(inviteLink, 'Link copiado!')}
              className="bg-[#1e3a5f] hover:bg-[#274a7c] px-3 py-2 rounded-xl text-white"
              data-testid="copy-link-btn"
            >
              <FaCopy />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={shareWhatsapp}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              data-testid="share-whatsapp"
            >
              <FaWhatsapp /> WhatsApp
            </button>
            <button
              onClick={shareTelegram}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              data-testid="share-telegram"
            >
              <FaTelegram /> Telegram
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-5">
          <h3 className="text-white font-black text-lg mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Como funciona?
          </h3>
          <div className="space-y-3">
            {[
              { n: 1, t: 'Compartilhe', d: 'Envie seu código ou link para amigos' },
              { n: 2, t: 'Eles se cadastram', d: 'Usando seu código de indicação' },
              { n: 3, t: 'Você ganha R$ 50', d: 'Direto na sua conta!' },
              { n: 4, t: 'Comissão vitalícia', d: 'Receba 5% das apostas dos indicados' }
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-black flex items-center justify-center flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{step.t}</div>
                  <div className="text-slate-400 text-xs">{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Invite;
