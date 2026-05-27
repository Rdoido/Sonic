import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { FaKey, FaPhone, FaEye, FaEyeSlash, FaGift } from 'react-icons/fa';
import SonicLogo from './SonicLogo';
import { motion } from 'framer-motion';

const AuthModal = ({ open, onOpenChange, mode = 'login', onModeChange }) => {
  const { login, register } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error('Digite um telefone válido');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          setLoading(false);
          return;
        }
        await register(phone.replace(/\D/g, ''), password, confirmPassword, inviteCode || null);
        toast.success('Conta criada com sucesso! Bônus de R$ 10,00 adicionado!');
      } else {
        await login(phone.replace(/\D/g, ''), password);
        toast.success('Bem-vindo de volta!');
      }
      // Reset form
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setInviteCode('');
      onOpenChange(false);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Erro ao processar requisição';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    onModeChange(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0d1f3a] border border-[#1e3a5f] max-w-md p-0 gap-0 overflow-hidden"
        data-testid="auth-modal"
      >
        {/* Header with gradient bg */}
        <div className="relative bg-gradient-to-br from-[#1e3a5f] via-[#0d1f3a] to-[#0d1f3a] px-6 pt-8 pb-6 border-b border-[#1e3a5f]">
          <div className="flex justify-center mb-4">
            <SonicLogo size="lg" />
          </div>
        </div>

        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={mode}
          >
            <h2
              className="text-3xl font-black text-white mb-1"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              data-testid="auth-modal-title"
            >
              {mode === 'register' ? 'Crie uma conta de jogo' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {mode === 'register' ? 'já tem uma conta?' : 'novo na SonicBet?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-[#FFD700] font-bold hover:underline"
                data-testid="auth-mode-toggle"
              >
                {mode === 'register' ? 'Entrar' : 'Cadastre-se'}
              </button>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone */}
              <div className="bg-[#0a1628] rounded-xl border border-[#1e3a5f] focus-within:border-[#FFD700] transition-colors">
                <div className="flex items-center px-4 py-3.5">
                  <span className="text-xl mr-2">🇧🇷</span>
                  <span className="text-white font-medium mr-3">+55</span>
                  <div className="w-px h-5 bg-[#1e3a5f] mr-3"></div>
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                    data-testid="auth-phone-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="bg-[#0a1628] rounded-xl border border-[#1e3a5f] focus-within:border-[#FFD700] transition-colors">
                <div className="flex items-center px-4 py-3.5">
                  <FaKey className="text-slate-400 mr-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                    data-testid="auth-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 ml-2"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <>
                  <div className="bg-[#0a1628] rounded-xl border border-[#1e3a5f] focus-within:border-[#FFD700] transition-colors">
                    <div className="flex items-center px-4 py-3.5">
                      <FaKey className="text-slate-400 mr-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirmar senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                        data-testid="auth-confirm-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 ml-2"
                        data-testid="toggle-confirm-password-visibility"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Invite Code (Optional) */}
                  <div className="bg-[#0a1628] rounded-xl border border-[#1e3a5f] focus-within:border-[#FFD700] transition-colors">
                    <div className="flex items-center px-4 py-3.5">
                      <FaGift className="text-slate-400 mr-3" />
                      <input
                        type="text"
                        placeholder="Código de convite (opcional)"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none uppercase"
                        data-testid="auth-invite-code-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 ${
                  mode === 'register' ? 'btn-blue' : 'btn-primary'
                }`}
                data-testid="auth-submit-button"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-current rounded-full dot-1"></span>
                    <span className="w-2 h-2 bg-current rounded-full dot-2"></span>
                    <span className="w-2 h-2 bg-current rounded-full dot-3"></span>
                  </span>
                ) : mode === 'register' ? (
                  'Registro'
                ) : (
                  'Entrar'
                )}
              </button>

              {mode === 'register' && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  Ao se cadastrar você concorda com os termos e ganhará R$ 10,00 de bônus de boas-vindas!
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
