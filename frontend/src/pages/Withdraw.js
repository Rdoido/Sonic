import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PIX_TYPES = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
  { id: 'email', label: 'Email', placeholder: 'seu@email.com' },
  { id: 'phone', label: 'Telefone', placeholder: '(00) 00000-0000' },
  { id: 'random', label: 'Chave Aleatória', placeholder: 'xxxx-xxxx-xxxx' }
];

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
    if (!value || value < 50) {
      toast.error('Valor mínimo de saque: R$ 50,00');
      return;
    }
    if (value > balance) {
      toast.error('Saldo insuficiente');
      return;
    }
    if (!pixKey) {
      toast.error('Informe sua chave PIX');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/wallet/withdraw`, {
        amount: value,
        pix_key: pixKey,
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

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="withdraw-title">
            Saque
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 mb-4 relative overflow-hidden"
          data-testid="withdraw-balance-card"
        >
          <div className="absolute top-0 right-0 text-6xl opacity-20">💎</div>
          <div className="relative">
            <div className="text-white/70 text-xs font-bold uppercase tracking-wider">Saldo Disponível</div>
            <div className="text-white text-4xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              R$ {balance.toFixed(2)}
            </div>
          </div>
        </motion.div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1f3a] border border-green-500/30 rounded-2xl p-6 text-center"
            data-testid="withdraw-success-screen"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <FaCheck className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-white text-2xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Saque Solicitado!
            </h2>
            <p className="text-slate-400 text-sm mb-4">{success.message}</p>
            <div className="text-green-400 text-3xl font-black mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              R$ {success.amount.toFixed(2)}
            </div>
            <div className="bg-[#0a1628] rounded-xl p-3 mb-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>ID:</span>
                <span className="text-white font-mono">{success.transaction_id}</span>
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
            {/* Requirements warning */}
            {stats && stats.total_bet < 100 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 flex items-start gap-3">
                <span className="text-yellow-500 text-xl">⚠️</span>
                <div className="text-xs">
                  <div className="text-yellow-400 font-bold">Aposta mínima necessária</div>
                  <div className="text-slate-400 mt-1">
                    Para sacar, você precisa apostar pelo menos R$ 100,00.
                    Faltam: <span className="text-yellow-400 font-bold">R$ {(100 - stats.total_bet).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-4">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Valor do Saque
              </div>
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">R$</div>
                <input
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl pl-12 pr-4 py-4 text-white text-2xl font-black outline-none transition-colors"
                  min="50"
                  data-testid="withdraw-amount-input"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    disabled={v > balance}
                    className="py-2 rounded-lg bg-[#0a1628] border border-[#1e3a5f] hover:border-yellow-500 text-white font-bold text-sm transition-colors disabled:opacity-30"
                    data-testid={`quick-withdraw-${v}`}
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3">
                Mín: R$ 50,00 • Processamento: até 24h
              </p>
            </div>

            {/* PIX Key */}
            <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-4">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Chave PIX
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {PIX_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPixKeyType(type.id)}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      pixKeyType === type.id
                        ? 'btn-primary'
                        : 'bg-[#0a1628] border border-[#1e3a5f] text-white hover:border-yellow-500'
                    }`}
                    data-testid={`pix-type-${type.id}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder={currentPixType?.placeholder}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                data-testid="pix-key-input"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full btn-primary py-4 rounded-xl font-black text-lg disabled:opacity-50"
              data-testid="confirm-withdraw-button"
            >
              {loading ? 'Processando...' : 'Solicitar Saque'}
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Withdraw;
