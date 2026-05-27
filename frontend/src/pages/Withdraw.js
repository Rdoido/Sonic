import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheck, FaIdCard, FaEnvelope, FaPhone, FaRandom, FaBuilding, FaShieldAlt, FaBolt } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PIX_TYPES = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00', icon: FaIdCard, color: '#22C55E', desc: 'Pessoa Física' },
  { id: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', icon: FaBuilding, color: '#3B82F6', desc: 'Pessoa Jurídica' },
  { id: 'email', label: 'Email', placeholder: 'seu@email.com', icon: FaEnvelope, color: '#F97316', desc: 'E-mail cadastrado' },
  { id: 'phone', label: 'Celular', placeholder: '(00) 00000-0000', icon: FaPhone, color: '#A855F7', desc: 'Telefone' },
  { id: 'random', label: 'Aleatória', placeholder: 'xxxx-xxxx-xxxx-xxxx', icon: FaRandom, color: '#EC4899', desc: 'Chave gerada' },
];

const QUICK_AMOUNTS = [20, 50, 100, 500];
const MIN_WITHDRAW = 20;

const Withdraw = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [balanceRes, statsRes] = await Promise.all([
        axios.get(`${API}/wallet/balance`),
        axios.get(`${API}/profile/stats`)
      ]);
      setBalance(balanceRes.data.balance);
      setStats(statsRes.data);
    } catch (e) {}
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (!value || value < MIN_WITHDRAW) {
      toast.error(`Valor mínimo de saque: R$ ${MIN_WITHDRAW},00`);
      return;
    }
    if (value > balance) {
      toast.error('Saldo insuficiente');
      return;
    }
    if (!pixKey.trim()) {
      toast.error('Informe sua chave PIX');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/wallet/withdraw`, {
        amount: value,
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType
      });
      setSuccess(res.data);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao processar saque');
    } finally {
      setLoading(false);
    }
  };

  const currentPixType = PIX_TYPES.find((p) => p.id === pixKeyType);
  const minBetRequired = 50;

  return (
    <div className="min-h-screen sonic-bg-modern pb-24">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0a1628]/80 border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-white p-2 hover:bg-white/5 rounded-lg transition"
            data-testid="back-button"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="withdraw-title">
            Saque PIX
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4">
        {/* Balance card - modernized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-5 mb-4 overflow-hidden"
          data-testid="withdraw-balance-card"
        >
          {/* Animated gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-blue-400/20 blur-3xl" />

          {/* Decorative diamond pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="diamond-pattern-w" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke="white" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diamond-pattern-w)" />
          </svg>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-white/70 text-xs font-bold uppercase tracking-wider">Saldo Disponível</div>
              <div className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold backdrop-blur">
                PIX
              </div>
            </div>
            <div
              className="text-white text-4xl font-black mt-1"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              data-testid="withdraw-balance-amount"
            >
              R$ {balance.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-3 text-white/60 text-[11px]">
              <FaShieldAlt /> Saque seguro • <FaBolt className="text-yellow-300" /> Processamento até 24h
            </div>
          </div>
        </motion.div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-modern p-6 text-center"
            data-testid="withdraw-success-screen"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4 border-2 border-green-500/40"
            >
              <FaCheck className="text-green-400 text-4xl" />
            </motion.div>
            <h2 className="text-white text-2xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Saque Solicitado!
            </h2>
            <p className="text-slate-400 text-sm mb-4">{success.message}</p>
            <div className="text-green-400 text-3xl font-black mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              R$ {success.amount.toFixed(2)}
            </div>
            <div className="bg-black/30 backdrop-blur rounded-xl p-3 mb-4 text-sm border border-white/5">
              <div className="flex justify-between text-slate-400">
                <span>ID:</span>
                <span className="text-white font-mono text-xs">{success.transaction_id}</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Status:</span>
                <span className="text-yellow-400">Em processamento</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/perfil')}
              className="btn-primary w-full py-3 rounded-xl"
              data-testid="back-to-profile-btn"
            >
              Voltar ao Perfil
            </button>
          </motion.div>
        ) : (
          <>
            {/* Bet requirement warning */}
            {stats && stats.total_bet < minBetRequired && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 flex items-start gap-3"
                data-testid="bet-requirement-warning"
              >
                <span className="text-yellow-400 text-2xl flex-shrink-0">⚠️</span>
                <div className="text-xs">
                  <div className="text-yellow-300 font-bold">Aposta mínima necessária</div>
                  <div className="text-slate-300 mt-1">
                    Para sacar, aposte pelo menos <strong>R$ {minBetRequired}</strong>.
                    Faltam: <span className="text-yellow-300 font-bold">R$ {(minBetRequired - stats.total_bet).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Amount card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card-modern p-4 mb-4"
              data-testid="withdraw-amount-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
                  Valor do Saque
                </div>
                <div className="text-[10px] text-slate-500">Mín: R$ {MIN_WITHDRAW}</div>
              </div>
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 font-bold text-lg">R$</div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 focus:border-yellow-400/60 focus:bg-black/40 rounded-xl pl-12 pr-4 py-4 text-white text-2xl font-black outline-none transition-all"
                  min={MIN_WITHDRAW}
                  data-testid="withdraw-amount-input"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    disabled={v > balance}
                    className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                      String(v) === amount
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30'
                        : 'bg-black/30 border-white/10 text-white hover:border-yellow-400/40'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                    data-testid={`quick-withdraw-${v}`}
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* PIX Key Type - modernized with icons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card-modern p-4 mb-4"
              data-testid="withdraw-pix-card"
            >
              <div className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></span>
                Tipo de Chave PIX
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {PIX_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = pixKeyType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setPixKeyType(type.id); setPixKey(''); }}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
                        isActive
                          ? 'border-transparent bg-white/5'
                          : 'border-white/10 hover:border-white/20 opacity-70 hover:opacity-100'
                      }`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${type.color}33, ${type.color}11)`,
                        borderColor: type.color,
                        boxShadow: `0 4px 16px ${type.color}33`
                      } : {}}
                      data-testid={`pix-type-${type.id}`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${type.color}, ${type.color}cc)`
                            : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#fff' : type.color,
                          boxShadow: isActive ? `0 4px 12px ${type.color}66` : 'none'
                        }}
                      >
                        <Icon className="text-base" />
                      </div>
                      <div className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {type.label}
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="pix-type-dot"
                          className="absolute -bottom-1 w-1 h-1 rounded-full"
                          style={{ background: type.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Description */}
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-black/20 border border-white/5">
                <currentPixType.icon style={{ color: currentPixType.color }} />
                <span className="text-slate-300 text-xs">{currentPixType.desc}</span>
              </div>

              {/* Input */}
              <input
                type="text"
                placeholder={currentPixType?.placeholder}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full bg-black/30 border border-white/10 focus:border-yellow-400/60 rounded-xl px-4 py-3 text-white outline-none transition-all"
                data-testid="pix-key-input"
              />
              <p className="text-slate-500 text-[10px] mt-2">
                ⓘ A chave PIX deve estar registrada no nome do titular da conta SonicBet.
              </p>
            </motion.div>

            {/* Confirm button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)'
              }}
              data-testid="confirm-withdraw-button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full dot-1"></span>
                  <span className="w-2 h-2 bg-white rounded-full dot-2"></span>
                  <span className="w-2 h-2 bg-white rounded-full dot-3"></span>
                </span>
              ) : (
                'Solicitar Saque'
              )}
            </motion.button>

            <div className="text-center mt-4 text-slate-500 text-[11px]">
              🔒 Transação 100% segura via PIX
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Withdraw;
