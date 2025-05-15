import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Layout from '../../components/layout/Layout';
import { useEventStore } from '../../store/eventStore';
import EventMap from '../../components/maps/EventMap';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { event, loading, fetchEvent } = useEventStore();

  useEffect(() => {
    if (id) {
      fetchEvent(parseInt(id, 10));
    }
  }, [id, fetchEvent]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Evento no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El evento que estás buscando no existe o ha sido eliminado.
          </p>
          <Link
            to="/events"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Volver a eventos
          </Link>
        </div>
      </Layout>
    );
  }

  const formattedDate = format(new Date(event.date), 'dd MMMM yyyy - HH:mm', { locale: es });

  return (
    <Layout>
      <div className="mb-4">
        <Link
          to="/events"
          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver a eventos
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 bg-primary-600 text-white px-4 py-2 text-sm font-semibold">
            {event.genre}
          </div>
          {event.is_featured && (
            <div className="absolute top-0 right-0 bg-secondary-600 text-white px-4 py-2 text-sm font-semibold">
              Destacado
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {event.artist}
              </h1>
              <h2 className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                {event.name}
              </h2>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg">{formattedDate}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">{event.venue}, {event.city}</span>
              </div>
            </div>
            
            {event.ticket_url && (
              <div className="md:self-center mt-2 md:mt-0 w-full md:w-auto">
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full md:w-auto px-6 py-3 bg-secondary-600 text-white text-center rounded-md hover:bg-secondary-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                    Comprar entradas
                  </span>
                </a>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Descripción
            </h3>
            <div className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
              <p>{event.description}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ubicación
            </h3>
            <EventMap 
              address={event.location} 
              venueName={event.venue} 
              city={event.city}
              latitude={event.latitude}
              longitude={event.longitude}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 flex flex-wrap gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-4 py-3 flex-grow">
              <h4 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Artista</h4>
              <p className="text-gray-800 dark:text-gray-200">{event.artist}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-4 py-3 flex-grow">
              <h4 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Género</h4>
              <p className="text-gray-800 dark:text-gray-200">{event.genre}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-4 py-3 flex-grow">
              <h4 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Ciudad</h4>
              <p className="text-gray-800 dark:text-gray-200">{event.city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir este evento
        </h3>
        <div className="flex flex-wrap gap-4">
          <a 
            href={`https://wa.me/?text=${encodeURIComponent(`¡Mira este evento! ${event.artist} - ${event.name} en ${event.venue}, ${event.city}. ${window.location.href}`)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            <span className="mr-2">WhatsApp</span>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004c-1.73 0-3.434-.47-4.915-1.353l-.353-.21-3.655.958 1.002-3.648-.233-.374a9.842 9.842 0 01-1.495-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.837 9.837 0 012.893 6.994c-.003 5.45-4.437 9.88-9.883 9.88M20.846 3.116A11.783 11.783 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.1.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.89 11.89 0 005.683 1.448h.005c6.55 0 11.89-5.335 11.892-11.893a11.821 11.821 0 00-3.095-8.786" />
            </svg>
          </a>
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Mira este evento! ${event.artist} - ${event.name} en ${event.venue}, ${event.city}`)}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors"
          >
            <span className="mr-2">Twitter</span>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
            </svg>
          </a>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">Facebook</span>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage; 