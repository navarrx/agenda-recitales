import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Star, Search, Calendar, MapPin, Music } from 'lucide-react';
import { getEvents, apiClient } from '../../services/api';
import { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AddToHeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddToHeroModal: React.FC<AddToHeroModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Estados para la lista de eventos
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const observer = useRef<IntersectionObserver>();
  const lastEventElementRef = useRef<HTMLDivElement>(null);

  const eventsPerPage = 20;

  // Función para cargar eventos con infinite scrolling
  const loadEvents = useCallback(async (page: number = 0, search: string = '') => {
    try {
      setLoadingEvents(true);
      const skip = page * eventsPerPage;
      
      const response = await getEvents(
        { search },
        { skip, limit: eventsPerPage, show_past: false }
      );
      
      if (page === 0) {
        setEvents(response.items);
      } else {
        setEvents(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Error al cargar los eventos');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Cargar eventos iniciales
  useEffect(() => {
    if (isOpen) {
      loadEvents(0, searchTerm);
    }
  }, [isOpen, loadEvents]);

  // Manejar búsqueda con debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(0);
      loadEvents(0, searchTerm);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, loadEvents]);

  // Intersection Observer para infinite scrolling
  useEffect(() => {
    if (loadingEvents) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadEvents(currentPage + 1, searchTerm);
      }
    });

    if (lastEventElementRef.current) {
      observer.current.observe(lastEventElementRef.current);
    }
  }, [loadingEvents, hasMore, currentPage, searchTerm, loadEvents]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      setError('Por favor selecciona un evento');
      return;
    }
    
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Verificar que el token esté disponible
    const token = localStorage.getItem('adminToken');
    console.log('Token disponible:', token ? 'Sí' : 'No');
    if (!token) {
      setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('event_id', selectedEvent.id.toString());
      formData.append('image', selectedFile);

      const response = await apiClient.post('/hero-events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      console.log('Hero event created:', result);
      
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedEvent(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (err) {
      console.error('Error creating hero event:', err);
      setError(err instanceof Error ? err.message : 'Error interno del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedEvent(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setSearchTerm('');
      setEvents([]);
      setCurrentPage(0);
      setHasMore(true);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#101119] border border-white/10 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-[#1a48c4]" />
            <h2 className="text-xl font-semibold text-white">
              Agregar al Hero Banner
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Panel izquierdo - Lista de eventos */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            {/* Búsqueda */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1a48c4] focus:border-transparent"
                />
              </div>
            </div>

            {/* Lista de eventos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  ref={index === events.length - 1 ? lastEventElementRef : null}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedEvent?.id === event.id
                      ? 'border-[#1a48c4] bg-[#1a48c4]/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{event.name}</h3>
                      <p className="text-white/70 text-sm truncate">{event.artist}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.date), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.city}</span>
                        </div>
                        {event.genre && (
                          <div className="flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            <span>{event.genre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loadingEvents && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a48c4]"></div>
                </div>
              )}
              
              {!loadingEvents && events.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  <p>No se encontraron eventos</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Configuración del hero */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Evento seleccionado */}
              {selectedEvent ? (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Evento seleccionado:</h3>
                    <div className="flex items-start gap-3">
                      {selectedEvent.image_url && (
                        <img
                          src={selectedEvent.image_url}
                          alt={selectedEvent.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{selectedEvent.name}</h4>
                        <p className="text-white/70">{selectedEvent.artist}</p>
                        <p className="text-white/50 text-sm mt-1">
                          {format(new Date(selectedEvent.date), 'dd MMMM yyyy', { locale: es })} • {selectedEvent.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload de imagen */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-white">
                      Imagen para el Hero Banner *
                    </label>
                    
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#1a48c4]/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="hero-image-upload"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="hero-image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-8 h-8 text-white/40" />
                        <div className="text-sm text-white/60">
                          <span className="font-medium text-[#1a48c4] hover:text-[#1a48c4]/80">
                            Haz clic para subir
                          </span>{' '}
                          o arrastra y suelta
                        </div>
                        <p className="text-xs text-white/40">
                          PNG, JPG, GIF hasta 5MB
                        </p>
                      </label>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white mb-2">
                          Vista previa:
                        </label>
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="mt-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-[#1a48c4]/10 border border-[#1a48c4]/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-[#1a48c4] mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-white/80">
                        <p className="font-medium mb-1 text-white">Información importante:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Solo se permiten hasta 5 eventos en el hero banner</li>
                          <li>• La imagen debe tener buena calidad y resolución</li>
                          <li>• Se recomienda una relación de aspecto 16:9</li>
                          <li>• El evento aparecerá en la página principal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  <div className="text-center">
                    <Star className="w-12 h-12 mx-auto mb-4 text-white/20" />
                    <p>Selecciona un evento de la lista</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a48c4] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !selectedEvent || !selectedFile}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1a48c4] border border-transparent rounded-md hover:bg-[#1a48c4]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a48c4] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Agregar al Hero
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToHeroModal;
