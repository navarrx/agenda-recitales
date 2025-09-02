import { useEffect, useState, useRef, useCallback } from 'react';
import { useEventStore } from '../../store/eventStore';
import EventCard from './EventCard';
import EventListItem from './EventListItem';
import EventFilters from './EventFilters';
import { AnimatePresence, motion } from 'framer-motion';

function getTodayISO() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

const EventList = () => {
  const { 
    events, 
    loading, 
    hasMore, 
    totalEvents,
    fetchEvents, 
    setFilters, 
    loadMoreEvents,
    filters
  } = useEventStore();

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Callback para cargar más eventos
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMoreEvents();
    }
  }, [loading, hasMore, loadMoreEvents]);

  // Configurar Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '100px', // Cargar cuando esté a 100px del final
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, handleLoadMore]);

  // Re-observar el elemento cuando cambie la lista
  useEffect(() => {
    if (observerRef.current && loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
  }, [events]);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (filters: any) => {
    setFilters(filters);
  };

  return (
    <div>
      <EventFilters 
        onFilterChange={handleFilterChange} 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {events.length > 0 ? (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-4">
              <EventListItem isHeader />
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    <EventListItem event={event} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          
          {/* Indicador de carga para scroll infinito */}
          {hasMore && (
            <motion.div
              ref={loadingRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex justify-center items-center py-4"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  <span className="text-white/70 text-sm">Cargando más eventos...</span>
                </div>
              ) : (
                <div className="h-6" /> // Espacio invisible para trigger del observer
              )}
            </motion.div>
          )}

          {/* Mensaje cuando no hay más eventos */}
          {!hasMore && events.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center py-4"
            >
              <p className="text-white/60 text-sm">
                Has visto todos los eventos disponibles
              </p>
            </motion.div>
          )}
        </>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a48c4]"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-[#101119] rounded-lg shadow-md p-8 text-center border border-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-white/40 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-white/80">
            Intenta cambiar los filtros o vuelve más tarde.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default EventList; 