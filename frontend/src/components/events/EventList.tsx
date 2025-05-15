import { useEffect } from 'react';
import { useEventStore } from '../../store/eventStore';
import EventCard from './EventCard';
import EventFilters from './EventFilters';

const EventList = () => {
  const { 
    events, 
    loading, 
    hasMore, 
    totalEvents,
    fetchEvents, 
    setFilters, 
    loadMoreEvents 
  } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (filters: any) => {
    setFilters(filters);
    fetchEvents();
  };

  return (
    <div>
      <EventFilters onFilterChange={handleFilterChange} />
      
      {events.length > 0 ? (
        <>
          <div className="text-gray-700 dark:text-gray-300 mb-4">
            Mostrando {events.length} de {totalEvents} eventos
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMoreEvents}
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Cargando...' : 'Cargar más eventos'}
              </button>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
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
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron eventos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta cambiar los filtros o vuelve más tarde.
          </p>
        </div>
      )}
    </div>
  );
};

export default EventList; 