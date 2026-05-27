import { motion } from 'framer-motion';

const SonicLogo = ({ size = 'md' }) => {
  const sizes = {
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-10 h-10', text: 'text-xl' },
    lg: { box: 'w-14 h-14', text: 'text-3xl' },
    xl: { box: 'w-20 h-20', text: 'text-4xl' }
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2" data-testid="sonic-logo">
      <motion.div
        className={`${s.box} relative flex items-center justify-center`}
        whileHover={{ rotate: 15 }}
        transition={{ duration: 0.3 }}
      >
        {/* Lightning bolt with gold ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] opacity-90"></div>
        <div className="absolute inset-[2px] rounded-full bg-[#0a1628]"></div>
        <svg
          viewBox="0 0 24 24"
          className="relative z-10 w-2/3 h-2/3"
          fill="url(#sonic-grad)"
        >
          <defs>
            <linearGradient id="sonic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
          </defs>
          <path d="M13 2L4.09 12.97L12 12L11 22L19.91 11.03L12 12L13 2Z" />
        </svg>
      </motion.div>
      <div>
        <div className={`${s.text} font-black leading-none`} style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="text-white">sonic</span>
          <span className="text-gold-gradient">Bet</span>
        </div>
        {size === 'lg' || size === 'xl' ? (
          <div className="text-[9px] text-yellow-500/70 uppercase tracking-[0.2em] mt-0.5">
            Aposta com velocidade
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SonicLogo;
