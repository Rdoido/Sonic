import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import SonicLogo from '../components/SonicLogo';
import { FaArrowLeft } from 'react-icons/fa';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const History = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('games');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    Promise.all([
      axios.get(`${API}/games/history?limit=50`).then((r) => setHistory(r.data)).catch(() => {}),
      axios.get(`${API}/wallet/transactions?limit=50`).then((r) => setTransactions(r.data)).catch(() => {}),
      axios.get(`${API}/profile/stats`).then((r) => setStats(r.data)).catch(() => {})
    ]);
  }, [user, loading]);

  return (
    <div className="min-h-screen sonic-bg pb-24">
      <header className="sticky top-0 z-40 bg-[#0d1f3a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white p-2" data-testid="back-button">
            <FaArrowLeft />
          </button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="history-title">
            Relatórios
          </h1>
          <SonicLogo size="sm" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-4" data-testid="stat-games">
              <div className="text-slate-400 text-xs uppercase">Total Jogos</div>
              <div className="text-white text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {stats.total_games}
              </div>
              <div className="text-green-400 text-xs">{stats.total_wins} vitórias</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0d1f3a] border border-yellow-500/30 rounded-2xl p-4" data-testid="stat-won">
              <div className="text-slate-400 text-xs uppercase">Total Ganho</div>
              <div className="text-yellow-400 text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
                R$ {stats.total_won.toFixed(2)}
              </div>
              <div className="text-slate-500 text-xs">de R$ {stats.total_bet.toFixed(2)} apostado</div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-[#0d1f3a] p-1 rounded-xl border border-[#1e3a5f]">
          <button
            onClick={() => setTab('games')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              tab === 'games' ? 'btn-primary' : 'text-slate-400'
            }`}
            data-testid="tab-games"
          >
            Jogos
          </button>
          <button
            onClick={() => setTab('transactions')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              tab === 'transactions' ? 'btn-primary' : 'text-slate-400'
            }`}
            data-testid="tab-transactions"
          >
            Transações
          </button>
        </div>

        {tab === 'games' ? (
          history.length === 0 ? (
            <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-8 text-center">
              <p className="text-slate-400">Nenhum jogo ainda. Comece a jogar!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((g, idx) => (
                <motion.div
                  key={g.game_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                  className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-xl p-3 flex items-center gap-3"
                  data-testid={`history-game-${g.game_id}`}
                >
                  <div className="text-3xl">{g.symbols.join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{g.game_title}</div>
                    <div className="text-slate-500 text-xs">
                      {new Date(g.played_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-sm ${g.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                      {g.result === 'win' ? '+' : '-'}R$ {(g.result === 'win' ? g.win_amount : g.bet_amount).toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-[10px]">Aposta R$ {g.bet_amount.toFixed(2)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : transactions.length === 0 ? (
          <div className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-2xl p-8 text-center">
            <p className="text-slate-400">Nenhuma transação ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, idx) => (
              <motion.div
                key={tx.transaction_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className="bg-[#0d1f3a] border border-[#1e3a5f] rounded-xl p-3 flex items-center gap-3"
                data-testid={`history-tx-${tx.transaction_id}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  tx.type === 'deposit' ? 'bg-green-500/20 text-green-400'
                  : tx.type === 'withdraw' ? 'bg-purple-500/20 text-purple-400'
                  : tx.type === 'redeem' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {tx.type === 'deposit' ? '↓' : tx.type === 'withdraw' ? '↑' : '🎁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm capitalize">
                    {tx.type === 'deposit' ? 'Depósito PIX'
                    : tx.type === 'withdraw' ? 'Saque PIX'
                    : tx.type === 'redeem' ? `Resgate: ${tx.code}`
                    : tx.type === 'referral_bonus' ? 'Bônus de indicação'
                    : tx.type}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {new Date(tx.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-sm ${
                    tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {tx.type === 'withdraw' ? '-' : '+'}R$ {tx.amount.toFixed(2)}
                  </div>
                  <div className={`text-[10px] ${
                    tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {tx.status === 'completed' ? '✓ Concluído' : '⏱ Pendente'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default History;
