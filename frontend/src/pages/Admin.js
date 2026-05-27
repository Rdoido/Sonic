import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SonicLogo from '../components/SonicLogo';
import { toast } from 'sonner';
import {
  FaArrowLeft, FaUsers, FaMoneyBillWave, FaGamepad, FaClock,
  FaCheck, FaTimes, FaChartLine, FaUserPlus
} from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="glass-card-modern p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ background: `${color}22`, color }}>
        <Icon />
      </div>
    </div>
    <div className="text-white text-2xl font-black leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {value}
    </div>
    <div className="text-slate-400 text-[10px] uppercase tracking-wider mt-1">{label}</div>
    {sub && <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>}
  </div>
);

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [pendingWithdraws, setPendingWithdraws] = useState([]);
  const [allTx, setAllTx] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }
    checkAdmin();
  }, [user, authLoading]);

  const checkAdmin = async () => {
    try {
      const res = await axios.get(`${API}/admin/me`);
      setIsAdmin(res.data.is_admin);
      if (res.data.is_admin) {
        loadAll();
      }
    } catch (e) {
      setIsAdmin(false);
    }
  };

  const loadAll = async () => {
    try {
      const [ov, us, wd, tx, ct] = await Promise.all([
        axios.get(`${API}/admin/overview`),
        axios.get(`${API}/admin/users?limit=30`),
        axios.get(`${API}/admin/transactions?type=withdraw&status=pending&limit=20`),
        axios.get(`${API}/admin/transactions?limit=30`),
        axios.get(`${API}/admin/contacts?limit=20`),
      ]);
      setOverview(ov.data);
      setUsers(us.data);
      setPendingWithdraws(wd.data);
      setAllTx(tx.data);
      setContacts(ct.data);
    } catch (e) {
      toast.error('Erro ao carregar dados');
    }
  };

  const handleAction = async (txId, action) => {
    setActionLoading(txId);
    try {
      await axios.post(`${API}/admin/withdraw/${txId}/${action}`);
      toast.success(action === 'approve' ? 'Saque aprovado!' : 'Saque rejeitado e estornado');
      loadAll();
    } catch (e) {
      const detail = e.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro na ação');
    } finally {
      setActionLoading(null);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen sonic-bg-modern flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen sonic-bg-modern flex items-center justify-center p-4">
        <div className="glass-card-modern p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-white text-xl font-black mb-2">Acesso Restrito</h2>
          <p className="text-slate-400 text-sm mb-4">Esta área é exclusiva para administradores.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-2 rounded-xl"
            data-testid="admin-back-home"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: FaChartLine },
    { id: 'withdraws', label: 'Saques', icon: FaMoneyBillWave },
    { id: 'users', label: 'Usuários', icon: FaUsers },
    { id: 'transactions', label: 'Transações', icon: FaClock },
    { id: 'contacts', label: 'Contatos', icon: FaUserPlus },
  ];

  return (
    <div className="min-h-screen sonic-bg-modern pb-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0a1628]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-white p-2 hover:bg-white/5 rounded-lg" data-testid="admin-back">
            <FaArrowLeft />
          </button>
          <div className="flex items-center gap-2">
            <SonicLogo size="sm" />
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black tracking-wider">
              ADMIN
            </span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
        {/* Tabs */}
        <div className="overflow-x-auto no-scrollbar mb-4">
          <div className="flex gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                    active
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 text-white shadow-lg shadow-yellow-500/20'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  data-testid={`admin-tab-${t.id}`}
                >
                  <Icon className="text-xs" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' && overview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard icon={FaUsers} label="Total Usuários" value={overview.total_users} color="#3B82F6" sub={`+${overview.new_users_today} hoje`} />
              <StatCard icon={FaMoneyBillWave} label="Depósitos Total" value={`R$ ${overview.total_deposits.toFixed(0)}`} color="#22C55E" />
              <StatCard icon={FaClock} label="Saques Pendentes" value={overview.pending_withdraws} color="#F59E0B" />
              <StatCard icon={FaGamepad} label="Jogos Jogados" value={overview.total_games_played} color="#EC4899" />
            </div>

            <div className="glass-card-modern p-4">
              <h3 className="text-white font-black text-base mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Saldo em Carteiras
              </h3>
              <div className="text-yellow-400 text-3xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
                R$ {overview.total_balance_in_wallets.toFixed(2)}
              </div>
              <p className="text-slate-400 text-xs mt-1">Total de saldo nas contas dos usuários</p>
            </div>

            {overview.withdraws_by_status && Object.keys(overview.withdraws_by_status).length > 0 && (
              <div className="glass-card-modern p-4 mt-4">
                <h3 className="text-white font-black text-base mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Saques por Status
                </h3>
                <div className="space-y-2">
                  {Object.entries(overview.withdraws_by_status).map(([status, info]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{status}</span>
                      <span className="text-white font-bold">{info.count} • R$ {info.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Pending Withdraws */}
        {tab === 'withdraws' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="glass-card-modern p-4 mb-2">
              <h3 className="text-white font-black mb-1">Saques Pendentes</h3>
              <p className="text-slate-400 text-xs">{pendingWithdraws.length} solicitações aguardando</p>
            </div>
            {pendingWithdraws.length === 0 ? (
              <div className="glass-card-modern p-8 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-slate-400 text-sm">Nenhum saque pendente</p>
              </div>
            ) : pendingWithdraws.map((tx) => (
              <div key={tx.transaction_id} className="glass-card-modern p-4" data-testid={`withdraw-${tx.transaction_id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-green-400 text-xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      R$ {tx.amount.toFixed(2)}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {tx.pix_key_type?.toUpperCase()}: <span className="text-slate-300">{tx.pix_key}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-mono">{tx.transaction_id}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAction(tx.transaction_id, 'approve')}
                      disabled={actionLoading === tx.transaction_id}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold flex items-center gap-1 hover:bg-green-500/30 disabled:opacity-50"
                      data-testid={`approve-${tx.transaction_id}`}
                    >
                      <FaCheck className="text-[10px]" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleAction(tx.transaction_id, 'reject')}
                      disabled={actionLoading === tx.transaction_id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1 hover:bg-red-500/30 disabled:opacity-50"
                      data-testid={`reject-${tx.transaction_id}`}
                    >
                      <FaTimes className="text-[10px]" /> Rejeitar
                    </button>
                  </div>
                </div>
                <div className="text-slate-500 text-[10px]">{new Date(tx.created_at).toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {users.map((u) => (
              <div key={u.user_id} className="glass-card-modern p-3 flex items-center justify-between" data-testid={`user-${u.user_id}`}>
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt="avatar" className="w-9 h-9 rounded-full bg-white/10" />
                  <div>
                    <div className="text-white text-sm font-bold">+55 {u.phone}</div>
                    <div className="text-slate-500 text-[10px]">VIP {u.vip_level || 0} • ID {u.public_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-black text-sm">R$ {u.balance.toFixed(2)}</div>
                  <div className="text-slate-500 text-[10px]">apostou R$ {(u.total_bet || 0).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* All transactions */}
        {tab === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {allTx.map((tx) => (
              <div key={tx.transaction_id} className="glass-card-modern p-3" data-testid={`tx-${tx.transaction_id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-300' :
                        tx.type === 'withdraw' ? 'bg-red-500/20 text-red-300' :
                        tx.type === 'checkin' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>{tx.type}</span>
                      <span className={`text-[10px] ${
                        tx.status === 'completed' ? 'text-green-400' :
                        tx.status === 'pending' ? 'text-yellow-400' :
                        'text-slate-400'
                      }`}>{tx.status}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] font-mono mt-1">{tx.transaction_id}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-sm ${tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'withdraw' ? '-' : '+'}R$ {tx.amount.toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-[10px]">{new Date(tx.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Contacts */}
        {tab === 'contacts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {contacts.length === 0 ? (
              <div className="glass-card-modern p-8 text-center">
                <p className="text-slate-400 text-sm">Nenhum contato ainda</p>
              </div>
            ) : contacts.map((c) => (
              <div key={c.contact_id} className="glass-card-modern p-4" data-testid={`contact-${c.contact_id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold text-sm">{c.name}</div>
                    <div className="text-slate-400 text-xs">{c.phone}</div>
                  </div>
                  <div className="text-slate-500 text-[10px]">{new Date(c.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <div className="text-slate-300 text-xs">{c.message}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
