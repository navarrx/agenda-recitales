import { EventRequest } from '../../types';

interface EventRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventRequest: EventRequest | null;
  onStatusChange: (id: number, status: string) => Promise<void>;
  actionLoading: boolean;
}

const EventRequestDetailModal = ({ 
  isOpen, 
  onClose, 
  eventRequest, 
  onStatusChange,
  actionLoading 
}: EventRequestDetailModalProps) => {
  if (!isOpen || !eventRequest) return null;

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    discarded: 'Descartado',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-green-500/20 text-green-400',
    discarded: 'bg-red-500/20 text-red-400',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'No especificado';
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
      return 'No especificado';
    }
  };

  const handleStatusChange = async (status: string) => {
    await onStatusChange(eventRequest.id, status);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#101119] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {eventRequest.event_name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>Solicitado por: {eventRequest.name}</span>
                <span>•</span>
                <span>{formatDate(eventRequest.created_at)}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del evento */}
            <div className="space-y-6">
              {/* Estado actual */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Estado de la solicitud</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[eventRequest.status]}`}>
                    {statusLabels[eventRequest.status]}
                  </span>
                  {eventRequest.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        onClick={() => handleStatusChange('accepted')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Guardando...' : 'Aceptar'}
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        onClick={() => handleStatusChange('discarded')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Guardando...' : 'Rechazar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del evento */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Detalles del evento</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-white/60">Artista/Banda</label>
                    <p className="text-white font-medium">{eventRequest.artist}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Fecha del evento</label>
                    <p className="text-white font-medium">{formatDateOnly(eventRequest.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Hora del evento</label>
                    <p className="text-white font-medium">{formatTimeOnly(eventRequest.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Lugar</label>
                    <p className="text-white font-medium">{eventRequest.venue}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Ciudad</label>
                    <p className="text-white font-medium">{eventRequest.city}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Link de entradas</label>
                    <a 
                      href={eventRequest.ticket_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#1a48c4] hover:text-[#1a48c4]/80 underline break-all"
                    >
                      {eventRequest.ticket_url}
                    </a>
                  </div>
                </div>
              </div>

              {/* Información del solicitante */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Información del solicitante</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-white/60">Nombre</label>
                    <p className="text-white font-medium">{eventRequest.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Email</label>
                    <p className="text-white font-medium">{eventRequest.email}</p>
                  </div>
                  {eventRequest.message && (
                    <div>
                      <label className="text-sm text-white/60">Mensaje adicional</label>
                      <p className="text-white/80 bg-white/5 p-3 rounded-lg mt-1">
                        {eventRequest.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Imagen del evento */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Imagen del evento</h3>
                {eventRequest.image_url ? (
                  <div className="relative">
                    <img 
                      src={eventRequest.image_url} 
                      alt={`Imagen de ${eventRequest.event_name}`}
                      className="w-full h-64 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <div className="text-4xl mb-2">📸</div>
                        <p>Imagen no disponible</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Imagen subida por el solicitante
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <div className="text-4xl mb-2">📸</div>
                      <p>No se subió imagen</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Información adicional */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Información adicional</h3>
                <div className="space-y-2 text-sm text-white/60">
                  <div>
                    <span className="font-medium">ID de solicitud:</span> {eventRequest.id}
                  </div>
                  <div>
                    <span className="font-medium">Creado:</span> {formatDate(eventRequest.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span> {formatDate(eventRequest.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cerrar
            </button>
            {eventRequest.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => handleStatusChange('accepted')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Guardando...' : 'Aceptar solicitud'}
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => handleStatusChange('discarded')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Guardando...' : 'Rechazar solicitud'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRequestDetailModal; 