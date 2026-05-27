import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { FaArrowLeft, FaGift, FaPercentage, FaCoins, FaUsers } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Promotions = () => {
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    axios.get(`${API}/promotions`).then((res) => setPromos(res.data)).catch(() => {});
  }, []);

  const iconMap = {
    cashback: <FaPercentage className="text-3xl" />,
    referral: <FaUsers className="text-3xl" />,
    checkin: <FaGift className="text-3xl" />,
    info: <FaCoins className="text-3xl" />,
    deposit_bonus: <FaCoins className="text-3xl" />
  };

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="promotions-title">
            Promoções
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-3">
        {promos.map((promo, idx) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative overflow-hidden rounded-2xl p-5 border"
            style={{
              borderColor: `${promo.color}40`,
              background: `linear-gradient(135deg, ${promo.color}15, ${promo.color}05)`
            }}
            data-testid={`promo-${promo.id}`}
          >
            <div className="absolute right-0 top-0 bottom-0 w-32 flex items-center justify-center opacity-10">
              <div style={{ color: promo.color, fontSize: '8rem' }}>
                {iconMap[promo.type]}
              </div>
            </div>
            <div className="relative">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${promo.color}20`, color: promo.color }}
                >
                  {iconMap[promo.type]}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {promo.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{promo.description}</p>
                </div>
              </div>
              <button
                className="mt-3 px-4 py-2 rounded-full font-bold text-sm"
                style={{ background: promo.color, color: '#fff' }}
                data-testid={`participate-${promo.id}`}
              >
                Participar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Promotions;
