import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useSearchParams, useNavigate  } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

interface Event {
  id: number;
  name: string;
  artist: string;
  genre: string;
  date: string;
  location: string;
  city: string;
  venue: string;
  description: string;
  image_url: string | null;
  ticket_url: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
  ticket_price: number | null;
}

interface EmbeddedAgendaProps {
  theme?: 'light' | 'dark';
  width?: string;
  initialFilters?: {
    genre?: string;
    location?: string;
    date?: string;
  };
}

const MarqueeText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDiff, setScrollDiff] = useState(0);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.offsetWidth;
      setShouldMarquee(diff > 0);
      setScrollDiff(diff > 0 ? diff : 0);
    }
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{ width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        ref={textRef}
        className="marquee-text"
        style={shouldMarquee && isHovered ? {
          display: 'inline-block',
          transform: `translateX(-${scrollDiff}px)` ,
          transition: `transform ${2 + scrollDiff/100}s linear`,
          overflow: 'visible',
          textOverflow: 'unset',
          whiteSpace: 'nowrap',
        } : {
          display: 'inline-block',
          transform: 'translateX(0)',
          transition: 'transform 0.3s',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  );
};

const EmbeddedAgenda: React.FC<EmbeddedAgendaProps> = ({
  theme = 'dark',
  width = '100%',
  initialFilters = {}
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialFilters.genre || '');
  const [selectedCity, setSelectedCity] = useState(initialFilters.location || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialFilters.date ? new Date(initialFilters.date) : null);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const ITEMS_PER_PAGE = 12;
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('gallery');
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [showCitiesCard, setShowCitiesCard] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showCitiesView, setShowCitiesView] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estados temporales para los filtros (no aplicados aún)
  const [tempSelectedGenre, setTempSelectedGenre] = useState(initialFilters.genre || '');
  const [tempSelectedCity, setTempSelectedCity] = useState(initialFilters.location || '');
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(initialFilters.date ? new Date(initialFilters.date) : null);
  const [tempSelectedCities, setTempSelectedCities] = useState<string[]>([]);
  
  // Estados para el orden de clasificación
  const [selectedSort, setSelectedSort] = useState<'asc' | 'desc'>('asc');
  const [tempSelectedSort, setTempSelectedSort] = useState<'asc' | 'desc'>('asc');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Estado para el modal de búsqueda
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState(searchTerm);

  // Reiniciar el input de búsqueda cada vez que se abre el modal
  useEffect(() => {
    if (isSearchModalOpen) {
      setTempSearchTerm("");
    }
  }, [isSearchModalOpen]);

  const themeParam = searchParams.get('theme') || theme;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          skip: '0',
          limit: ITEMS_PER_PAGE.toString(),
          ...(selectedGenre && { genre: selectedGenre }),
          ...(selectedCity && { city: selectedCity }),
          ...(selectedDate && { date: selectedDate.toISOString().split('T')[0] })
        });

        const response = await fetch(`${import.meta.env.VITE_API_URL}/events?${params}`);
        if (!response.ok) {
          throw new Error('Error al cargar los eventos');
        }
        const data = await response.json();
        if (!data || !data.items || !Array.isArray(data.items)) {
          throw new Error('Formato de respuesta inválido');
        }
        
        setEvents(data.items);
        setHasMore(data.hasMore);
        
        // Extraer géneros y ciudades únicos
        const genres = Array.from(new Set(data.items.map((event: Event) => event.genre))).filter((genre): genre is string => typeof genre === 'string');
        const cities = Array.from(new Set(data.items.map((event: Event) => event.city))).filter((city): city is string => typeof city === 'string');
        setAllGenres(genres);
        setAllCities(cities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedGenre, selectedCity, selectedDate]);

  useEffect(() => {
    if (coords) {
      setNearbyLoading(true);
      fetch(`${import.meta.env.VITE_API_URL}/events/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=50`)
        .then(res => res.json())
        .then(data => {
          setNearbyEvents(data.items || []);
          setNearbyLoading(false);
        })
        .catch(() => {
          setNearbyError('No se pudieron cargar los eventos cercanos.');
          setNearbyLoading(false);
        });
    }
  }, [coords]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsAnimating(true);
    const newGenre = e.target.value;
    setSelectedGenre(newGenre);
    
    const newParams = new URLSearchParams(searchParams);
    if (newGenre) {
      newParams.set('genre', newGenre);
      } else {
      newParams.delete('genre');
      }
    setSearchParams(newParams);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsAnimating(true);
    const newCity = e.target.value;
    setSelectedCity(newCity);
    
    const newParams = new URLSearchParams(searchParams);
    if (newCity) {
      newParams.set('city', newCity);
      } else {
      newParams.delete('city');
      }
    setSearchParams(newParams);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleDateChange = (date: Date | null) => {
    // Función eliminada - ahora se usa applyFilters
  };

  const handleClearFilters = () => {
    setIsAnimating(true);
    setSelectedGenre('');
    setSelectedCity('');
    setSelectedDate(null);
    setSelectedCities([]);
    setSearchTerm('');
    
    const newParams = new URLSearchParams();
    if (searchParams.get('theme')) {
      newParams.set('theme', searchParams.get('theme')!);
    }
    setSearchParams(newParams);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      setIsAnimating(true);

      const params = new URLSearchParams({
        skip: events.length.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedCity && { city: selectedCity }),
        ...(selectedDate && { date: selectedDate.toISOString().split('T')[0] })
      });

      console.log('Cargando más eventos con params:', params.toString());
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?${params}`);
      if (!response.ok) {
        throw new Error(`Error al cargar más eventos: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Formato de respuesta inválido: items no es un array');
      }
      
      setTimeout(() => {
        setEvents(prev => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
        setIsAnimating(false);
        setIsLoadingMore(false);
      }, 300);
    } catch (err) {
      console.error('Error al cargar más eventos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar más eventos');
      setIsLoadingMore(false);
      setIsAnimating(false);
    }
  };

  const hasActiveFilters = selectedGenre || selectedCity || selectedDate || selectedCities.length > 0 || searchTerm;

  // FILTRO DE EVENTOS POR FECHA ACTUAL
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ignorar hora para comparar solo fecha

  // Filtrar eventos futuros o de hoy para todas las vistas
  const futureEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  // Calcula los eventos que coinciden con los filtros aplicados
  const filteredResults = futureEvents
    .filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = !selectedGenre || event.genre === selectedGenre;
      const matchesCity = !selectedCity || event.city === selectedCity;
      const matchesCities = selectedCities.length === 0 || selectedCities.includes(event.city);
      const matchesDate = !selectedDate || new Date(event.date).toDateString() === selectedDate.toDateString();
      
      return matchesSearch && matchesGenre && matchesCity && matchesCities && matchesDate;
    })
    .sort((a, b) => {
      if (selectedSort === 'asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setSelectedEvent(null);
    }, 300);
  };

  const openFiltersModal = () => {
    // Inicializar estados temporales con los valores actuales
    setTempSelectedGenre(selectedGenre);
    setTempSelectedCity(selectedCity);
    setTempSelectedDate(selectedDate);
    setTempSelectedCities(selectedCities);
    setIsFiltersModalOpen(true);
  };

  const closeFiltersModal = () => {
    setIsFiltersModalOpen(false);
  };

  const toggleCitiesCard = () => {
    setShowCitiesCard(!showCitiesCard);
  };

  const showCitiesInModal = () => {
    setShowCitiesView(true);
  };

  const hideCitiesInModal = () => {
    setShowCitiesView(false);
  };

  const showCalendarInModal = () => {
    setShowCalendarView(true);
  };

  const hideCalendarInModal = () => {
    setShowCalendarView(false);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const selectDate = (date: Date) => {
    if (tempSelectedDate && 
        date.getDate() === tempSelectedDate.getDate() &&
        date.getMonth() === tempSelectedDate.getMonth() &&
        date.getFullYear() === tempSelectedDate.getFullYear()) {
      // Si se hace clic en la fecha ya seleccionada, la deselecciona
      setTempSelectedDate(null);
    } else {
      // Si se hace clic en una fecha diferente, la selecciona
      setTempSelectedDate(date);
    }
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Ajustar para que lunes sea 0
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Agregar días del mes anterior (solo los necesarios para completar la primera semana)
    for (let i = adjustedFirstDay; i > 0; i--) {
      const day = new Date(year, month, -i + 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Agregar días del mes siguiente para completar exactamente 42 días (6 filas x 7 columnas)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  const toggleCitySelection = (city: string) => {
    setTempSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const removeCityFromSelection = (cityToRemove: string) => {
    setTempSelectedCities(prev => prev.filter(city => city !== cityToRemove));
  };

  const applyFilters = () => {
    setIsAnimating(true);
    
    // Aplicar los filtros temporales a los estados reales
    setSelectedGenre(tempSelectedGenre);
    setSelectedCity(tempSelectedCity);
    setSelectedDate(tempSelectedDate);
    setSelectedCities(tempSelectedCities);
    
    // Solo mantener el parámetro theme si existe, sin agregar otros parámetros
    const newParams = new URLSearchParams();
    if (searchParams.get('theme')) {
      newParams.set('theme', searchParams.get('theme')!);
    }
    
    setSearchParams(newParams);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleViewMore = (eventId: number) => {
    // Abrir en una nueva pestaña
    //window.open(`${eventId}`, '_blank');
    navigate(`/events/${eventId}`);
  };

  const openSortModal = () => {
    setTempSelectedSort(selectedSort);
    setIsSortModalOpen(true);
  };

  const closeSortModal = () => {
    setIsSortModalOpen(false);
  };

  const applySort = () => {
    setIsAnimating(true);
    setSelectedSort(tempSelectedSort);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Calcula la cantidad de filtros activos
  const activeFiltersCount =
    (selectedGenre ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    (selectedCities.length > 0 ? 1 : 0) +
    (searchTerm ? 1 : 0);

  // Filtrar eventos cercanos futuros
  const futureNearbyEvents = nearbyEvents.filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  return (
    <>
      <style>
        {`
          body, .embedded-agenda, .agenda-container {
            font-family: 'Poppins', 'Inter', sans-serif !important;
          }
          .embedded-agenda {
            background: #101119 !important;
            color: #fff !important;
          }
          .agenda-container {
            color: #fff !important;
          }
          .agenda-container {
            width: ${width};
            overflow-x: hidden;
            overflow-y: auto;
            padding: 0;
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .white-section {
            width: 100vw;
            margin-left: calc(-50vw + 50%);
            background: #ffffff;
            color: #101119;
          }

          .search-bar-container {
            position: relative;
            width: 100%;
            margin-bottom: 1rem;
          }

          .search-bar {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border-radius: 9999px;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            font-size: 0.875rem;
            transition: all 0.3s ease;
          }

          .search-bar::placeholder {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(16, 17, 25, 0.5)'};
          }

          .search-bar:focus {
            outline: none;
            border-color: #1a48c4;
            box-shadow: 0 0 0 3px ${themeParam === 'dark' ? 'rgba(26, 72, 196, 0.2)' : 'rgba(26, 72, 196, 0.1)'};
          }

          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(16, 17, 25, 0.5)'};
            pointer-events: none;
            transition: color 0.3s ease;
          }

          .search-bar:focus + .search-icon {
            color: #1a48c4;
          }

          .filters-container {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
          }

          .filter-select {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            font-size: 0.875rem;
            min-width: 150px;
            cursor: pointer;
            font-weight: 700;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: none;
            transition: all 0.3s ease;
          }

          .filter-select option {
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            padding: 0.5rem;
          }

          .filter-select:hover {
            border-color: #1a48c4;
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .filter-select:focus {
            outline: none;
            border-color: #1a48c4;
            box-shadow: 0 0 0 3px rgba(26, 72, 196, 0.2);
          }

          .clear-filters {
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            background: none;
            border: none;
            font-size: 0.875rem;
            cursor: pointer;
            padding: 0;
            font-weight: 700;
            margin-left: auto;
            transition: all 0.3s ease;
            opacity: 0.7;
          }

          .clear-filters:hover {
            opacity: 1;
            color: #1a48c4;
            transform: translateX(4px);
          }

          .events-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            opacity: 1;
            transition: opacity 0.3s ease;
          }

          .events-table.fade-out {
            opacity: 0;
          }

          .events-table.fade-in {
            opacity: 1;
          }

          .table-header {
            border-bottom: 2px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            padding: 1rem;
            text-align: left;
            font-size: 0.875rem;
            font-weight: 600;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            white-space: nowrap;
          }

          .table-header:nth-child(1) { width: 30%; }
          .table-header:nth-child(2) { width: 20%; }
          .table-header:nth-child(3) { width: 15%; }
          .table-header:nth-child(4) { width: 25%; }
          .table-header:nth-child(5) { width: 10%; }

          .table-row {
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            transition: all 0.3s ease;
            cursor: pointer;
            opacity: 1;
            transform: translateY(0);
          }

          .table-row.fade-out {
            opacity: 0;
            transform: translateY(10px);
          }

          .table-row.fade-in {
            opacity: 1;
            transform: translateY(0);
          }

          .table-row:hover {
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 17, 25, 0.02)'};
            transform: translateX(8px);
            box-shadow: ${themeParam === 'dark' 
              ? '0 4px 6px rgba(0, 0, 0, 0.2)'
              : '0 4px 6px rgba(0, 0, 0, 0.05)'};
          }

          .table-row:hover .artist-cell {
            color: #1a48c4;
          }

          .table-cell {
            padding: 1rem;
            font-size: 0.875rem;
            vertical-align: middle;
            transition: all 0.3s ease;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .artist-cell {
            font-weight: 700;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            font-size: 1rem;
            letter-spacing: -0.01em;
            transition: color 0.3s ease;
            min-width: 0;
          }

          .date-cell {
            white-space: nowrap;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            font-weight: 500;
            min-width: 0;
          }

          .location-cell {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            font-weight: 500;
            min-width: 0;
          }

          .venue-cell {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            font-weight: 500;
            min-width: 0;
          }

          .ticket-button {
            padding: 0.5rem 1rem;
            background: #1a48c4;
            color: #ffffff;
            border: none;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.3s ease;
          }

          .ticket-button:hover {
            background: #153a9e;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .date-picker-button {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            font-size: 0.875rem;
            min-width: 150px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            font-weight: 700;
            transition: all 0.3s ease;
          }

          .date-picker-button:hover {
            border-color: #1a48c4;
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .react-datepicker {
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'} !important;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'} !important;
            border-radius: 8px !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__header {
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'} !important;
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'} !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__current-month {
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'} !important;
            font-weight: 600 !important;
          }

          .react-datepicker__day-name {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'} !important;
          }

          .react-datepicker__day {
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'} !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__day:hover {
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'} !important;
            transform: scale(1.1) !important;
          }

          .react-datepicker__day--selected {
            background: #1a48c4 !important;
            color: #ffffff !important;
            transform: scale(1.1) !important;
          }

          .react-datepicker__day--keyboard-selected {
            background: #1a48c4 !important;
            color: #ffffff !important;
            transform: scale(1.1) !important;
          }

          .load-more-container {
            display: flex;
            justify-content: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
          }

          .load-more-button {
            padding: 0.75rem 2rem;
            background: transparent;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 17, 25, 0.2)'};
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .load-more-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          .load-more-button:not(:disabled):hover {
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.05)'};
            border-color: #1a48c4;
            color: #1a48c4;
            transform: translateY(-2px);
          }

          .load-more-button:not(:disabled):active {
            transform: translateY(0);
          }

          .load-more-button svg {
            width: 1.25rem;
            height: 1.25rem;
            transition: transform 0.3s ease;
          }

          .load-more-button:not(:disabled):hover svg {
            transform: translateY(2px);
          }

          .loading-spinner {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(16, 17, 25, 0.3)'};
            border-top-color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            font-size: 0.875rem;
          }

          .error {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: #ef4444;
            font-size: 0.875rem;
          }

          .no-events {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            font-size: 0.875rem;
            text-align: center;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-content {
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'};
            border-radius: 1rem;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 9999px;
            transition: all 0.3s ease;
            z-index: 10;
          }

          .modal-close:hover {
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 17, 25, 0.1)'};
            transform: rotate(90deg);
          }

          .event-hero {
            position: relative;
            width: 100%;
            height: 300px;
            border-radius: 1rem 1rem 0 0;
            overflow: hidden;
          }

          .event-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .event-hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(16, 17, 25, 0.4), rgba(16, 17, 25, 0.8));
          }

          .event-content {
            padding: 2rem;
          }

          .event-header {
            margin-bottom: 2rem;
          }

          .event-genre {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #1a48c4;
            color: #ffffff;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }

          .event-title {
            font-size: 2rem;
            font-weight: 700;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            margin-bottom: 0.5rem;
          }

          .event-artist {
            font-size: 1.5rem;
            font-weight: 600;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(16, 17, 25, 0.9)'};
            margin-bottom: 1.5rem;
          }

          .event-details {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .event-info {
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 17, 25, 0.02)'};
            padding: 1.5rem;
            border-radius: 1rem;
          }

          .event-info h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            margin-bottom: 1rem;
          }

          .event-info p {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
            line-height: 1.6;
          }

          .event-location {
            margin-top: 1rem;
          }

          .event-location h4 {
            font-size: 1rem;
            font-weight: 600;
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
            margin-bottom: 0.5rem;
          }

          .event-location p {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16, 17, 25, 0.7)'};
          }

          .event-map {
            display: none;
          }

          .marquee-container {
            position: relative;
            overflow: hidden;
            white-space: nowrap;
            width: 100%;
            display: block;
          }
          .marquee-text {
            display: inline-block;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 100%;
            vertical-align: middle;
            transition: color 0.2s;
          }
          .card-hover:hover .marquee-text.marquee-animate {
            animation: marquee-scroll 4s linear 1;
          }
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            10% { transform: translateX(0); }
            90% { transform: translateX(calc(-100% + 100%)); }
            100% { transform: translateX(calc(-100% + 100%)); }
          }

          /* Estilos para el modal de filtros */
          .filters-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: flex-end;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          .filters-modal-content {
            background: #101119;
            border-radius: 1.5rem 1.5rem 0 0;
            width: 100%;
            max-width: 500px;
            max-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          .filters-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .filters-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }

          .filters-close {
            background: none;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 9999px;
            transition: all 0.3s ease;
          }

          .filters-close:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(90deg);
          }

          .filters-body {
            padding: 2rem;
            overflow-x: hidden;
            word-wrap: break-word;
            word-break: break-word;
          }

          .filter-section {
            margin-bottom: 2rem;
          }

          .filter-section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.75rem;
          }

          .filter-dropdown {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            padding-right: 2.5rem;
            transition: all 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          }

          .filter-dropdown span {
            flex: 1;
            text-align: left;
          }

          .filter-dropdown svg {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            flex-shrink: 0;
          }

          .filter-dropdown:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .filter-dropdown:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(26, 72, 196, 0.2);
          }

          .filter-dropdown option {
            background: #101119;
            color: #ffffff;
            padding: 0.5rem;
          }

          .date-filter-container {
            position: relative;
            width: 100%;
          }

          .date-picker-input {
            width: 100%;
            padding: 0.75rem 1rem;
            padding-right: 3rem;
            border-radius: 0.75rem;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .date-picker-input:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .date-picker-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(26, 72, 196, 0.2);
          }

          .date-picker-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .calendar-icon {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.6);
            pointer-events: none;
          }

          .apply-filters-button {
            width: 100%;
            padding: 0.875rem 1.5rem;
            background: #1a48c4;
            color: #ffffff;
            border: none;
            border-radius: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
          }

          .apply-filters-button:hover {
            background: #153a9e;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(26, 72, 196, 0.3);
          }

          .apply-filters-button:active {
            transform: translateY(0);
          }

          /* Estilos para la card de ciudades */
          .cities-card-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
            animation: fadeIn 0.3s ease;
          }

          .cities-card-content {
            background: #101119;
            border-radius: 1.5rem;
            width: 90%;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: scaleIn 0.3s ease;
          }

          @keyframes scaleIn {
            from { 
              opacity: 0;
              transform: scale(0.9);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }

          .cities-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .cities-card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }

          .cities-card-close {
            background: none;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 9999px;
            transition: all 0.3s ease;
          }

          .cities-card-close:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(90deg);
          }

          .cities-card-body {
            padding: 1.5rem;
          }

          .cities-grid {
            display: grid;
            gap: 0.75rem;
            margin-bottom: 2rem;
          }

          .city-button {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 0.875rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            border-radius: 0.75rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
          }

          .city-button:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-1px);
          }

          .city-button-selected {
            background: rgba(26, 72, 196, 0.2);
          }

          .city-name {
            flex: 1;
          }

          .city-check-icon {
            width: 1.25rem;
            height: 1.25rem;
            color: #1a48c4;
            flex-shrink: 0;
            margin-left: 0.5rem;
          }

          .cities-card-actions {
            display: flex;
            gap: 1rem;
          }

          .clear-cities-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .clear-cities-button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.3);
            color: #ffffff;
          }

          .clear-cities-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .confirm-cities-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: #1a48c4;
            border: none;
            border-radius: 0.75rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .confirm-cities-button:hover {
            background: #153a9e;
            transform: translateY(-1px);
          }

          /* Estilos personalizados para react-datepicker */
          .react-datepicker-wrapper {
            width: 100%;
          }

          .react-datepicker {
            background: #101119 !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 0.75rem !important;
            font-family: 'Poppins, Inter, sans-serif' !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
          }

          .react-datepicker__header {
            background: rgba(255, 255, 255, 0.05) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 0.75rem 0.75rem 0 0 !important;
          }

          .react-datepicker__current-month {
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
          }

          .react-datepicker__day-name {
            color: rgba(255, 255, 255, 0.7) !important;
            font-weight: 500 !important;
          }

          .react-datepicker__day {
            color: #ffffff !important;
            background: transparent !important;
            border-radius: 0.5rem !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__day:hover {
            background: rgba(26, 72, 196, 0.2) !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--selected {
            background: #1a48c4 !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--keyboard-selected {
            background: rgba(26, 72, 196, 0.3) !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--outside-month {
            color: rgba(255, 255, 255, 0.3) !important;
          }

          .react-datepicker__navigation {
            color: #ffffff !important;
          }

          .react-datepicker__navigation:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 0.5rem !important;
          }

          .react-datepicker__month-container {
            background: #101119 !important;
          }

          /* Estilos para el calendario personalizado */
          .custom-calendar {
            width: 100%;
          }

          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .month-nav-button {
            background: none;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
          }

          .month-nav-button:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .current-month {
            font-size: 1.125rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
            text-transform: capitalize;
          }

          .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.25rem;
            margin-bottom: 0.5rem;
          }

          .weekday-header {
            background: #323741;
            color: #656A78;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.75rem 0.5rem;
            text-align: center;
            border-radius: 0.5rem;
          }

          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.25rem;
            margin-bottom: 2rem;
          }

          .calendar-day {
            background: #171717;
            color: #ffffff;
            border: none;
            border-radius: 0.5rem;
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            min-height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .calendar-day:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .calendar-day.other-month {
            color: #656A78;
          }

          .calendar-day.selected-day {
            background: #153a9e;
            color: #ffffff;
            border: 2px solid #1a48c4;
          }

          .calendar-actions {
            display: flex;
            gap: 1rem;
          }

          .cancel-date-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .cancel-date-button:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.3);
            color: #ffffff;
          }

          .select-date-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: #1a48c4;
            border: none;
            border-radius: 0.75rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .select-date-button:hover {
            background: #153a9e;
            transform: translateY(-1px);
          }

          .calendar-day.other-month {
            color: #656A78;
          }

          .calendar-day:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .calendar-day:disabled:hover {
            background: #171717;
          }

          /* Estilos para las ciudades seleccionadas */
          .selected-cities-section {
            margin-bottom: 1.5rem;
          }

          .selected-cities-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .selected-city-chip {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            border-radius: 0.5rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            max-width: 100%;
          }

          .selected-city-chip:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-1px);
          }

          .selected-city-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
          }

          .selected-city-remove {
            width: 1rem;
            height: 1rem;
            color: rgba(255, 255, 255, 0.7);
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .selected-city-chip:hover .selected-city-remove {
            color: #ffffff;
          }

          /* Estilos para el modal de Sort */
          .sort-options-grid {
            display: grid;
            gap: 0.75rem;
            margin-bottom: 2rem;
          }

          .sort-option-button {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 0.875rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            border-radius: 0.75rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
          }

          .sort-option-button:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-1px);
          }

          .sort-option-selected {
            background: rgba(26, 72, 196, 0.2);
          }

          .sort-option-name {
            flex: 1;
          }

          .sort-option-check-icon {
            width: 1.25rem;
            height: 1.25rem;
            color: #1a48c4;
            flex-shrink: 0;
            margin-left: 0.5rem;
          }
        `}
      </style>

      <div className="embedded-agenda min-h-screen bg-[#101119]" style={{ width, fontFamily: 'Poppins, Inter, sans-serif', overflowX: 'hidden' }}>
        <div className="agenda-container">
          <div className="mb-8 px-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
              Eventos y Recitales
            </h1>
            <p className="text-white/80 text-base md:text-lg mb-6" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
              Descubre los mejores eventos musicales y recitales en tu ciudad. Filtra por género, fecha o lugar.
            </p>
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <button
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-white ${viewMode === 'list' ? 'bg-[#1a48c4] text-white' : 'bg-transparent hover:bg-white/10'}`}
                  style={{ 
                    background: viewMode === 'list' ? '#1a48c4' : 'transparent', 
                    color: '#fff',
                    border: viewMode === 'list' ? 'none' : 'none'
                  }}
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </button>
                <button
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-white ${viewMode === 'gallery' ? 'bg-[#1a48c4] text-white' : 'bg-transparent hover:bg-white/10'}`}
                  style={{ 
                    background: viewMode === 'gallery' ? '#1a48c4' : 'transparent', 
                    color: '#fff',
                    border: viewMode === 'gallery' ? 'none' : 'none'
                  }}
                  onClick={() => setViewMode('gallery')}
                >
                  Galería
                </button>
              </div>
              <div className="flex gap-2">
                <button className="text-white hover:text-white/80 transition-colors p-2" onClick={() => setIsSearchModalOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <div className="relative">
                  <button className="text-white hover:text-white/80 transition-colors p-2" onClick={openFiltersModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    {activeFiltersCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          background: '#1752F9',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          border: '2px solid #101119',
                          zIndex: 10,
                        }}
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
                <button className="text-white hover:text-white/80 transition-colors p-2" onClick={openSortModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Vista LISTA de eventos */}
          {viewMode === 'list' && (
            <div className="white-section py-8 mb-0">
              <div className="px-4 md:px-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-1">Lista de Eventos y recitales</h2>
                <p className="text-base md:text-lg text-[#101119]/70 mb-6">Los eventos en orden cronológico</p>
                <div className="flex flex-col gap-4">
                  {filteredResults.length === 0 ? (
                    <div className="text-center text-[#101119]/60">No hay eventos para mostrar</div>
                  ) : (
                    filteredResults.map(event => {
                      const dateObj = new Date(event.date);
                      const dayNames = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
                      const dayName = dayNames[dateObj.getDay()];
                      const dayNumber = dateObj.getDate();
                      const today = new Date();
                      const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
                      return (
                        <div
                          key={event.id}
                          className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                          style={{ minHeight: 90, fontFamily: 'Poppins, Inter, sans-serif' }}
                          onClick={() => handleViewMore(event.id)}
                        >
                          {/* Fecha o HOY */}
                          <div style={{width: 90, minWidth: 90, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90px'}}>
                            {isToday ? (
                              <>
                                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 90, background: '#E4F1F8', borderRadius: '0.75rem 0 0 0.75rem', zIndex: 0}} />
                                <span className="font-bold" style={{color: '#112E7E', letterSpacing: 1, fontSize: '1.5rem', fontWeight: 700, position: 'relative', zIndex: 1}}>HOY</span>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center" style={{width: 56, height: 56, marginLeft: 2}}>
                                <span className="text-xs font" style={{letterSpacing: 1, color: '#101119'}}>{dayName}</span>
                                <span className="text-2xl font" style={{color: '#101119', lineHeight: '1'}}>{dayNumber}</span>
                              </div>
                            )}
                          </div>
                          {/* División punteada vertical */}
                          <div style={{borderLeft: '2px dashed #A2A2A2', height: '100%', minHeight: '90px', marginRight: 16}} />
                          {/* Info evento */}
                          <div className="flex-1 flex flex-col justify-center min-w-0">
                            <span className="text-xs uppercase text-gray-400 font-semibold mb-1 truncate">{event.city}</span>
                            <span className="font-bold text-lg text-[#101119] truncate">{event.artist}</span>
                            <span className="text-sm text-gray-500 truncate">{event.venue}</span>
                          </div>
                          {/* Precio del ticket */}
                          <div className="flex items-center justify-center px-4">
                            <span className="text-m font text-[#101119]">
                              {event.ticket_price ? `ARS$ ${event.ticket_price}` : 'GRATIS'}
                            </span>
                          </div>
                          {/* Flecha */}
                          <div className="flex items-center justify-center px-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#101119" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vista GALERÍA de eventos (original) */}
          {viewMode === 'gallery' && (
            <>
              {/* Sección de Resultados cuando hay filtros activos */}
              {(selectedGenre || selectedCity || selectedDate || selectedCities.length > 0 || searchTerm) && (
                <div className="white-section py-8">
                  <div className="px-4 md:px-8">
                    <h2 className="text-2xl md:text-2xl font mb-8" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                      Resultados: {filteredResults.length}
                    </h2>
                    {filteredResults.length === 0 ? (
                      <div className="text-center text-[#101119]/60">No se encontraron eventos con los filtros aplicados</div>
                    ) : (
                      <div className="flex overflow-x-auto gap-4 pb-2" style={{scrollSnapType: 'x mandatory'}}>
                        {filteredResults.map((event, idx, arr) => (
                          <div
                            key={event.id}
                            className="card-hover flex flex-col cursor-pointer shadow hover:shadow-lg transition w-[300px] min-w-[300px] max-w-[300px] h-[450px]"
                            style={{
                              background: '#F5F5F5',
                              borderTopLeftRadius: 0,
                              borderTopRightRadius: 0,
                              borderBottomLeftRadius: '1rem',
                              borderBottomRightRadius: '1rem',
                              marginLeft: idx === 0 ? '0' : undefined,
                              marginRight: idx === arr.length - 1 ? '0' : undefined,
                              scrollSnapAlign: 'start',
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.name} className="w-full h-[210px] object-cover" style={{borderRadius: 0, marginBottom: 0}} />
                            ) : (
                              <div className="w-full h-[210px] flex items-center justify-center bg-[#1a48c4]" style={{borderRadius: 0, marginBottom: 0}}>
                                <span className="text-white text-xl font-bold">{event.artist}</span>
                              </div>
                            )}
                            <div className="flex flex-col justify-between flex-1 px-4 py-4" style={{color: '#101119'}}>
                              <div>
                                <MarqueeText className="font-bold text-lg mb-6 text-[#101119] min-h-[32px] flex items-center">{event.artist || <span>&nbsp;</span>}</MarqueeText>
                                <MarqueeText className="font-bold text-base mb-2 text-[#101119] min-h-[24px] flex items-center">{event.name || <span>&nbsp;</span>}</MarqueeText>
                                <div style={{minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                  <div className="flex items-center text-sm mb-1" style={{color: '#101119'}}>
                                    <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '20px', minHeight: '20px', display: 'inline-block', verticalAlign: 'middle'}}>
                                      <rect x='3' y='4' width='18' height='18' rx='4' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                      <path d='M16 2v4M8 2v4M3 10h18' stroke='#1a48c4' strokeWidth='2' strokeLinecap='round'/>
                                    </svg>
                                    {format(new Date(event.date), "d MMM yyyy - HH:mm", { locale: es })}
                                  </div>
                                  <div className="flex items-center text-sm mb-2" style={{color: '#101119'}}>
                                    <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='22' height='22' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '22px', minHeight: '22px', display: 'inline-block', verticalAlign: 'middle'}}>
                                      <path d='M12 21s-6-5.686-6-10A6 6 0 0118 11c0 4.314-6 10-6 10z' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                      <circle cx='12' cy='11' r='3' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                    </svg>
                                    <MarqueeText>{event.venue}, {event.city}</MarqueeText>
                                  </div>
                                </div>
                              </div>
                              {event.ticket_url && (
                                <a
                                  href={event.ticket_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-white text-center px-4 py-2 rounded-lg font transition"
                                  style={{background: '#1752F9', textDecoration: 'none'}}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Comprar entradas
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Secciones Destacados y Cercanos a ti - solo cuando NO hay filtros activos */}
              {!(selectedGenre || selectedCity || selectedDate || selectedCities.length > 0 || searchTerm) && (
                <>
                  <div className="white-section py-8">
                    <div className="px-4 md:px-8">
                      <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                        Destacados
                      </h2>
                      <p className="text-base md:text-lg text-[#101119]/70 mb-6" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                        Los eventos más importantes
                      </p>
                      <div className="flex overflow-x-auto gap-4 pb-2" style={{scrollSnapType: 'x mandatory'}}>
                        {futureEvents.filter(e => e.is_featured).length === 0 ? (
                          <div className="flex-1 text-center text-[#101119]/60">No hay eventos destacados</div>
                        ) : (
                          futureEvents.filter(e => e.is_featured).map((event, idx, arr) => (
                            <div
                              key={event.id}
                              className="card-hover flex flex-col cursor-pointer shadow hover:shadow-lg transition w-[300px] min-w-[300px] max-w-[300px] h-[450px]"
                              style={{
                                background: '#F5F5F5',
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                borderBottomLeftRadius: '1rem',
                                borderBottomRightRadius: '1rem',
                                marginLeft: idx === 0 ? '0' : undefined,
                                marginRight: idx === arr.length - 1 ? '0' : undefined,
                                scrollSnapAlign: 'start',
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              {event.image_url ? (
                                <img src={event.image_url} alt={event.name} className="w-full h-[210px] object-cover" style={{borderRadius: 0, marginBottom: 0}} />
                              ) : (
                                <div className="w-full h-[210px] flex items-center justify-center bg-[#1a48c4]" style={{borderRadius: 0, marginBottom: 0}}>
                                  <span className="text-white text-xl font-bold">{event.artist}</span>
                                </div>
                              )}
                              <div className="flex flex-col justify-between flex-1 px-4 py-4" style={{color: '#101119'}}>
                                <div>
                                  <MarqueeText className="font-bold text-lg mb-6 text-[#101119] min-h-[32px] flex items-center">{event.artist || <span>&nbsp;</span>}</MarqueeText>
                                  <MarqueeText className="font-bold text-base mb-2 text-[#101119] min-h-[24px] flex items-center">{event.name || <span>&nbsp;</span>}</MarqueeText>
                                  <div style={{minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                    <div className="flex items-center text-sm mb-1" style={{color: '#101119'}}>
                                      <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '20px', minHeight: '20px', display: 'inline-block', verticalAlign: 'middle'}}>
                                        <rect x='3' y='4' width='18' height='18' rx='4' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                        <path d='M16 2v4M8 2v4M3 10h18' stroke='#1a48c4' strokeWidth='2' strokeLinecap='round'/>
                                      </svg>
                                      {format(new Date(event.date), "d MMM yyyy - HH:mm", { locale: es })}
                                    </div>
                                    <div className="flex items-center text-sm mb-2" style={{color: '#101119'}}>
                                      <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='22' height='22' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '22px', minHeight: '22px', display: 'inline-block', verticalAlign: 'middle'}}>
                                        <path d='M12 21s-6-5.686-6-10A6 6 0 0118 11c0 4.314-6 10-6 10z' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                        <circle cx='12' cy='11' r='3' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                      </svg>
                                      <MarqueeText>{event.venue}, {event.city}</MarqueeText>
                                    </div>
                                  </div>
                                </div>
                                {event.ticket_url && (
                                  <a
                                    href={event.ticket_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-white text-center px-4 py-2 rounded-lg font transition"
                                    style={{background: '#1752F9', textDecoration: 'none'}}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Comprar entradas
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="white-section py-8">
                    <div className="px-4 md:px-8">
                      <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                        Cercanos a ti
                      </h2>
                      <p className="text-base md:text-lg text-[#101119]/70 mb-6" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                        Eventos basados en tu ubicación
                      </p>
                      {nearbyLoading ? (
                        <div className="text-center text-[#101119]/60">Cargando eventos cercanos...</div>
                      ) : !coords ? (
                        <div className="text-center text-[#101119]/60">No se pudo obtener tu ubicación o no la permitiste.</div>
                      ) : futureNearbyEvents.length === 0 ? (
                        <div className="text-center text-[#101119]/60">No hay eventos cercanos a tu ubicación.</div>
                      ) : (
                        <div className="flex overflow-x-auto gap-4 pb-2" style={{scrollSnapType: 'x mandatory'}}>
                          {futureNearbyEvents.map((event, idx, arr) => (
                            <div
                              key={event.id}
                              className="card-hover flex flex-col cursor-pointer shadow hover:shadow-lg transition w-[300px] min-w-[300px] max-w-[300px] h-[450px]"
                              style={{
                                background: '#F5F5F5',
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                borderBottomLeftRadius: '1rem',
                                borderBottomRightRadius: '1rem',
                                marginLeft: idx === 0 ? '0' : undefined,
                                marginRight: idx === arr.length - 1 ? '0' : undefined,
                                scrollSnapAlign: 'start',
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              {event.image_url ? (
                                <img src={event.image_url} alt={event.name} className="w-full h-[210px] object-cover" style={{borderRadius: 0, marginBottom: 0}} />
                              ) : (
                                <div className="w-full h-[210px] flex items-center justify-center bg-[#1a48c4]" style={{borderRadius: 0, marginBottom: 0}}>
                                  <span className="text-white text-xl font-bold">{event.artist}</span>
                                </div>
                              )}
                              <div className="flex flex-col justify-between flex-1 px-4 py-4" style={{color: '#101119'}}>
                                <div>
                                  <MarqueeText className="font-bold text-lg mb-6 text-[#101119] min-h-[32px] flex items-center">{event.artist || <span>&nbsp;</span>}</MarqueeText>
                                  <MarqueeText className="font-bold text-base mb-2 text-[#101119] min-h-[24px] flex items-center">{event.name || <span>&nbsp;</span>}</MarqueeText>
                                  <div style={{minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                    <div className="flex items-center text-sm mb-1" style={{color: '#101119'}}>
                                      <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '20px', minHeight: '20px', display: 'inline-block', verticalAlign: 'middle'}}>
                                        <rect x='3' y='4' width='18' height='18' rx='4' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                        <path d='M16 2v4M8 2v4M3 10h18' stroke='#1a48c4' strokeWidth='2' strokeLinecap='round'/>
                                      </svg>
                                      {format(new Date(event.date), "d MMM yyyy - HH:mm", { locale: es })}
                                    </div>
                                    <div className="flex items-center text-sm mb-2" style={{color: '#101119'}}>
                                      <svg xmlns='http://www.w3.org/2000/svg' className='mr-2' width='22' height='22' fill='none' viewBox='0 0 24 24' stroke='#1a48c4' strokeWidth='2' style={{minWidth: '22px', minHeight: '22px', display: 'inline-block', verticalAlign: 'middle'}}>
                                        <path d='M12 21s-6-5.686-6-10A6 6 0 0118 11c0 4.314-6 10-6 10z' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                        <circle cx='12' cy='11' r='3' stroke='#1a48c4' strokeWidth='2' fill='none'/>
                                      </svg>
                                      <MarqueeText>{event.venue}, {event.city}</MarqueeText>
                                    </div>
                                  </div>
                                </div>
                                {event.ticket_url && (
                                  <a
                                    href={event.ticket_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-white text-center px-4 py-2 rounded-lg font transition"
                                    style={{background: '#1752F9', textDecoration: 'none'}}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Comprar entradas
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Filtros */}
      {isFiltersModalOpen && (
        <div className="filters-modal-overlay" onClick={closeFiltersModal}>
          <div className="filters-modal-content" onClick={(e) => e.stopPropagation()}>
            {!showCitiesView && !showCalendarView ? (
              <>
                <div className="filters-header">
                  <h3 className="filters-title">Filtros</h3>
                  <button className="filters-close" onClick={closeFiltersModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="filters-body">
                  {/* Ciudades seleccionadas */}
                  {tempSelectedCities.length > 0 && (
                    <div className="selected-cities-section">
                      <div className="selected-cities-grid">
                        {tempSelectedCities.map((city) => (
                          <button
                            key={city}
                            className="selected-city-chip"
                            onClick={() => removeCityFromSelection(city)}
                          >
                            <span className="selected-city-name">{city}</span>
                            <svg className="selected-city-remove" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="filter-section">
                    <h4 className="filter-section-title">Ciudad</h4>
                    <button 
                      className="filter-dropdown"
                      onClick={showCitiesInModal}
                    >
                      <span>{tempSelectedCities.length === 0 ? "Todas las ciudades" : `${tempSelectedCities.length} ciudad${tempSelectedCities.length > 1 ? 'es' : ''} seleccionada${tempSelectedCities.length > 1 ? 's' : ''}`}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="filter-section">
                    <h4 className="filter-section-title">Fecha</h4>
                    <button 
                      className="filter-dropdown"
                      onClick={showCalendarInModal}
                    >
                      <span>{tempSelectedDate ? format(tempSelectedDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar una fecha"}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </button>
                  </div>

                  <button className="apply-filters-button" onClick={() => {
                    applyFilters();
                    closeFiltersModal();
                  }}>
                    Aplicar
                  </button>
                </div>
              </>
            ) : showCitiesView ? (
              <>
                <div className="filters-header">
                  <button className="back-button" onClick={hideCitiesInModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <h3 className="filters-title">Por ubicación</h3>
                  <button className="filters-close" onClick={closeFiltersModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="filters-body">
                  <div className="cities-grid">
                    {allCities.map((city) => (
                      <button
                        key={city}
                        className={`city-button ${tempSelectedCities.includes(city) ? 'city-button-selected' : ''}`}
                        onClick={() => toggleCitySelection(city)}
                      >
                        <span className="city-name">{city}</span>
                        {tempSelectedCities.includes(city) && (
                          <svg className="city-check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="cities-card-actions">
                    <button 
                      className="clear-cities-button" 
                      onClick={() => setTempSelectedCities([])}
                      disabled={tempSelectedCities.length === 0}
                    >
                      Limpiar selección
                    </button>
                    <button 
                      className="confirm-cities-button" 
                      onClick={() => {
                        applyFilters();
                        hideCitiesInModal();
                      }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="filters-body">
                  <div className="custom-calendar">
                    <div className="calendar-header">
                      <button className="month-nav-button" onClick={prevMonth}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <h4 className="current-month">
                        {format(currentMonth, "MMMM yyyy", { locale: es })}
                      </h4>
                      <button className="month-nav-button" onClick={nextMonth}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="calendar-weekdays">
                      {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((day) => (
                        <div key={day} className="weekday-header">{day}</div>
                      ))}
                    </div>
                    
                    <div className="calendar-grid">
                      {getCalendarDays().map((day, index) => (
                        <button
                          key={index}
                          className={`calendar-day ${
                            !day.isCurrentMonth ? 'other-month' : ''
                          } ${
                            tempSelectedDate && 
                            day.date.getDate() === tempSelectedDate.getDate() &&
                            day.date.getMonth() === tempSelectedDate.getMonth() &&
                            day.date.getFullYear() === tempSelectedDate.getFullYear()
                              ? 'selected-day' : ''
                          }`}
                          onClick={() => day.isCurrentMonth && selectDate(day.date)}
                          disabled={!day.isCurrentMonth}
                        >
                          {day.date.getDate()}
                        </button>
                      ))}
                    </div>
                    
                    <div className="calendar-actions">
                      <button 
                        className="cancel-date-button" 
                        onClick={() => {
                          setTempSelectedDate(null);
                          hideCalendarInModal();
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="select-date-button" 
                        onClick={hideCalendarInModal}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card de Ciudades */}
      {showCitiesCard && (
        <div className="cities-card-overlay" onClick={() => setShowCitiesCard(false)}>
          <div className="cities-card-content" onClick={(e) => e.stopPropagation()}>
            <div className="cities-card-header">
              <h3 className="cities-card-title">Por ubicación</h3>
              <button className="cities-card-close" onClick={() => setShowCitiesCard(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="cities-card-body">
              <div className="cities-grid">
                {allCities.map((city) => (
                  <button
                    key={city}
                    className={`city-button ${tempSelectedCities.includes(city) ? 'city-button-selected' : ''}`}
                    onClick={() => toggleCitySelection(city)}
                  >
                    <span className="city-name">{city}</span>
                    {tempSelectedCities.includes(city) && (
                      <svg className="city-check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="cities-card-actions">
                <button 
                  className="clear-cities-button" 
                  onClick={() => setTempSelectedCities([])}
                  disabled={tempSelectedCities.length === 0}
                >
                  Limpiar selección
                </button>
                <button 
                  className="confirm-cities-button" 
                  onClick={() => {
                    applyFilters();
                    hideCitiesInModal();
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sort */}
      {isSortModalOpen && (
        <div className="filters-modal-overlay" onClick={closeSortModal}>
          <div className="filters-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="filters-header">
              <h3 className="filters-title">Orden</h3>
              <button className="filters-close" onClick={closeSortModal}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="filters-body">
              <div className="filter-section">
                <div className="sort-options-grid">
                  <button
                    className={`sort-option-button ${tempSelectedSort === 'asc' ? 'sort-option-selected' : ''}`}
                    onClick={() => setTempSelectedSort('asc')}
                  >
                    <span className="sort-option-name">Ascendente</span>
                    {tempSelectedSort === 'asc' && (
                      <svg className="sort-option-check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <button
                    className={`sort-option-button ${tempSelectedSort === 'desc' ? 'sort-option-selected' : ''}`}
                    onClick={() => setTempSelectedSort('desc')}
                  >
                    <span className="sort-option-name">Descendente</span>
                    {tempSelectedSort === 'desc' && (
                      <svg className="sort-option-check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button className="apply-filters-button" onClick={() => {
                applySort();
                closeSortModal();
              }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda */}
      {isSearchModalOpen && (
        <div className="filters-modal-overlay" onClick={() => setIsSearchModalOpen(false)}>
          <div className="filters-modal-content" style={{ minHeight: '30rem' }} onClick={e => e.stopPropagation()}>
            <div className="filters-header">
              <h3 className="filters-title">Buscar</h3>
              <button className="filters-close" onClick={() => setIsSearchModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="filters-body">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setSearchTerm(tempSearchTerm);
                  setIsSearchModalOpen(false);
                }}
              >
                <input
                  type="text"
                  className="w-full date-picker-input mb-4"
                  placeholder="Busca artistas, eventos..."
                  value={tempSearchTerm}
                  onChange={e => setTempSearchTerm(e.target.value)}
                  autoFocus
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Evento */}
      {isModalOpen && selectedEvent && (
        <div className="filters-modal-overlay" onClick={closeModal}>
          <div className="filters-modal-content" onClick={e => e.stopPropagation()}>
            {/* Barra superior con flecha y nombre del artista */}
            <div className="filters-header">
              <div className="flex items-center gap-3">
                <button 
                  className="filters-close"
                  onClick={closeModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h3 className="text-white font-normal" style={{fontSize: '16px'}}>{selectedEvent.artist}</h3>
              </div>
              <div className="w-6 h-6"></div> {/* Espaciador para mantener el layout */}
            </div>

            {/* Imagen del evento */}
            <div className="relative h-64 overflow-hidden">
              {selectedEvent.image_url ? (
                <img 
                  src={selectedEvent.image_url} 
                  alt={selectedEvent.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a48c4]">
                  <span className="text-white text-3xl font-bold">{selectedEvent.artist}</span>
                </div>
              )}
            </div>

            {/* Sección de detalles */}
            <div className="filters-body" style={{background: '#ffffff', color: '#101119'}}>
              {/* Nombre del evento */}
              <h1 className="font-bold text-[#101119] mb-4" style={{fontSize: '20px'}}>{selectedEvent.name}</h1>
              
              {/* Nombre del artista */}
              <h2 className="text-black font-normal mb-6" style={{fontSize: '14px'}}>{selectedEvent.artist}</h2>
              
              {/* Card con fecha/horario y venue */}
              <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-3 mb-6">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1a48c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[#101119]">
                    {format(new Date(selectedEvent.date), "dd MMM yyyy - HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1a48c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[#101119]">{selectedEvent.venue}, {selectedEvent.city}</span>
                </div>
              </div>
              
              {/* Descripción del evento */}
              {selectedEvent.description && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-[#101119]" style={{fontSize: '16px'}}>Sobre el evento</h3>
                  <p className="text-black leading-relaxed" style={{fontSize: '14px'}}>{selectedEvent.description}</p>
                </div>
              )}
              
              {/* Botón de comprar entradas */}
              {selectedEvent.ticket_url && (
                <a
                  href={selectedEvent.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full text-white text-center px-4 py-3 rounded-lg font transition block"
                  style={{background: '#1752F9', textDecoration: 'none'}}
                  onClick={e => e.stopPropagation()}
                >
                  Comprar entradas
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmbeddedAgenda; 
