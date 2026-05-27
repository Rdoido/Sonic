import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import AuthModal from './AuthModal';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleNav = (path, requireAuth = true) => {
    if (requireAuth && !user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    navigate(path);
  };

  const items = [
    {
      id: 'inicio',
      label: 'Início',
      path: '/',
      requireAuth: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19 21H5a2 2 0 01-2-2v-9.5a1 1 0 01.36-.77l8-6.5a1 1 0 011.28 0l8 6.5a1 1 0 01.36.77V19a2 2 0 01-2 2zM5 19h14V9.97l-7-5.68-7 5.68V19z" />
        </svg>
      ),
      color: '#3B82F6'
    },
    {
      id: 'promocao',
      label: 'Promoção',
      path: '/promocoes',
      requireAuth: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M20 7h-3.2c.1-.3.2-.6.2-1 0-1.7-1.3-3-3-3-1.1 0-2 .5-2.6 1.3l-.4.5-.4-.6C9.9 3.5 9 3 8 3 6.3 3 5 4.3 5 6c0 .4.1.7.2 1H2v6h1v9h18v-9h1V7h-2zM14 5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM8 5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-4 4h7v2H4V9zm1 4h6v7H5v-7zm14 7h-6v-7h6v7zm1-9h-7V9h7v2z" />
        </svg>
      ),
      color: '#FF6B9D'
    },
    {
      id: 'deposito',
      label: 'Depósito',
      path: '/deposito',
      requireAuth: true,
      featured: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      ),
      color: '#FFD700'
    },
    {
      id: 'saque',
      label: 'Saque',
      path: '/saque',
      requireAuth: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M21 7.5h-2v9H5V7.5H3v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9zM13 12.5l4-4-1.41-1.41L13 9.67V3.5h-2v6.17L8.41 7.09 7 8.5l4 4 2 0z" />
        </svg>
      ),
      color: '#9D4CDD'
    },
    {
      id: 'perfil',
      label: 'Perfil',
      path: '/perfil',
      requireAuth: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      color: '#F97316'
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1f3a] border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-xl mx-auto px-2">
          <div className="flex items-center justify-around relative">
            {items.map((item) => {
              const active = isActive(item.path);
              if (item.featured) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.path, item.requireAuth)}
                    className="relative -mt-6 flex flex-col items-center"
                    data-testid={`nav-${item.id}`}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center pulse-glow"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      }}
                    >
                      <div style={{ color: '#000' }}>{item.icon}</div>
                    </div>
                    <span
                      className="text-xs mt-1 font-medium"
                      style={{ color: active ? '#22C55E' : '#FFD700' }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.path, item.requireAuth)}
                  className={`relative flex flex-col items-center py-3 px-4 transition-all ${
                    active ? 'nav-active' : ''
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <div style={{ color: active ? item.color : '#94a3b8' }}>{item.icon}</div>
                  <span
                    className="text-[11px] mt-1 font-medium"
                    style={{ color: active ? '#22C55E' : '#94a3b8' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </>
  );
};

export default BottomNav;
