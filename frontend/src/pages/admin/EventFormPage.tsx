// src/pages/admin/EventFormPage.tsx
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvent, createEvent, updateEvent } from '../../services/api';
import { Event } from '../../types';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import * as Switch from '@radix-ui/react-switch';
import { Check, ChevronLeft } from 'lucide-react';

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
  longitude: null,
  date_types: [],
  ticket_price: null
};

const EventFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<typeof emptyEvent>(emptyEvent);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showImageModal, setShowImageModal] = useState(false);

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
            date: formattedDate,
            // Asegurar que latitude y longitude sean numbers o null
            latitude: eventData.latitude ?? null,
            longitude: eventData.longitude ?? null
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

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showImageModal]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 10MB permitido.');
        return;
      }
      
      setImageFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Si hay una imagen seleccionada, usar el endpoint con imagen
      if (imageFile) {
        const formDataToSend = new FormData();
        
        // Agregar todos los campos del formulario
        formDataToSend.append('name', formData.name);
        formDataToSend.append('artist', formData.artist);
        formDataToSend.append('date', formData.date);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('city', formData.city);
        formDataToSend.append('venue', formData.venue);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('ticket_url', formData.ticket_url || '');
        formDataToSend.append('is_featured', formData.is_featured.toString());
        
        if (formData.latitude !== null) {
          formDataToSend.append('latitude', formData.latitude.toString());
        }
        if (formData.longitude !== null) {
          formDataToSend.append('longitude', formData.longitude.toString());
        }
        if (formData.date_types && formData.date_types.length > 0) {
          formDataToSend.append('date_types', JSON.stringify(formData.date_types));
        }
        if (formData.ticket_price !== null) {
          formDataToSend.append('ticket_price', formData.ticket_price.toString());
        }
        
        // Agregar la imagen
        formDataToSend.append('image', imageFile);
        
        const token = localStorage.getItem('adminToken');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        console.log('Debug - Token:', token ? 'Presente' : 'Ausente');
        console.log('Debug - Base URL:', baseUrl);
        
        if (isEditMode) {
          const response = await fetch(`${baseUrl}/events/${id}/with-image`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataToSend
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Debug - Error response:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        } else {
          const response = await fetch(`${baseUrl}/events/with-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataToSend
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Debug - Error response:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        }
      } else {
        // Si no hay imagen, usar los endpoints originales
        if (isEditMode) {
          await updateEvent(parseInt(id, 10), formData);
        } else {
          await createEvent(formData);
        }
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
      
      const searchQuery = `${formData.location}, ${formData.city}, Argentina`;
      
      // Intentar con Google Maps API primero
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}&region=ar`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const location = data.results[0].geometry.location;
              setFormData(prev => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng
              }));
              setGeocodingStatus('success');
              return;
            }
          }
        } catch (err) {
          console.log('Google Maps API falló, intentando con Nominatim...');
        }
      }
      
      // Fallback a Nominatim (OpenStreetMap)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            setFormData(prev => ({
              ...prev,
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon)
            }));
            setGeocodingStatus('success');
            return;
          }
        }
      } catch (err) {
        console.log('Nominatim falló, intentando con ciudad...');
      }
      
      // Último intento: solo con la ciudad
      try {
        const cityQuery = `${formData.city}, Argentina`;
        const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=1`);
        const cityData = await cityResponse.json();
        
        if (cityData && cityData.length > 0) {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(cityData[0].lat),
            longitude: parseFloat(cityData[0].lon)
          }));
          setGeocodingStatus('success');
          return;
        }
      } catch (err) {
        console.log('Geocodificación de ciudad falló');
      }
      
      throw new Error('No se encontraron coordenadas para la ubicación');
      
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
          className="inline-flex items-center text-[#1a48c4] hover:text-[#1a48c4]/80 transition-colors duration-200 group"
        >
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
          Volver al panel
        </Link>
      </div>

      <div className="bg-[#101119] rounded-xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-8">
          {isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-pulse"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Nombre del evento *
                </Label.Root>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: Concierto en el Parque"
                />
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Artista *
                </Label.Root>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: Los Redondos"
                />
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Fecha y hora *
                </Label.Root>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Tipo de fecha y precio - MOVIDO ARRIBA */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Tipo de Evento y Precios
            </h2>
            
            <div className="space-y-4">
              <Label.Root className="text-sm font-medium text-white/80">
                Tipo de fecha
              </Label.Root>
              <div className="flex flex-wrap gap-3">
                {['gratis', 'pago', 'festival', 'concierto', 'dj'].map((tipo) => (
                  <div key={tipo} className="flex items-center">
                    <Checkbox.Root
                      id={`date-type-${tipo}`}
                      checked={formData.date_types?.includes(tipo) || false}
                      onCheckedChange={(checked) => {
                        let newTypes = formData.date_types ? [...formData.date_types] : [];
                        if (checked) {
                          // Si selecciona 'pago', deselecciona 'gratis' y viceversa
                          if (tipo === 'pago') newTypes = newTypes.filter(t => t !== 'gratis');
                          if (tipo === 'gratis') newTypes = newTypes.filter(t => t !== 'pago');
                          if (!newTypes.includes(tipo)) newTypes.push(tipo);
                        } else {
                          newTypes = newTypes.filter(t => t !== tipo);
                        }
                        setFormData(prev => ({ ...prev, date_types: newTypes }));
                      }}
                      className="w-5 h-5 rounded border border-white/20 bg-[#101119] flex items-center justify-center hover:bg-white/5 transition-all duration-200 data-[state=checked]:bg-[#1a48c4] data-[state=checked]:border-[#1a48c4]"
                    >
                      <Checkbox.Indicator>
                        <Check className="w-3 h-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label.Root
                      htmlFor={`date-type-${tipo}`}
                      className="ml-2 text-sm text-white/80 cursor-pointer hover:text-white transition-colors duration-200"
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Label.Root>
                  </div>
                ))}
              </div>
            </div>

            {formData.date_types?.includes('pago') && (
              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Precio del ticket (ARS)
                </Label.Root>
                <input
                  type="number"
                  name="ticket_price"
                  value={formData.ticket_price?.toString() || ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, ticket_price: value === '' ? null : parseInt(value, 10) }));
                  }}
                  min={0}
                  step={1}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: 5000"
                />
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Ubicación
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Ciudad *
                </Label.Root>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: Córdoba"
                />
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Lugar *
                </Label.Root>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: Estadio Kempes"
                />
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  Dirección *
                </Label.Root>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="Ej: Av. Cárcano s/n"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label.Root className="text-sm font-medium text-white/80">
                    Coordenadas
                  </Label.Root>
                  {formData.latitude && formData.longitude && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`,
                          '_blank'
                        );
                      }}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      title="Ver ubicación en Google Maps"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Probar coordenadas actuales
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude?.toString() || ''}
                    onChange={handleChange}
                    step="any"
                    placeholder="Latitud"
                    className="flex-1 px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude?.toString() || ''}
                    onChange={handleChange}
                    step="any"
                    placeholder="Longitud"
                    className="flex-1 px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchCoordinates}
                  disabled={geocodingStatus === 'loading'}
                  className="w-full px-4 py-2 bg-[#1a48c4] text-white rounded-lg hover:bg-[#1a48c4]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {geocodingStatus === 'loading' ? 'Obteniendo coordenadas...' : 'Obtener coordenadas automáticamente'}
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://www.google.com/maps', '_blank')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 mt-2"
                >
                  📍 Abrir Google Maps para obtener coordenadas
                </button>
                <p className="text-xs text-white/60 mt-2">
                  💡 Tip: En Google Maps, haz clic derecho en el mapa → "¿Qué hay aquí?" para ver las coordenadas
                </p>
                {geocodingStatus === 'success' && (
                  <div className="flex items-center text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Coordenadas obtenidas correctamente
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enlaces */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Enlaces y Multimedia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label.Root className="text-sm font-medium text-white/80">
                    Imagen del evento
                  </Label.Root>
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="w-5 h-5 bg-[#1a48c4] text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-[#1a48c4]/90 transition-colors duration-200"
                    title="Información sobre dimensiones de imagen"
                  >
                    ?
                  </button>
                </div>
                
                {/* Campo de subida de archivo */}
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="w-full px-4 py-3 border-2 border-dashed border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white/70 hover:text-white hover:border-white/40 transition-all duration-200 cursor-pointer flex items-center justify-center"
                  >
                    {imageFile ? (
                      <div className="text-center">
                        <div className="text-green-400 mb-1">✓ Imagen seleccionada</div>
                        <div className="text-sm">{imageFile.name}</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl mb-2">📸</div>
                        <div>Haz clic para seleccionar una imagen</div>
                        <div className="text-xs mt-1">JPEG, PNG, GIF (máx. 10MB)</div>
                      </div>
                    )}
                  </label>
                </div>
                
                {/* Mostrar imagen actual si existe y no se ha seleccionado una nueva */}
                {formData.image_url && !imageFile && (
                  <div className="mt-2">
                    <div className="text-sm text-white/60 mb-2">Imagen actual:</div>
                    <img
                      src={formData.image_url}
                      alt="Imagen actual del evento"
                      className="w-32 h-32 object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}
                
                {/* Vista previa de la nueva imagen */}
                {imageFile && (
                  <div className="mt-2">
                    <div className="text-sm text-white/60 mb-2">Vista previa:</div>
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Vista previa"
                      className="w-32 h-32 object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-white/80">
                  URL de tickets
                </Label.Root>
                <input
                  type="url"
                  name="ticket_url"
                  value={formData.ticket_url || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200"
                  placeholder="https://ejemplo.com/tickets"
                />
              </div>
            </div>
          </div>

          {/* Descripción - MOVIDA ABAJO */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Descripción
            </h2>
            
            <div className="space-y-2">
              <Label.Root className="text-sm font-medium text-white/80">
                Descripción del evento
              </Label.Root>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white placeholder-white/50 transition-all duration-200 resize-none"
                placeholder="Describe el evento, incluye información relevante, artistas invitados, etc."
              />
            </div>
          </div>

          {/* Configuración */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-2">
              Configuración
            </h2>
            
            <div className="flex items-center space-x-3">
              <Switch.Root
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-[#1a48c4] transition-colors duration-200"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
              <Label.Root htmlFor="is_featured" className="text-sm text-white/80 cursor-pointer">
                Destacar evento en la página principal
              </Label.Root>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <Link
              to="/admin"
              className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-300 font-medium"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#1a48c4] text-white rounded-lg hover:bg-[#1a48c4]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Evento'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de información de imagen */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="bg-[#101119] rounded-xl shadow-2xl border border-white/10 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                📸 Subida de imágenes
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-white/80">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-medium text-green-400 mb-2">✅ Funcionalidad:</h4>
                <ul className="text-sm text-green-300 space-y-1">
                  <li>• <strong>Subida directa:</strong> Las imágenes se suben automáticamente a Amazon S3</li>
                  <li>• <strong>Optimización automática:</strong> Se redimensionan y comprimen automáticamente</li>
                  <li>• <strong>URL automática:</strong> Se genera y guarda la URL automáticamente</li>
                </ul>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">📐 Aspecto recomendado:</h4>
                <p className="text-sm">
                  <strong>Aspect ratio:</strong> 1:1.1 (ancho:alto)<br/>
                  <span className="text-white/60">Casi cuadrado pero un poco más alto</span>
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">📏 Dimensiones:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Ancho máximo:</strong> 1920px (se redimensiona automáticamente)</li>
                  <li>• <strong>Alto máximo:</strong> 1080px (se redimensiona automáticamente)</li>
                  <li>• <strong>Formato:</strong> JPG, PNG, GIF</li>
                  <li>• <strong>Tamaño máximo:</strong> 10MB</li>
                </ul>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-400 mb-2">💡 Nota importante:</h4>
                <p className="text-sm text-blue-300">
                  Las imágenes se optimizan automáticamente antes de subirse. Si la imagen es muy grande, se redimensionará manteniendo la proporción.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-[#1a48c4] text-white rounded-lg hover:bg-[#1a48c4]/90 transition-colors duration-200"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventFormPage;