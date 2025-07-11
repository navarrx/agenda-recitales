import { useEffect, useState } from 'react';
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
          
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMoreEvents}
                disabled={loading}
                className="px-6 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 disabled:bg-white/20 transition-colors"
              >
                {loading ? 'Cargando...' : 'Cargar más eventos'}
              </button>
            </div>
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