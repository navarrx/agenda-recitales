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
        className={`relative bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl overflow-hidden mb-16 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Background animated pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-repeat opacity-10" style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            animation: "moveBackground 30s linear infinite"
          }}></div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"></div>
        
        {/* Content */}
        <div className="relative z-10 px-8 py-16 md:py-32 md:px-16 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Descubre los mejores eventos musicales
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed text-white/90">
              Encuentra recitales, conciertos y festivales en tu ciudad. 
              Filtra por género, fecha o lugar y nunca más te pierdas un show.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/events" 
                className="btn btn-primary bg-white text-primary-600 hover:bg-white/90 hover:text-primary-700 group"
              >
                Ver todos los eventos
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-50 dark:from-neutral-900 to-transparent"></div>
      </section>

      {/* Featured Events Section with staggered animation */}
      <section 
        className={`mb-16 transition-all duration-700 ease-out delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white flex items-center">
            <span className="inline-block h-6 w-1.5 bg-primary-600 rounded-full mr-4"></span>
            Eventos destacados
          </h2>
          <Link 
            to="/events" 
            className="link inline-flex items-center group"
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
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white flex items-center">
            <span className="inline-block h-6 w-1.5 bg-secondary-600 rounded-full mr-4"></span>
            Próximos eventos
          </h2>
          <Link 
            to="/events" 
            className="link inline-flex items-center group"
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

      {/* Newsletter Section */}
      <section 
        className={`mt-20 py-12 px-8 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-xl relative overflow-hidden transition-all duration-700 ease-out delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-400/20 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/20 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            No te pierdas ningún evento
          </h2>
          <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-8">
            Suscríbete a nuestra newsletter y recibe notificaciones sobre los próximos eventos en tu ciudad.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              className="input flex-grow" 
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary"
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