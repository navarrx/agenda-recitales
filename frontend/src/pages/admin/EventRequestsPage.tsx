import { useEffect, useState } from 'react';
import { getEventRequests, updateEventRequestStatus } from '../../services/api';
import { EventRequest } from '../../types';
import Layout from '../../components/layout/Layout';
import { PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import EventRequestDetailModal from '../../components/modals/EventRequestDetailModal';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  discarded: 'Descartado',
};

const EventRequestsPage = () => {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'discarded'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'accepted' | 'discarded' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await getEventRequests(status);
      setRequests(data);
    } catch (err) {
      setError('Error al cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleStatusChange = async (id: number, status: string) => {
    setActionLoading(id);
    try {
      await updateEventRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      // Actualizar también la solicitud seleccionada si está abierta
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status });
      }
    } catch (err) {
      alert('Error al actualizar el estado.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (id: number, currentStatus: string) => {
    setEditingId(id);
    setNewStatus(currentStatus as 'pending' | 'accepted' | 'discarded');
  };

  const handleEditSave = async (id: number) => {
    if (!newStatus) return;
    await handleStatusChange(id, newStatus);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setNewStatus(null);
  };

  const handleRowClick = (request: EventRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Si la hora es 00:00, significa que no se especificó hora
      if (hours === 0 && minutes === 0) {
        return 'Sin hora';
      }
      
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center text-[#1a48c4] hover:text-[#1a48c4]/80 transition-colors duration-200 group"
        >
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
          Volver al panel
        </Link>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Solicitudes de nuevos eventos</h1>
        <div className="flex gap-2 overflow-x-auto">
          <button
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-[#1a48c4] text-white' : 'bg-white/10 text-white/80'} transition whitespace-nowrap`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white/80'} transition whitespace-nowrap`}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'accepted' ? 'bg-green-600 text-white' : 'bg-white/10 text-white/80'} transition whitespace-nowrap`}
            onClick={() => setFilter('accepted')}
          >
            Aceptados
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'discarded' ? 'bg-red-600 text-white' : 'bg-white/10 text-white/80'} transition whitespace-nowrap`}
            onClick={() => setFilter('discarded')}
          >
            Rechazados
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 px-4 py-3 rounded mb-4">{error}</div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a48c4]"></div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-[#101119] rounded-lg shadow-md overflow-x-auto border border-white/10">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#101119]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Artista</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Lugar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-[#101119] divide-y divide-white/10">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-white/60 text-lg">
                      No hay solicitudes para mostrar.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr 
                      key={req.id} 
                      className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleRowClick(req)}
                    >
                      <td className="px-4 py-3 text-white font-medium">{req.event_name}</td>
                      <td className="px-4 py-3 text-white/80">{req.artist}</td>
                      <td className="px-4 py-3 text-white/80">{formatDate(req.date)}</td>
                      <td className="px-4 py-3 text-white/80">{formatTime(req.date)}</td>
                      <td className="px-4 py-3 text-white/80">{req.venue}, {req.city}</td>
                      <td className="px-4 py-3 text-white/80">{req.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : req.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-1 bg-white/10 hover:bg-white/20 rounded"
                          title="Ver detalles"
                          onClick={() => handleRowClick(req)}
                        >
                          <EyeIcon className="h-5 w-5 text-white/80" />
                        </button>
                        {req.status === 'pending' && editingId !== req.id && (
                          <>
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              onClick={() => handleStatusChange(req.id, 'accepted')}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id ? 'Guardando...' : 'Aceptar'}
                            </button>
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                              onClick={() => handleStatusChange(req.id, 'discarded')}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id ? 'Guardando...' : 'Descartar'}
                            </button>
                          </>
                        )}
                        {(req.status === 'accepted' || req.status === 'discarded') && editingId !== req.id && (
                          <button
                            className="p-1 bg-white/10 hover:bg-white/20 rounded"
                            title="Editar estado"
                            onClick={() => handleEditClick(req.id, req.status)}
                          >
                            <PencilSquareIcon className="h-5 w-5 text-white/80" />
                          </button>
                        )}
                        {editingId === req.id && (
                          <div className="flex items-center gap-2">
                            <select
                              className="px-2 py-1 rounded bg-[#101119] text-white border border-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a48c4]"
                              value={newStatus || req.status}
                              onChange={e => setNewStatus(e.target.value as 'pending' | 'accepted' | 'discarded')}
                            >
                              <option value="pending">Pendiente</option>
                              <option value="accepted">Aceptado</option>
                              <option value="discarded">Rechazado</option>
                            </select>
                            <button
                              className="px-2 py-1 bg-[#1a48c4] text-white rounded hover:bg-[#1a48c4]/90 text-xs"
                              onClick={() => handleEditSave(req.id)}
                              disabled={actionLoading === req.id}
                            >
                              Guardar
                            </button>
                            <button
                              className="px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 text-xs"
                              onClick={handleEditCancel}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-4">
            {requests.length === 0 ? (
              <div className="bg-[#101119] rounded-lg shadow-md border border-white/10 p-8 text-center text-white/60 text-lg">
                No hay solicitudes para mostrar.
              </div>
            ) : (
              requests.map((req) => (
                <div 
                  key={req.id} 
                  className="bg-[#101119] rounded-lg shadow-md border border-white/10 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white/5 transition-colors duration-200"
                  onClick={() => handleRowClick(req)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs text-white/50 uppercase mb-1">Evento</div>
                      <div className="text-base font-bold text-white break-words mb-1">{req.event_name}</div>
                      <div className="text-xs text-white/50 uppercase mb-1">Artista</div>
                      <div className="text-sm text-white/80 break-words mb-1">{req.artist}</div>
                      <div className="text-xs text-white/50 uppercase mb-1">Fecha y Hora</div>
                      <div className="text-sm text-white/80 mb-1">
                        {formatDate(req.date)} {formatTime(req.date) !== 'Sin hora' && `• ${formatTime(req.date)}`}
                      </div>
                      <div className="text-xs text-white/50 uppercase mb-1">Estado</div>
                      <div className="mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : req.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </div>
                    </div>
                    <button
                      className="p-2 bg-white/10 hover:bg-white/20 rounded ml-2"
                      title="Ver detalles"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(req);
                      }}
                    >
                      <EyeIcon className="h-5 w-5 text-white/80" />
                    </button>
                  </div>
                  <div className="text-xs text-white/50 uppercase mb-1">Acciones</div>
                  <div className="flex gap-2 mb-1 flex-wrap" onClick={e => e.stopPropagation()}>
                    {req.status === 'pending' && editingId !== req.id && (
                      <>
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          onClick={() => handleStatusChange(req.id, 'accepted')}
                          disabled={actionLoading === req.id}
                        >
                          {actionLoading === req.id ? 'Guardando...' : 'Aceptar'}
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          onClick={() => handleStatusChange(req.id, 'discarded')}
                          disabled={actionLoading === req.id}
                        >
                          {actionLoading === req.id ? 'Guardando...' : 'Rechazar'}
                        </button>
                      </>
                    )}
                    {(req.status === 'accepted' || req.status === 'discarded') && editingId !== req.id && (
                      <button
                        className="p-1 bg-white/10 hover:bg-white/20 rounded"
                        title="Editar estado"
                        onClick={() => handleEditClick(req.id, req.status)}
                      >
                        <PencilSquareIcon className="h-5 w-5 text-white/80" />
                      </button>
                    )}
                    {editingId === req.id && (
                      <div className="flex items-center gap-2">
                        <select
                          className="px-2 py-1 rounded bg-[#101119] text-white border border-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a48c4]"
                          value={newStatus || req.status}
                          onChange={e => setNewStatus(e.target.value as 'pending' | 'accepted' | 'discarded')}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="accepted">Aceptado</option>
                          <option value="discarded">Rechazado</option>
                        </select>
                        <button
                          className="px-2 py-1 bg-[#1a48c4] text-white rounded hover:bg-[#1a48c4]/90 text-xs"
                          onClick={() => handleEditSave(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          Guardar
                        </button>
                        <button
                          className="px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 text-xs"
                          onClick={handleEditCancel}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal de detalles */}
      <EventRequestDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        eventRequest={selectedRequest}
        onStatusChange={handleStatusChange}
        actionLoading={actionLoading !== null}
      />
    </Layout>
  );
};

export default EventRequestsPage; 