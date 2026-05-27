import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { toast } from 'sonner';
import { FaCopy, FaCrown, FaSync, FaEnvelope, FaChevronRight, FaGift, FaShieldAlt, FaSignOutAlt, FaUserPlus, FaHistory, FaHeadset } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Profile = () => {
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [vipData, setVipData] = useState(null);
  const [stats, setStats] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user, loading]);

  const fetchAllData = async () => {
    try {
      const [balanceRes, vipRes, statsRes] = await Promise.all([
        axios.get(`${API}/wallet/balance`),
        axios.get(`${API}/profile/vip`),
        axios.get(`${API}/profile/stats`)
      ]);
      setBalance(balanceRes.data.balance);
      setVipData(vipRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    await refreshUser();
    setTimeout(() => setRefreshing(false), 600);
    toast.success('Saldo atualizado!');
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.public_id);
    toast.success('ID copiado!');
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(user.invite_code);
    toast.success('Código de convite copiado!');
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Digite um código');
      return;
    }
    try {
      const res = await axios.post(`${API}/redeem`, { code: redeemCode });
      toast.success(res.data.message);
      setRedeemCode('');
      setShowRedeem(false);
      fetchAllData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao resgatar código');
    }
  };

  if (!user || !vipData) {
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

  const vipProgress = vipData.next.min > 0
    ? Math.min(100, (vipData.total_bet / vipData.next.min) * 100)
    : 100;

  const menuItems = [
    {
      icon: <FaHistory className="text-white" />,
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      label: 'Relatórios',
      onClick: () => navigate('/historico'),
      testId: 'menu-reports'
    },
    {
      icon: <FaUserPlus className="text-white" />,
      iconBg: 'bg-gradient-to-br from-pink-400 to-orange-400',
      label: 'Convidar',
      sublabel: `🎁 Convide 1 pessoa e ganhe um bônus de R$ 50, comissão de até 5%! 🎉`,
      onClick: () => navigate('/convidar'),
      testId: 'menu-invite'
    },
    {
      icon: <FaGift className="text-white" />,
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
      label: 'Código de Resgate',
      onClick: () => setShowRedeem(!showRedeem),
      testId: 'menu-redeem'
    },
    {
      icon: <FaHeadset className="text-white" />,
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-500',
      label: 'Suporte',
      badge: 17,
      onClick: () => navigate('/suporte'),
      testId: 'menu-support'
    },
    {
      icon: <FaShieldAlt className="text-white" />,
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      label: 'Centro de Segurança',
      onClick: () => toast.info('Em desenvolvimento'),
      testId: 'menu-security'
    },
    {
      icon: <FaSignOutAlt className="text-white" />,
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      label: 'Sair',
      onClick: logout,
      testId: 'menu-logout'
    }
  ];

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <div className="max-w-xl mx-auto px-3 pt-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-3 relative"
          data-testid="profile-card"
        >
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.user_id}`}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover bg-[#1e3a5f]"
                data-testid="profile-avatar"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-slate-300 text-sm" data-testid="profile-id">
                <span>ID: {user.public_id}</span>
                <button onClick={copyId} className="text-slate-400 hover:text-white">
                  <FaCopy className="w-3 h-3" />
                </button>
                <div className="ml-auto flex items-center gap-1 bg-gradient-to-r from-slate-600 to-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                  <FaCrown className="text-yellow-400 w-3 h-3" />
                  <span className="text-white">{vipData.current.name}</span>
                </div>
              </div>
              <div className="text-slate-300 text-sm mt-1" data-testid="profile-account">
                Conta: {user.phone}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-white text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="profile-balance">
                  {balance.toFixed(2)} <span className="text-base">R$</span>
                </span>
                <button onClick={handleRefresh} className="text-slate-400 hover:text-white" data-testid="refresh-balance">
                  <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Message icon */}
            <button className="absolute top-3 right-3" data-testid="messages-button">
              <div className="relative">
                <FaEnvelope className="text-slate-300 w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  17
                </span>
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => navigate('/saque')}
              className="bg-[#1e3a5f] hover:bg-[#274a7c] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              data-testid="withdraw-button"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11 18h2v-2h-2v2zm0-12v6h2V6h-2zm-7 4v6h6v-6H4zm14 0v6h6v-6h-6z"/>
                <path d="M5 9h14v2H5V9zm0 4h14v2H5v-2z"/>
              </svg>
              Saque
            </button>
            <button
              onClick={() => navigate('/deposito')}
              className="btn-green py-3 rounded-xl flex items-center justify-center gap-2"
              data-testid="deposit-button"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
              Depósito
            </button>
          </div>
        </motion.div>

        {/* VIP Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-3 cursor-pointer"
          onClick={() => toast.info(`Você está no nível ${vipData.current.name}. Continue apostando para subir!`)}
          data-testid="vip-progress-card"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <FaCrown className="text-slate-400 w-6 h-6" />
              <span className="text-xs text-slate-400 mt-1">{vipData.current.name}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 text-xs">
                  Siga <span className="text-yellow-400 font-bold">{vipData.next.name}</span>
                  {vipData.needed > 0 && ` Ainda precisa apostar ${vipData.needed.toFixed(2)}`}
                </span>
                <FaChevronRight className="text-slate-500 w-3 h-3" />
              </div>
              <div className="text-[10px] text-slate-500 mb-2">Aposta necessária</div>
              <div className="relative h-2 bg-[#1e3a5f] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vipProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                ></motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {vipData.total_bet.toFixed(2)}/{vipData.next.min.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Redeem Code Input */}
        {showRedeem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0d1f3a] border border-yellow-500/30 rounded-2xl p-4 mb-3"
            data-testid="redeem-code-input"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o código"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-4 py-2 text-white outline-none focus:border-yellow-500 uppercase"
                data-testid="redeem-code-field"
              />
              <button
                onClick={handleRedeem}
                className="btn-primary px-4 py-2 rounded-lg"
                data-testid="redeem-submit"
              >
                Resgatar
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Códigos disponíveis: BEMVINDO10, SONICBET50, BONUS20
            </p>
          </motion.div>
        )}

        {/* Menu */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl overflow-hidden">
          {menuItems.map((item, idx) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors border-b border-[#1e3a5f] last:border-0"
              data-testid={item.testId}
            >
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-white font-semibold">{item.label}</div>
                {item.sublabel && (
                  <div className="text-slate-400 text-xs mt-0.5 truncate">{item.sublabel}</div>
                )}
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
              <FaChevronRight className="text-slate-500 w-3 h-3" />
            </motion.button>
          ))}
        </div>

        {/* Invite code display */}
        <div className="mt-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Seu código de convite</div>
              <div className="text-white text-2xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="user-invite-code">
                {user.invite_code}
              </div>
            </div>
            <button
              onClick={copyInviteCode}
              className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
              data-testid="copy-invite-code"
            >
              <FaCopy />
              <span className="text-sm">Copiar</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
