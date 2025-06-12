import { useState } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar el envío del formulario al backend
    console.log('Form data:', formData);
    // Por ahora solo mostramos un alert
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#101119] rounded-xl shadow-xl w-full max-w-2xl transform transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                  className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                  required
                />
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
                className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20"
                required
              />
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
                className="input w-full bg-white/10 text-white placeholder-white/50 border-white/20 h-24"
                placeholder="Agrega cualquier información adicional que consideres relevante..."
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
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
              >
                Enviar solicitud
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRequestModal; 