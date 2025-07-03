import { useState } from 'react';
import { createEventRequest } from '../../services/api';
import { sanitizeEventRequest, validateEmail, validateUrl, validateLength } from '../../utils/security';

interface EventRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventRequestModal = ({ isOpen, onClose }: EventRequestModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    eventName: '',
    artist: '',
    date: '',
    venue: '',
    city: '',
    ticketUrl: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Sanitizar y validar datos
      const { sanitized, errors } = sanitizeEventRequest(formData);
      
      if (errors.length > 0) {
        setError(errors.join('. '));
        setLoading(false);
        return;
      }
      
      // Convertir date a formato ISO completo
      const isoDate = sanitized.date ? `${sanitized.date}T00:00:00` : '';
      
      await createEventRequest({
        name: sanitized.name,
        email: sanitized.email,
        event_name: sanitized.eventName,
        artist: sanitized.artist,
        date: isoDate,
        venue: sanitized.venue,
        city: sanitized.city,
        ticket_url: sanitized.ticketUrl,
        message: sanitized.message,
      });
      
      alert('Gracias por tu solicitud. Nos pondremos en contacto contigo pronto.');
      onClose();
      setFormData({
        name: '',
        email: '',
        eventName: '',
        artist: '',
        date: '',
        venue: '',
        city: '',
        ticketUrl: '',
        message: ''
      });
      setFieldErrors({});
      setError(null);
    } catch (err: any) {
      setError('Ocurrió un error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (!validateLength(value, 100)) return 'El nombre no puede exceder 100 caracteres';
        break;
      case 'email':
        if (!value) return 'El email es requerido';
        if (!validateEmail(value)) return 'El email no tiene un formato válido';
        break;
      case 'eventName':
        if (!value || value.length < 2) return 'El nombre del evento debe tener al menos 2 caracteres';
        if (!validateLength(value, 200)) return 'El nombre del evento no puede exceder 200 caracteres';
        break;
      case 'artist':
        if (!value || value.length < 2) return 'El artista debe tener al menos 2 caracteres';
        if (!validateLength(value, 100)) return 'El artista no puede exceder 100 caracteres';
        break;
      case 'date':
        if (!value) return 'La fecha es requerida';
        const date = new Date(value);
        const now = new Date();
        if (date <= now) return 'La fecha debe ser futura';
        break;
      case 'venue':
        if (!value || value.length < 2) return 'El lugar debe tener al menos 2 caracteres';
        if (!validateLength(value, 200)) return 'El lugar no puede exceder 200 caracteres';
        break;
      case 'city':
        if (!value || value.length < 2) return 'La ciudad debe tener al menos 2 caracteres';
        if (!validateLength(value, 100)) return 'La ciudad no puede exceder 100 caracteres';
        break;
      case 'ticketUrl':
        if (!value) return 'La URL de entradas es requerida';
        if (!validateUrl(value)) return 'La URL de entradas no es válida';
        break;
      case 'message':
        if (value && !validateLength(value, 1000)) return 'El mensaje no puede exceder 1000 caracteres';
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Sanitizar el valor según el tipo de campo
    let sanitizedValue = value;
    
    switch (name) {
      case 'email':
        // Para email, solo remover espacios y convertir a minúsculas
        sanitizedValue = value.trim().toLowerCase().replace(/\s+/g, '');
        break;
      case 'ticketUrl':
        // Para URL, remover espacios
        sanitizedValue = value.trim().replace(/\s+/g, '');
        break;
      case 'date':
        // Para fecha, no sanitizar
        sanitizedValue = value;
        break;
      default:
        // Para otros campos de texto, sanitizar caracteres peligrosos
        sanitizedValue = value.replace(/[<>'"&]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Validar campo y actualizar errores
    const fieldError = validateField(name, sanitizedValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError || ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#101119] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Solicitar agregar evento
            </h2>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Tu nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.name ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Tu email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Nombre del evento
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.eventName ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.eventName && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.eventName}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Artista o banda
                </label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.artist ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.artist && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.artist}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Fecha del evento
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.date ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.date && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Lugar del evento
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.venue ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.venue && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.venue}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                    fieldErrors.city ? 'border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors.city && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Link de compra de entradas o landing del evento
              </label>
              <input
                type="url"
                name="ticketUrl"
                value={formData.ticketUrl}
                onChange={handleChange}
                placeholder="https://..."
                className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 ${
                  fieldErrors.ticketUrl ? 'border-red-500' : ''
                }`}
                required
              />
              {fieldErrors.ticketUrl && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.ticketUrl}</p>
              )}
              <p className="text-white/60 text-sm mt-1">
                Agrega el link donde los usuarios pueden comprar entradas o encontrar más información sobre el evento
              </p>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Información adicional (opcional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`input w-full bg-white/10 text-white placeholder-white/50 border-white/20 h-24 ${
                  fieldErrors.message ? 'border-red-500' : ''
                }`}
                placeholder="Agrega cualquier información adicional que consideres relevante..."
              />
              {fieldErrors.message && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-2 text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end sm:space-x-4 space-y-2 sm:space-y-0 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-white/10 text-white hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn bg-[#1a48c4] text-white hover:bg-[#1a48c4]/90"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRequestModal; 