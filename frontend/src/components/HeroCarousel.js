import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SLIDES = [
  {
    id: 1,
    image: '/banners/banner1.jpg',
    link: '/game/fortune-rabbit'
  },
  {
    id: 2,
    image: '/banners/banner2.jpg',
    link: '/promocoes'
  },
  {
    id: 3,
    image: '/banners/banner3.jpg',
    link: '/game/fortune-tiger'
  },
  {
    id: 4,
    image: '/banners/banner4.jpg',
    link: '/cassino'
  },
  {
    id: 5,
    image: '/banners/banner5.jpg',
    link: '/vip'
  }
];

const HeroCarousel = ({ onSlideClick }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(
        emblaApi.selectedScrollSnap()
      );
    };

    emblaApi.on('select', onSelect);

    onSelect();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);

    return () => clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <div
      className="relative mb-4"
      data-testid="hero-carousel"
    >
      <div
        className="overflow-hidden rounded-2xl"
        ref={emblaRef}
      >
        <div className="flex">
          {SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0"
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="relative h-[180px] cursor-pointer overflow-hidden rounded-2xl"
                onClick={() =>
                  onSlideClick &&
                  onSlideClick(slide)
                }
              >
                <img
                  src={slide.image}
                  alt="banner"
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" />

                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <div className="text-white text-sm font-bold">
                      SONIC BET
                    </div>

                    <div className="text-yellow-400 text-xs font-medium">
                      Clique para jogar
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() =>
              emblaApi &&
              emblaApi.scrollTo(idx)
            }
            className={`transition-all rounded-full ${
              selectedIndex === idx
                ? 'w-6 h-2 bg-yellow-400'
                : 'w-2 h-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
