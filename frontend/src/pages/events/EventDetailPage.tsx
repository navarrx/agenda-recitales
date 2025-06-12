import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
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

  const isEventPast = (date: string) => {
    return isPast(new Date(date));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/events"
            className="inline-flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Volver a eventos
          </Link>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Image */}
          <div className="lg:col-span-1">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-neutral-200/80 to-neutral-300/80 dark:from-neutral-700/80 dark:to-neutral-600/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Event details */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Event info */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {event.genre}
                  </span>
                  {event.is_featured && (
                    <span className="bg-secondary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Destacado
                    </span>
                  )}
                </div>

                <h1 className="text-5xl font-bold text-white mb-8">
                  {event.name}
                </h1>

                <div className="space-y-6">
                  <div className="flex items-center">
                    <span className="text-white/60 w-24">Artista:</span>
                    <span className="text-white text-xl">{event.artist}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-white/60 w-24">Fecha:</span>
                    <span className="text-white text-xl">{formattedDate}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-white/60 w-24">Ciudad:</span>
                    <span className="text-white text-xl">{event.city}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-white/60 w-24">Lugar:</span>
                    <span className="text-white text-xl">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Ticket button */}
              {event.ticket_url && (
                <div className="flex items-center gap-3">
                  {isEventPast(event.date) ? (
                    <div className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Evento finalizado</span>
                    </div>
                  ) : (
                    <>
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium transition duration-300 ease-out rounded-2xl shadow-md bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                      >
                        <span className="absolute inset-0 flex items-center justify-center w-full h-full text-gray-900 duration-300 -translate-x-full bg-gray-50 group-hover:translate-x-0 ease">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                          </svg>
                        </span>
                        <span className="absolute flex items-center justify-center w-full h-full transition-all duration-300 transform group-hover:translate-x-full ease">
                          Comprar entradas
                        </span>
                        <span className="relative invisible">Comprar entradas</span>
                      </a>
                      <span className="text-sm text-white/40 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        Redirección externa
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Share section */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/60">Compartir:</span>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Mira este evento! ${event.artist} - ${event.name} en ${event.venue}, ${event.city}`)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-blue-400 transition-colors"
                    aria-label="Compartir en Twitter"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                    </svg>
                  </a>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-blue-600 transition-colors"
                    aria-label="Compartir en Facebook"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`¡Mira este evento! ${event.artist} - ${event.name} en ${event.venue}, ${event.city}\n${window.location.href}`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-green-500 transition-colors"
                    aria-label="Compartir en WhatsApp"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        {event.description && (
          <div className="mt-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-md p-6">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Descripción
              </h3>
              <p className="text-white/80 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        )}

        {/* Map section - Centered below both columns */}
        <div className="mt-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-md p-6">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage; 