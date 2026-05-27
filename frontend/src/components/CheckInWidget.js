import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { FaGift, FaCheck, FaFire } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckInWidget = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [showReward, setShowReward] = useState(null);

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/checkin/status`);
      setStatus(res.data);
    } catch (e) {
      // silent
    }
  };

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await axios.post(`${API}/checkin/claim`);
      setShowReward(res.data);
      toast.success(res.data.message);
      setTimeout(() => setShowReward(null), 3500);
      fetchStatus();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao fazer check-in');
    } finally {
      setClaiming(false);
    }
  };

  if (!user || !status) return null;

  const { rewards, streak, claimed_today } = status;
  const currentDay = claimed_today ? streak : streak + 1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-4 border border-yellow-500/20"
        data-testid="checkin-widget"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-rose-900/40" />
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-yellow-400/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-orange-500/20 blur-2xl" />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
                <FaGift className="text-white" />
              </div>
              <div>
                <div className="text-white font-black text-sm leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Check-in Diário
                </div>
                <div className="text-slate-400 text-[10px]">Volte todo dia e acumule até R$ 320</div>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
                <FaFire className="text-orange-400 text-xs" />
                <span className="text-orange-300 text-[11px] font-bold">{streak}d</span>
              </div>
            )}
          </div>

          {/* 7-day grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {rewards.map((reward, idx) => {
              const day = idx + 1;
              const isPast = day < currentDay || (day === currentDay && claimed_today);
              const isCurrent = day === currentDay && !claimed_today;
              const isFinal = day === rewards.length;
              return (
                <div
                  key={day}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${
                    isCurrent
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 shadow-lg shadow-yellow-500/30 scale-110'
                      : isPast
                      ? 'border-green-500/40 bg-green-500/10'
                      : isFinal
                      ? 'border-fuchsia-400/40 bg-fuchsia-500/10'
                      : 'border-white/10 bg-black/20'
                  }`}
                  data-testid={`checkin-day-${day}`}
                >
                  {isPast ? (
                    <FaCheck className="text-green-400 text-xs" />
                  ) : (
                    <>
                      <div className={`text-[8px] font-bold ${isCurrent ? 'text-yellow-300' : 'text-slate-500'}`}>
                        D{day}
                      </div>
                      <div className={`text-[9px] font-black leading-none mt-0.5 ${
                        isCurrent ? 'text-yellow-200' : isFinal ? 'text-fuchsia-300' : 'text-slate-300'
                      }`}>
                        R${reward}
                      </div>
                    </>
                  )}
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA button */}
          <button
            onClick={claim}
            disabled={claimed_today || claiming}
            className="w-full py-2.5 rounded-xl font-black text-sm transition-all relative overflow-hidden"
            style={
              claimed_today
                ? { background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }
                : { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000', boxShadow: '0 6px 20px rgba(255,165,0,0.4)' }
            }
            data-testid="checkin-claim-btn"
          >
            {claimed_today
              ? `✓ Recompensa de hoje resgatada (R$ ${rewards[(streak - 1) % rewards.length]})`
              : claiming
              ? 'Resgatando...'
              : `Resgatar R$ ${rewards[Math.min(streak, rewards.length - 1)].toFixed(2)} agora`}
          </button>
        </div>
      </motion.div>

      {/* Reward popup */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur"
            onClick={() => setShowReward(null)}
            data-testid="checkin-reward-popup"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl shadow-orange-500/50"
            >
              <div className="text-6xl mb-3">🎉</div>
              <div className="text-white text-xs font-bold uppercase tracking-wider opacity-90">Dia {showReward.day}</div>
              <div className="text-white text-5xl font-black my-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                +R$ {showReward.amount.toFixed(2)}
              </div>
              <div className="text-white/90 text-sm mb-4">creditado no seu saldo</div>
              <button
                onClick={() => setShowReward(null)}
                className="px-6 py-2 bg-white text-orange-600 rounded-full font-black text-sm"
                data-testid="checkin-reward-close"
              >
                Continuar →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CheckInWidget;
