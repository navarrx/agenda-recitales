import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import EventCard from '../components/events/EventCard';
import { useEventStore } from '../store/eventStore';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { events, loading, fetchEvents } = useEventStore();
  const [isVisible, setIsVisible] = useState(false);
  
  // Check if admin mode is enabled via URL parameter
  const params = new URLSearchParams(location.search);
  const isAdmin = params.get('admin') === 'true';
  
  useEffect(() => {
    // Redirect to admin if flag is set
    if (isAdmin) {
      navigate('/admin');
    }
    
    // Fetch events with filter for featured events
    fetchEvents();

    // Trigger animations after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAdmin, navigate, fetchEvents]);

  const featuredEvents = events.filter(event => event.is_featured).slice(0, 3);
  const upcomingEvents = events.filter(event => !event.is_featured).slice(0, 6);

  return (
    <Layout>
      {/* Hero Section with enhanced animation */}
      <section 
        className={`relative bg-[#101119] rounded-2xl overflow-hidden mb-16 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Video background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute min-w-full min-h-full object-cover blur-sm"
            style={{ transform: 'scale(1)' }}
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Background animated pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-repeat opacity-5" style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            animation: "moveBackground 30s linear infinite"
          }}></div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a48c4]/20 via-transparent to-[#1a48c4]/10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1a48c4]/10 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1a48c4]/10 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        {/* Content */}
        <div className="relative z-10 px-8 py-16 md:py-32 md:px-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Descubre los mejores eventos musicales
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed text-white/90">
              Encuentra recitales, conciertos y festivales en tu ciudad. 
              Filtra por género, fecha o lugar y nunca más te pierdas un show.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/events" 
                className="btn bg-[#1a48c4] text-white hover:bg-[#1a48c4]/90 group px-6 py-3 rounded-lg inline-flex items-center transition-all duration-300"
              >
                Ver todos los eventos
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section with staggered animation */}
      <section 
        className={`mb-16 transition-all duration-700 ease-out delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <span className="inline-block h-6 w-1.5 bg-[#1a48c4] rounded-full mr-4"></span>
            Eventos destacados
          </h2>
          <Link 
            to="/events" 
            className="text-white hover:text-[#1a48c4] inline-flex items-center group"
          >
            <span>Ver todos</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

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
              <div 
                key={event.id} 
                className="transition-all duration-700 ease-out" 
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              No hay eventos destacados disponibles en este momento.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Events Section */}
      <section 
        className={`transition-all duration-700 ease-out delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <span className="inline-block h-6 w-1.5 bg-[#1a48c4] rounded-full mr-4"></span>
            Próximos eventos
          </h2>
          <Link 
            to="/events" 
            className="text-white hover:text-[#1a48c4] inline-flex items-center group"
          >
            <span>Ver todos</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="transition-all duration-700 ease-out" 
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              No hay próximos eventos disponibles en este momento.
            </p>
          </div>
        )}
      </section>

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
      <section 
        className={`py-12 px-8 bg-[#101119] rounded-xl relative overflow-hidden transition-all duration-700 ease-out delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="relative max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Descarga nuestra app
              </h2>
              <p className="text-lg text-white/90 mb-6">
                Lleva Billboard contigo a todas partes. Descarga la app oficial y no te pierdas ningún evento.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.billboard.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <img 
                    src="/images/badges/google-play-badge-es.png" 
                    alt="Get it on Google Play" 
                    className="h-12"
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
                    className="h-12"
                  />
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <a 
                href="https://billboard.ar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img 
                  src="/images/logo_top.png" 
                  alt="Billboard App" 
                  className="max-w-[200px] md:max-w-[300px]"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section 
        className={`mt-20 py-12 px-8 bg-[#101119] rounded-xl relative overflow-hidden transition-all duration-700 ease-out delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a48c4]/20 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1a48c4]/20 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            No te pierdas ningún evento
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Suscríbete a nuestra newsletter y recibe notificaciones sobre los próximos eventos en tu ciudad.
          </p>
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
      </section>
    </Layout>
  );
};

export default HomePage; 