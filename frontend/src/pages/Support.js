import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import { FaArrowLeft, FaHeadset, FaEnvelope, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Support = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState(user?.phone || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, { name, phone, message });
      toast.success('Mensagem enviada! Responderemos em breve.');
      setMessage('');
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="support-title">
            Suporte
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Quick contact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 mb-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <FaHeadset className="text-white text-3xl" />
            <div>
              <div className="text-white font-black text-xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Atendimento 24/7
              </div>
              <div className="text-white/80 text-xs">Responderemos em até 10 minutos</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
              data-testid="whatsapp-link"
            >
              <FaWhatsapp /> WhatsApp
            </a>
            <a
              href="https://t.me/sonicbet"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
              data-testid="telegram-link"
            >
              <FaTelegram /> Telegram
            </a>
          </div>
        </motion.div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-5 mb-4">
          <h3 className="text-white font-black text-lg mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Envie uma mensagem
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
              data-testid="support-name-input"
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
              data-testid="support-phone-input"
            />
            <textarea
              placeholder="Como podemos ajudar?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full bg-[#0a1628] border border-[#1e3a5f] focus:border-yellow-500 rounded-xl px-4 py-3 text-white outline-none transition-colors resize-none"
              data-testid="support-message-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl font-black disabled:opacity-50"
              data-testid="support-submit-button"
            >
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </div>
        </form>

        {/* FAQ */}
        <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-5">
          <h3 className="text-white font-black text-lg mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Perguntas Frequentes
          </h3>
          <div className="space-y-3">
            {[
              { q: 'Como faço um depósito?', a: 'Acesse o menu Depósito, escolha o valor (mín R$ 10) e pague via PIX.' },
              { q: 'Quanto tempo demora o saque?', a: 'Saques via PIX são processados em até 24h.' },
              { q: 'A plataforma é segura?', a: 'Sim! Somos uma plataforma legalizada com criptografia de ponta.' },
              { q: 'Qual a idade mínima para jogar?', a: 'É necessário ter no mínimo 18 anos.' }
            ].map((item, i) => (
              <details key={i} className="bg-[#0a1628] rounded-xl p-3">
                <summary className="text-white font-bold text-sm cursor-pointer">{item.q}</summary>
                <p className="text-slate-400 text-xs mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;
