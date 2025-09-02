import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getHeroEvents } from '../services/api';
import { HeroEvent } from '../types';
import { filterFutureEvents } from '../utils/eventUtils';

const HeroBanner = () => {
  const [heroEvents, setHeroEvents] = useState<HeroEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroEvents = async () => {
      try {
        setLoading(true);
        const events = await getHeroEvents();
        
        // Filtrar solo eventos futuros (fecha >= hoy)
        const futureEvents = events.filter(heroEvent => {
          if (!heroEvent.event?.date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eventDate = new Date(heroEvent.event.date);
          return eventDate >= today;
        });
        
        setHeroEvents(futureEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching hero events:', err);
        setError('Error al cargar eventos destacados');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroEvents();
  }, []);

  // Auto-rotate cada 5 segundos solo si hay eventos
  useEffect(() => {
    if (heroEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroEvents.length]);

  // Si está cargando, mostrar skeleton
  if (loading) {
    return (
      <section className="relative w-full overflow-hidden border border-white" style={{ height: '75vh' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </section>
    );
  }

  // Si hay error o no hay eventos, mostrar banner por defecto
  if (error || heroEvents.length === 0) {
    return (
      <section className="relative w-full overflow-hidden border border-white" style={{ height: '75vh' }}>
        {/* Banner por defecto */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Fechas</h1>
            <p className="text-xl">Los mejores eventos en un solo lugar</p>
          </div>
        </div>
      </section>
    );
  }

  const currentEvent = heroEvents[currentIndex];

  // Verificar que el evento actual tenga la información necesaria
  if (!currentEvent || !currentEvent.event) {
    return (
      <section className="relative w-full overflow-hidden border border-white" style={{ height: '75vh' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Fechas</h1>
            <p className="text-xl">Los mejores eventos en un solo lugar</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden border border-white" style={{ height: '75vh' }}>
      {/* Background con overlay dinámico */}
      <div className="absolute inset-0 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full"
          >
            <img
              src={currentEvent.hero_image_url}
              alt={currentEvent.event.name || 'Evento destacado'}
              className="w-full h-full object-cover"
            />
            {/* Overlay sutil para mejor legibilidad */}
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* "Show Destacado" - Esquina superior derecha */}
      <div className="absolute top-6 right-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
        >
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-white/90 text-sm font-medium">Show Destacado</span>
        </motion.div>
      </div>

      {/* Información del evento - Lado izquierdo */}
      <div className="absolute left-6 top-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`left-info-${currentIndex}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            {(() => {
              const title = currentEvent.event.name || '';
              return title ? (
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {title}
                </h1>
              ) : null;
            })()}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
              {currentEvent.event.artist}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Información inferior - Lado izquierdo */}
      <div className="absolute left-6 bottom-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`bottom-info-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-left"
          >
            <p className="text-lg md:text-xl text-white/90 mb-1 drop-shadow-lg">
              {currentEvent.event.venue}
            </p>
            <p className="text-base md:text-lg text-white/80 mb-3 drop-shadow-lg">
              {new Date(currentEvent.event.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <Link
              to={`/events/${currentEvent.event.id}`}
              className="inline-flex items-center text-white hover:text-white/80 transition-colors text-lg font-medium"
            >
              <span>Ver más</span>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </motion.svg>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores de navegación */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        {heroEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white scale-110'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
