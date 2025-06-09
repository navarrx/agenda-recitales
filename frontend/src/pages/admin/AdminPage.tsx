import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvents, deleteEvent } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../types';

const AdminPage = () => {
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          Panel de Administración
        </h1>
        <Link
          to="/admin/events/new"
          className="px-4 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 transition-all duration-300"
        >
          Nuevo Evento
        </Link>
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
          <div className="bg-[#101119] rounded-lg shadow-md overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#101119]">
                  <tr>
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
                        <div className="text-sm font-medium text-white">
                          {event.name}
                        </div>
                        <div className="text-sm text-white/60">
                          {event.genre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {event.artist}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {format(new Date(event.date), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-sm text-white/60">
                          {format(new Date(event.date), 'HH:mm', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {event.venue}
                        </div>
                        <div className="text-sm text-white/60">
                          {event.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/events/${event.id}`}
                            className="text-[#1a48c4] hover:text-[#1a48c4]/80 transition-colors duration-200"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:text-white/40 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md mr-2 bg-[#101119] border border-white/20 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-1 rounded-md mx-1 transition-all duration-200 ${
                      currentPage === index + 1
                        ? 'bg-[#1a48c4] text-white'
                        : 'bg-[#101119] border border-white/20 text-white hover:bg-white/5'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md ml-2 bg-[#101119] border border-white/20 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#101119] rounded-lg shadow-md p-8 text-center border border-white/10">
          <h2 className="text-xl font-medium text-white mb-4">
            No hay eventos registrados
          </h2>
          <p className="text-white/60 mb-6">
            Comienza creando tu primer evento haciendo clic en el botón "Nuevo Evento".
          </p>
          <Link
            to="/admin/events/new"
            className="px-6 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 transition-all duration-300"
          >
            Crear evento
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default AdminPage; 