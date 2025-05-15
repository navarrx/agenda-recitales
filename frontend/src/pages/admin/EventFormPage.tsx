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
          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver al panel
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del evento *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Artista *
              </label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Género musical *
              </label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Venue/Local *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ubicación *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Dirección completa"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={fetchCoordinates}
                disabled={geocodingStatus === 'loading' || !formData.location || !formData.city}
                className="w-full px-4 py-2 mb-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                {geocodingStatus === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Obteniendo coordenadas...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Obtener coordenadas de la dirección
                  </>
                )}
              </button>
              {geocodingStatus === 'success' && (
                <div className="mb-2 text-sm text-green-500 dark:text-green-400">
                  ✓ Coordenadas obtenidas correctamente
                </div>
              )}
              {geocodingStatus === 'error' && (
                <div className="mb-2 text-sm text-red-500 dark:text-red-400">
                  ✗ Error al obtener coordenadas
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={handleChange}
                  step="any"
                  placeholder="-34.6037"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Coordenada de latitud (ej. -34.6037 para Buenos Aires)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={handleChange}
                  step="any"
                  placeholder="-58.3816"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Coordenada de longitud (ej. -58.3816 para Buenos Aires)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL de la imagen
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL para compra de entradas
              </label>
              <input
                type="url"
                name="ticket_url"
                value={formData.ticket_url || ''}
                onChange={handleChange}
                placeholder="https://entradas.com/evento"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Destacar en la página principal
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <Link
              to="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Guardando...' : isEditMode ? 'Actualizar Evento' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EventFormPage; 