import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import EventCard from '../components/events/EventCard';
import { useEventStore } from '../store/eventStore';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionValueEvent } from 'framer-motion';
import '../styles/HomePage.css';
import EventCarousel from '../components/events/EventCarousel';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { events, loading, fetchEvents } = useEventStore();
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Advanced parallax effects
  const videoY = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scale = useSpring(1, { stiffness: 100, damping: 30 });
  
  // Mouse movement effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check if admin mode is enabled via URL parameter
  const params = new URLSearchParams(location.search);
  const isAdmin = params.get('admin') === 'true';
  
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
    fetchEvents();
  }, [isAdmin, navigate, fetchEvents]);

  const featuredEvents = events.filter(event => event.is_featured).slice(0, 3);
  const upcomingEvents = events.filter(event => !event.is_featured).slice(0, 6);

  return (
    <Layout>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* Hero Section with Experimental Design */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Video and overlays are now clipped together */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Video background with advanced effects */}
            <motion.div 
              className="absolute inset-0 overflow-hidden"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute w-full h-full max-h-[35vh] sm:max-h-[60vh] object-cover"
                style={{ 
                  transform: `scale(1.2) rotate(${useTransform(mouseX, [-1, 1], [-1, 1])}deg)`,
                  filter: 'blur(8px) brightness(0.7)',
                }}
              >
                <source src="/videos/hero-background.mp4" type="video/mp4" />
              </video>
            </motion.div>
            {/* Subtle black overlay for text contrast */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          </div>

          {/* Interactive floating elements - Removed for cleaner look */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-white/5 rounded-full"
                style={{
                  width: Math.random() * 300 + 50,
                  height: Math.random() * 300 + 50,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  x: useTransform(mouseX, [-1, 1], [-20, 20]),
                  y: useTransform(mouseY, [-1, 1], [-20, 20]),
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Floating Plus Signs */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(120)].map((_, i) => (
              <motion.div
                key={`plus-${i}`}
                className="absolute text-white/40 text-xl md:text-3xl lg:text-4xl font-bold"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 100 - 50, 0],
                  y: [0, Math.random() * 100 - 50, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 12 + Math.random() * 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 3,
                }}
              >
                +
              </motion.div>
            ))}
          </div>

          {/* Main content with 3D effect */}
          <motion.div 
            style={{ y: contentY }}
            className="relative z-10 px-4 py-10 sm:px-6 sm:py-16 md:py-32 md:px-16 max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto"
          >
            <motion.div
              style={{
                x: useTransform(mouseX, [-1, 1], [-20, 20]),
                y: useTransform(mouseY, [-1, 1], [-20, 20]),
                rotateX: useTransform(mouseY, [-1, 1], [5, -5]),
                rotateY: useTransform(mouseX, [-1, 1], [-5, 5]),
              }}
              className="perspective-1000 bg-black/10 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight text-white"
              >
                Descubre las mejores fechas musicales
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed text-white/80"
              >
                Encuentra recitales, conciertos y festivales en tu ciudad. 
                Filtra por género, fecha o lugar y nunca más te pierdas un show.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <Link 
                  to="/events" 
                  className="group relative overflow-hidden bg-[#1a48c4] text-white px-8 py-4 rounded-full inline-flex items-center text-lg font-medium hover:bg-[#1a48c4]/90 transition-colors"
                >
                  <span className="relative z-10">Explorar Fechas</span>
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 ml-3 relative z-10"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </motion.svg>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-3 bg-white/50 rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Featured Events Section with 3D Cards */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-20 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Fechas destacadas
              </h2>
              <div className="w-24 h-1 bg-[#1a48c4] mx-auto rounded-full" />
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-pulse-slow flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredEvents.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      rotateX: 5,
                    }}
                    className="transform-gpu perspective-1000"
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-8 text-center"
              >
                <p className="text-white/70">
                  No hay fechas destacadas disponibles en este momento.
                </p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Upcoming Events Section with Carousel */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-20 relative w-full"
        >
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16 px-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">
                    Próximos
                  </h2>
                  <div className="w-24 h-1 bg-[#1a48c4] mt-4" />
                </div>
                <Link 
                  to="/events" 
                  className="text-white/80 hover:text-white text-lg font-medium transition-colors"
                >
                  Ver más →
                </Link>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-pulse-slow flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <EventCarousel events={upcomingEvents} />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-8 text-center mx-8"
              >
                <p className="text-white/70">
                  No hay fechas próximas disponibles en este momento.
                </p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Visual Divider */}
        <div className="relative my-20">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#101119] px-4 text-white/50 text-sm">También disponible en</span>
          </div>
        </div>

        {/* App Download Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-8 px-4 sm:px-8 bg-[#101119] rounded-xl relative overflow-hidden"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 w-full text-center md:text-left">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-bold text-white mb-4"
                >
                  Descarga nuestra app
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-lg text-white/90 mb-6"
                >
                  Lleva Billboard contigo a todas partes. Descarga la app oficial y no te pierdas ningún evento.
                </motion.p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center md:items-start w-full">
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.billboard.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                  >
                    <img 
                      src="/images/badges/google-play-badge-es.png" 
                      alt="Get it on Google Play" 
                      className="h-12 max-w-[160px] w-auto"
                    />
                  </a>
                  <a 
                    href="https://apps.apple.com/app/billboard/id123456789" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                  >
                    <img 
                      src="/images/badges/app-store-badge-es.svg" 
                      alt="Download on the App Store" 
                      className="h-12 max-w-[160px] w-auto"
                    />
                  </a>
                </div>
              </div>
              <div className="flex-1 flex justify-center mt-8 md:mt-0 w-full">
                <motion.a 
                  href="https://billboard.ar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <motion.img 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    src="/images/logo_top.png" 
                    alt="Billboard App" 
                    className="max-w-[160px] md:max-w-[200px] w-full"
                  />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 py-12 px-8 bg-[#101119] rounded-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a48c4]/20 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1a48c4]/20 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative max-w-2xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-white mb-4"
            >
              No te pierdas ningún evento
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-lg text-white/90 mb-8"
            >
              Suscríbete a nuestra newsletter y recibe notificaciones sobre los próximas fechas en tu ciudad.
            </motion.p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="input flex-grow bg-white/10 text-white placeholder-white/50 border-white/20" 
                required
              />
              <button 
                type="submit" 
                className="btn bg-[#1a48c4] text-white hover:bg-[#1a48c4]/90"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
};

export default HomePage; 