import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaBolt, FaGift, FaUsers, FaCoins } from 'react-icons/fa';

const SLIDES = [
  {
    id: 'welcome',
    title: 'BÔNUS DE',
    bigText: 'BOAS-VINDAS',
    subtitle: 'GANHE ATÉ',
    highlight: 'R$ 500',
    cta: 'CADASTRAR AGORA',
    ctaColor: 'from-emerald-400 to-green-600',
    bgGradient: 'from-emerald-900 via-green-700 to-teal-800',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    icon: FaGift,
    pattern: 'dots',
    badge: 'NOVO USUÁRIO',
    badgeColor: 'bg-emerald-400 text-emerald-950',
    link: 'register'
  },
  {
    id: 'cashback',
    title: 'CASHBACK',
    bigText: 'EM PERDAS',
    subtitle: 'RECEBA ATÉ',
    highlight: '30%',
    cta: 'VER DETALHES',
    ctaColor: 'from-amber-300 to-orange-500',
    bgGradient: 'from-orange-900 via-amber-700 to-yellow-700',
    glowColor: 'rgba(251, 146, 60, 0.6)',
    icon: FaCoins,
    pattern: 'coins',
    badge: 'DIÁRIO + SEMANAL',
    badgeColor: 'bg-amber-400 text-orange-950',
    link: '/promocoes'
  },
  {
    id: 'mega',
    title: 'MEGA',
    bigText: 'JACKPOT',
    subtitle: 'PRÊMIO ACUMULADO',
    highlight: 'R$ 1.2M',
    cta: 'JOGAR AGORA',
    ctaColor: 'from-pink-400 to-fuchsia-600',
    bgGradient: 'from-fuchsia-900 via-purple-700 to-violet-800',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    icon: FaBolt,
    pattern: 'sparkles',
    badge: 'AO VIVO',
    badgeColor: 'bg-pink-400 text-pink-950 animate-pulse',
    link: '/game/fortune-tiger'
  },
  {
    id: 'invite',
    title: 'CONVIDE',
    bigText: 'E LUCRE',
    subtitle: 'POR AMIGO CADASTRADO',
    highlight: 'R$ 50',
    cta: 'COMPARTILHAR',
    ctaColor: 'from-cyan-400 to-blue-600',
    bgGradient: 'from-blue-900 via-indigo-700 to-cyan-800',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    icon: FaUsers,
    pattern: 'circles',
    badge: 'SEM LIMITES',
    badgeColor: 'bg-cyan-400 text-blue-950',
    link: '/convidar'
  }
];

const PatternDots = () => (
  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
  </svg>
);

const PatternCoins = () => (
  <div className="absolute inset-0 overflow-hidden opacity-25">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-8 h-8 rounded-full bg-yellow-300 border-2 border-amber-500"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 360],
        }}
        transition={{
          duration: 3 + i * 0.3,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
);

const PatternSparkles = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-white text-xs"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      >
        ✦
      </motion.div>
    ))}
  </div>
);

const PatternCircles = () => (
  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
    <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="1" />
    <circle cx="50" cy="50" r="60" fill="none" stroke="white" strokeWidth="1" />
    <circle cx="50" cy="50" r="80" fill="none" stroke="white" strokeWidth="0.5" />
    <circle cx="350" cy="150" r="40" fill="none" stroke="white" strokeWidth="1" />
    <circle cx="350" cy="150" r="60" fill="none" stroke="white" strokeWidth="1" />
    <circle cx="350" cy="150" r="80" fill="none" stroke="white" strokeWidth="0.5" />
  </svg>
);

const Patterns = { dots: PatternDots, coins: PatternCoins, sparkles: PatternSparkles, circles: PatternCircles };

const HeroCarousel = ({ onSlideClick }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative mb-4" data-testid="hero-carousel">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((slide, idx) => {
            const Pattern = Patterns[slide.pattern];
            const Icon = slide.icon;
            return (
              <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
                <div
                  className={`relative h-40 sm:h-44 cursor-pointer overflow-hidden`}
                  onClick={() => onSlideClick && onSlideClick(slide)}
                  data-testid={`hero-slide-${slide.id}`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient}`} />

                  {/* Pattern overlay */}
                  <Pattern />

                  {/* Glow accent */}
                  <div
                    className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-50"
                    style={{ background: slide.glowColor }}
                  />
                  <div
                    className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full blur-3xl opacity-30"
                    style={{ background: slide.glowColor }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between px-5 py-4 z-10">
                    <div className="flex-1">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.5, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`inline-block ${slide.badgeColor} text-[10px] font-black px-2.5 py-1 rounded-full mb-2 tracking-wider`}
                      >
                        {slide.badge}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.3, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-white/70 text-[11px] font-bold tracking-wider"
                      >
                        {slide.subtitle}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.5, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-white text-[34px] font-black leading-[0.95] tracking-tight"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {slide.title}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.5, scale: 1 }}
                        transition={{ delay: 0.25, type: 'spring' }}
                        className="text-white text-[34px] font-black leading-[0.95] tracking-tight mb-1"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {slide.bigText}
                      </motion.div>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.3, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-2 bg-gradient-to-r ${slide.ctaColor} text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg`}
                      >
                        {slide.cta} →
                      </motion.button>
                    </div>

                    {/* Right side: highlight + icon */}
                    <div className="flex flex-col items-center gap-2 ml-2">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: selectedIndex === idx ? 1 : 0.7, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-white/30 blur-xl rounded-full"></div>
                        <div
                          className="relative w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border-2 border-white/30"
                        >
                          <Icon className="text-white text-3xl drop-shadow-lg" />
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: selectedIndex === idx ? 1 : 0.5, scale: 1 }}
                        transition={{ delay: 0.35, type: 'spring' }}
                        className="text-white text-2xl font-black leading-none drop-shadow-lg"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {slide.highlight}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side navigation arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-all z-20"
        data-testid="carousel-prev"
        aria-label="Anterior"
      >
        <FaChevronLeft className="text-xs" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-all z-20"
        data-testid="carousel-next"
        aria-label="Próximo"
      >
        <FaChevronRight className="text-xs" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className={`h-1.5 rounded-full transition-all ${
              selectedIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
            data-testid={`carousel-dot-${idx}`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
