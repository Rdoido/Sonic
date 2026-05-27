import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheck, FaCopy } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUICK_AMOUNTS = [10, 30, 50, 100, 200, 500, 1000, 2000];

const Deposit = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [step, setStep] = useState(1); // 1: select amount, 2: PIX details
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    fetchBalance();
  }, [user, authLoading]);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/wallet/balance`);
      setBalance(res.data.balance);
    } catch (e) {}
  };

  const handleDeposit = async () => {
    const value = customAmount ? parseFloat(customAmount) : amount;
    if (!value || value < 10) {
      toast.error('Valor mínimo: R$ 10,00');
      return;
    }
    if (value > 10000) {
      toast.error('Valor máximo: R$ 10.000,00');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/wallet/deposit-pix`, { amount: value });
      setPixData(res.data);
      setStep(2);
      setBalance(res.data.new_balance);
      toast.success(`Depósito de R$ ${value.toFixed(2)} confirmado!`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao processar depósito');
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen sonic-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="deposit-title">
            Depósito
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gold-gradient rounded-2xl p-5 mb-4 relative overflow-hidden"
          data-testid="deposit-balance-card"
        >
          <div className="absolute top-0 right-0 text-6xl opacity-20">💰</div>
          <div className="relative">
            <div className="text-black/70 text-xs font-bold uppercase tracking-wider">Saldo Atual</div>
            <div className="text-black text-4xl font-black mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              R$ {balance.toFixed(2)}
            </div>
          </div>
        </motion.div>

        {step === 1 ? (
          <>
            {/* PIX selector */}
            <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-4">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Forma de Pagamento
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a1628] rounded-xl border-2 border-green-500">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.18L19.43 8 12 11.82 4.57 8 12 4.18z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">PIX</div>
                  <div className="text-slate-400 text-xs">Instantâneo • Sem taxas</div>
                </div>
                <FaCheck className="text-green-500" />
              </div>
            </div>

            {/* Amount selection */}
            <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4 mb-4">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Selecione o Valor
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setAmount(v);
                      setCustomAmount('');
                    }}
                    className={`py-3 rounded-xl font-black text-sm transition-all ${
                      amount === v && !customAmount
                        ? 'btn-primary'
                        : 'bg-[#0a1628] border border-[#1e3a5f] text-white hover:border-yellow-500'
                    }`}
                    data-testid={`amount-${v}`}
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                <input
                  type="number"
                  placeholder="Outro valor"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl pl-12 pr-4 py-3 text-white outline-none transition-colors"
                  min="10"
                  max="10000"
                  data-testid="custom-amount-input"
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Mín: R$ 10,00 • Máx: R$ 10.000,00
              </p>
            </div>

            {/* Promo banner */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <div className="text-white font-bold text-sm">Primeiro depósito? Ganhe +100%!</div>
                  <div className="text-slate-400 text-xs">Bônus automático em depósitos acima de R$ 30</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full btn-green py-4 rounded-xl font-black text-lg disabled:opacity-50"
              data-testid="confirm-deposit-button"
            >
              {loading ? 'Processando...' : `Depositar R$ ${(customAmount || amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </button>
          </>
        ) : (
          /* PIX Payment screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1f3a] border border-green-500/30 rounded-2xl p-6"
            data-testid="pix-payment-screen"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                <FaCheck className="text-green-500 text-4xl" />
              </div>
              <h2 className="text-white text-2xl font-black mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Pagamento Confirmado!
              </h2>
              <p className="text-slate-400 text-sm">Depósito creditado instantaneamente</p>
              <div className="text-green-400 text-3xl font-black mt-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                + R$ {pixData?.amount.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#0a1628] rounded-xl p-4 mb-4 border border-[#1e3a5f]">
              <div className="text-slate-400 text-xs mb-2">Código PIX (Demo)</div>
              <div className="text-slate-300 text-xs font-mono break-all bg-white/5 p-3 rounded-lg mb-3">
                {pixData?.qr_code}
              </div>
              <button
                onClick={copyPix}
                className="w-full bg-[#1e3a5f] hover:bg-[#274a7c] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                data-testid="copy-pix-code-btn"
              >
                {copied ? <><FaCheck /> Copiado!</> : <><FaCopy /> Copiar código</>}
              </button>
            </div>

            <div className="bg-[#0a1628] rounded-xl p-3 mb-4 flex justify-between text-sm">
              <span className="text-slate-400">ID Transação:</span>
              <span className="text-white font-mono">{pixData?.transaction_id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/perfil')}
                className="bg-[#1e3a5f] hover:bg-[#274a7c] text-white font-bold py-3 rounded-xl transition-colors"
                data-testid="back-to-profile"
              >
                Perfil
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-primary py-3 rounded-xl"
                data-testid="play-games-btn"
              >
                Jogar Agora
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Deposit;
