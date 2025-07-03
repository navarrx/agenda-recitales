import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvents, deleteEvent, deleteEventsBulk } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../types';

const AdminPage = () => {
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const eventsPerPage = 10;

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents({}, { skip: 0, limit: 100 });
        setAdminEvents(response.items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Error al cargar los eventos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

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
      setSelectedEvents(currentEvents.map(event => event.id));
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
        console.log('Attempting to delete events:', selectedEvents);
        const result = await deleteEventsBulk(selectedEvents);
        console.log('Delete result:', result);
        
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

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = adminEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(adminEvents.length / eventsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">
          Panel de Administración
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Link
            to="/admin/event-requests"
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-all duration-300 text-center"
          >
            Solicitudes de eventos
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
          <Link
            to="/admin/events/new"
            className="px-4 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 transition-all duration-300 text-center"
          >
            Nuevo Evento
          </Link>
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
                <thead className="bg-[#101119]">
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
                    <tr key={event.id} className="hover:bg-white/5 transition-colors duration-200">
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
                        <div className="text-sm font-medium text-white">
                          {event.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {event.artist}
                        </div>
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="px-2 py-1 bg-[#1a48c4] text-white rounded hover:bg-[#1a48c4]/90 text-xs"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                          disabled={isDeleting}
                        >
                          Eliminar
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${currentPage === page ? 'bg-[#1a48c4] text-white' : 'bg-white/10 text-white/70 hover:bg-[#1a48c4]/30'}`}
              >
                {page}
              </button>
            ))}
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
            No se encontraron eventos
          </h3>
          <p className="text-white/80">
            Intenta cambiar los filtros o vuelve más tarde.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default AdminPage; 