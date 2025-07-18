import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvents, deleteEvent, deleteEventsBulk } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../types';
import { Star, Edit2, Trash2 } from 'lucide-react';

const PastEventsPage = () => {
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const eventsPerPage = 10;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const skip = (currentPage - 1) * eventsPerPage;
        // Forzar show_past=true
        const response = await getEvents({}, { skip, limit: eventsPerPage, show_past: true });
        // Filtrar solo eventos anteriores a hoy
        const today = new Date();
        const pastEvents = response.items.filter((event: Event) => new Date(event.date) < today);
        setAdminEvents(pastEvents);
        // Calcular el total real de eventos pasados
        if (currentPage === 1) {
          // Para la primera página, estimar el total real
          const allPastEvents = [
            ...pastEvents
          ];
          let nextSkip = skip + eventsPerPage;
          let keepFetching = pastEvents.length === eventsPerPage;
          while (keepFetching) {
            // eslint-disable-next-line no-await-in-loop
            const nextResponse = await getEvents({}, { skip: nextSkip, limit: eventsPerPage, show_past: true });
            const nextPast = nextResponse.items.filter((event: Event) => new Date(event.date) < today);
            allPastEvents.push(...nextPast);
            nextSkip += eventsPerPage;
            keepFetching = nextPast.length === eventsPerPage;
          }
          setTotalEvents(allPastEvents.length);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Error al cargar los eventos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentPage]);

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
      try {
        setIsDeleting(true);
        await deleteEvent(id);
        setAdminEvents(adminEvents.filter(event => event.id !== id));
        setIsDeleting(false);
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Error al eliminar el evento. Por favor, intenta de nuevo más tarde.');
        setIsDeleting(false);
      }
    }
  };

  const handleSelectEvent = (eventId: number) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(adminEvents.map(event => event.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.length === 0) return;

    const confirmMessage = selectedEvents.length === adminEvents.length
      ? '¿Estás seguro de que deseas eliminar TODOS los eventos? Esta acción no se puede deshacer.'
      : `¿Estás seguro de que deseas eliminar ${selectedEvents.length} eventos? Esta acción no se puede deshacer.`;

    if (window.confirm(confirmMessage)) {
      try {
        setIsDeleting(true);
        const result = await deleteEventsBulk(selectedEvents);
        if (result.deleted_count > 0) {
          setAdminEvents(adminEvents.filter(event => !selectedEvents.includes(event.id)));
          setSelectedEvents([]);
          setSelectAll(false);
        } else {
          setError('No se pudieron eliminar los eventos. Por favor, intenta de nuevo.');
        }
      } catch (err) {
        console.error('Error deleting events:', err);
        setError('Error al eliminar los eventos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const currentEvents = adminEvents;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">
          Eventos pasados
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-center">
          <Link
            to="/admin"
            className="flex items-center gap-1 text-white/60 hover:text-[#1a48c4] transition-colors text-sm px-2 py-2 rounded-md"
            style={{ minWidth: 0 }}
          >
            Volver a eventos
          </Link>
          {selectedEvents.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {isDeleting ? 'Eliminando...' : `Eliminar ${selectedEvents.length} eventos`}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a48c4]"></div>
        </div>
      ) : adminEvents.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-[#101119] rounded-lg shadow-md overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-gradient-to-r from-[#1a48c4]/30 via-[#101119] to-[#101119]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-[#1a48c4] focus:ring-[#1a48c4] border-white/20 rounded"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Artista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Lugar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#101119] divide-y divide-white/10">
                  {currentEvents.map((event) => (
                    <tr key={event.id} className={`group transition-colors duration-200 ${event.is_featured ? 'bg-gradient-to-r from-yellow-900/30 via-[#101119] to-[#101119]' : 'hover:bg-white/10 bg-[#101119]'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => handleSelectEvent(event.id)}
                            className="h-4 w-4 text-[#1a48c4] focus:ring-[#1a48c4] border-white/20 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.name} className="w-10 h-10 rounded object-cover border border-white/10 shadow" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-white/30 text-lg">🎵</div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white flex items-center gap-1">
                              {event.name}
                              {event.is_featured && <Star className="w-4 h-4 text-yellow-400 ml-1" title="Destacado" />}
                            </div>
                            <div className="text-xs text-white/50">ID: {event.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {event.artist}
                        </div>
                        {event.genre && <div className="text-xs text-yellow-300 mt-1">{event.genre}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {format(new Date(event.date), 'dd MMM yyyy - HH:mm', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {event.venue}
                        </div>
                        <div className="text-xs text-white/40">{event.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="p-2 bg-[#1a48c4] text-white rounded-full hover:bg-[#1a48c4]/90 text-xs flex items-center justify-center"
                          title="Editar evento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs flex items-center justify-center"
                          disabled={isDeleting}
                          title="Eliminar evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-4">
            {currentEvents.map((event) => (
              <div key={event.id} className="bg-[#101119] rounded-lg shadow-md border border-white/10 p-4 flex flex-col gap-2 relative">
                <div className="absolute top-4 left-4">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => handleSelectEvent(event.id)}
                    className="h-4 w-4 text-[#1a48c4] focus:ring-[#1a48c4] border-white/20 rounded"
                  />
                </div>
                <div className="pl-8">
                  <div className="text-xs text-white/50 uppercase mb-1">Evento</div>
                  <div className="text-base font-bold text-white break-words mb-1">{event.name}</div>
                  <div className="text-xs text-white/50 uppercase mb-1">Artista</div>
                  <div className="text-sm text-white/80 break-words mb-1">{event.artist}</div>
                  <div className="text-xs text-white/50 uppercase mb-1">Fecha</div>
                  <div className="text-sm text-white/80 mb-1">{format(new Date(event.date), 'dd MMM yyyy - HH:mm', { locale: es })}</div>
                  <div className="text-xs text-white/50 uppercase mb-1">Acciones</div>
                  <div className="flex gap-2 mb-1">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="px-3 py-1 bg-[#1a48c4] text-white rounded hover:bg-[#1a48c4]/90 text-xs"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      disabled={isDeleting}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {totalPages > 1 && (
              <>
                {/* Botón primera página */}
                {currentPage > 4 && (
                  <button
                    onClick={() => paginate(1)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 bg-white/10 text-white/70 hover:bg-[#1a48c4]/30`}
                  >
                    1
                  </button>
                )}
                {/* Elipsis izquierda */}
                {currentPage > 5 && (
                  <span className="px-2 py-1 text-white/40">...</span>
                )}
                {/* Páginas alrededor de la actual */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === currentPage ||
                    (page >= currentPage - 3 && page <= currentPage + 3)
                  )
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${currentPage === page ? 'bg-[#1a48c4] text-white' : 'bg-white/10 text-white/70 hover:bg-[#1a48c4]/30'}`}
                    >
                      {page}
                    </button>
                  ))}
                {/* Elipsis derecha */}
                {currentPage < totalPages - 4 && (
                  <span className="px-2 py-1 text-white/40">...</span>
                )}
                {/* Botón última página */}
                {currentPage < totalPages - 3 && (
                  <button
                    onClick={() => paginate(totalPages)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 bg-white/10 text-white/70 hover:bg-[#1a48c4]/30`}
                  >
                    {totalPages}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#101119] rounded-lg shadow-md p-8 text-center border border-white/10">
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
            No se encontraron eventos pasados
          </h3>
          <p className="text-white/80">
            Intenta cambiar los filtros o vuelve más tarde.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default PastEventsPage; 