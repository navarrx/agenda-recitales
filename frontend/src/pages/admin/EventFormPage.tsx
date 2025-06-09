import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvent, createEvent, updateEvent } from '../../services/api';
import { Event } from '../../types';

// Default empty event
const emptyEvent: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  artist: '',
  genre: '',
  date: new Date().toISOString(),
  location: '',
  city: '',
  venue: '',
  description: '',
  image_url: '',
  ticket_url: '',
  is_featured: false,
  latitude: null,
  longitude: null
};

const EventFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<typeof emptyEvent>(emptyEvent);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchEventData = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const eventData = await getEvent(parseInt(id, 10));
          
          // Format date for datetime-local input
          const eventDate = new Date(eventData.date);
          const formattedDate = new Date(
            eventDate.getTime() - eventDate.getTimezoneOffset() * 60000
          ).toISOString().slice(0, 16);
          
          setFormData({
            ...eventData,
            date: formattedDate
          });
          setLoading(false);
        } catch (err) {
          console.error('Error fetching event:', err);
          setError('Error al cargar el evento. Por favor, intenta de nuevo más tarde.');
          setLoading(false);
        }
      }
    };

    fetchEventData();
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'latitude' || name === 'longitude') {
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await updateEvent(parseInt(id, 10), formData);
      } else {
        await createEvent(formData);
      }
      
      navigate('/admin');
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Error al guardar el evento. Por favor, verifica los datos e intenta de nuevo.');
      setSubmitting(false);
    }
  };

  const fetchCoordinates = async () => {
    if (!formData.location || !formData.city) {
      setError('Ingresa la dirección y ciudad antes de obtener las coordenadas');
      return;
    }

    try {
      setGeocodingStatus('loading');
      setError(null);
      
      const searchQuery = encodeURIComponent(`${formData.location}, ${formData.city}, Argentina`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1`);
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda de ubicación');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
        setGeocodingStatus('success');
      } else {
        // Si no encontramos la dirección exacta, intentamos solo con la ciudad
        const cityQuery = encodeURIComponent(`${formData.city}, Argentina`);
        const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityQuery}&format=json&limit=1`);
        const cityData = await cityResponse.json();
        
        if (cityData && cityData.length > 0) {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(cityData[0].lat),
            longitude: parseFloat(cityData[0].lon)
          }));
          setGeocodingStatus('success');
        } else {
          throw new Error('No se encontraron coordenadas para la ubicación');
        }
      }
    } catch (err) {
      console.error('Error geocoding location:', err);
      setError('No se pudieron obtener las coordenadas. Intente ingresarlas manualmente o use otra dirección.');
      setGeocodingStatus('error');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-[#1a48c4] hover:text-[#1a48c4]/80 flex items-center transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver al panel
        </Link>
      </div>

      <div className="bg-[#101119] rounded-lg shadow-md p-6 border border-white/10">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h1>

        {error && (
          <div className="bg-red-400/10 border border-red-400 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Nombre del evento *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Artista *
              </label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Género musical *
              </label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Lugar *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                URL de la imagen
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                URL de tickets
              </label>
              <input
                type="url"
                name="ticket_url"
                value={formData.ticket_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-white/20 bg-[#101119] rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-[#1a48c4] focus:ring-[#1a48c4] border-white/20 rounded"
              />
              <label className="ml-2 block text-sm text-white/80">
                Destacar evento
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={fetchCoordinates}
                disabled={geocodingStatus === 'loading'}
                className="px-4 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geocodingStatus === 'loading' ? 'Obteniendo...' : 'Obtener coordenadas'}
              </button>
              {geocodingStatus === 'success' && (
                <span className="text-green-400">Coordenadas obtenidas</span>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/admin"
              className="px-4 py-2 border border-white/20 text-white rounded-md hover:bg-white/5 transition-all duration-300"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#1a48c4] text-white rounded-md hover:bg-[#1a48c4]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EventFormPage; 