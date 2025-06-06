import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

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
  image_url?: string;
  ticket_url?: string;
  is_featured: boolean;
  latitude?: number;
  longitude?: number;
}

interface EmbeddedAgendaProps {
  initialGenre?: string;
  initialCity?: string;
  initialLimit?: number;
  theme?: 'light' | 'dark';
  height?: string;
  width?: string;
}

const EmbeddedAgenda: React.FC<EmbeddedAgendaProps> = ({
  initialGenre,
  initialCity,
  initialLimit = 12,
  theme = 'light',
  height = '600px',
  width = '100%'
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

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
    setIsAnimating(true);
    setSelectedDate(date);
    
    const newParams = new URLSearchParams(searchParams);
      if (date) {
      newParams.set('date', date.toISOString().split('T')[0]);
      } else {
      newParams.delete('date');
      }
    setSearchParams(newParams);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleClearFilters = () => {
    setIsAnimating(true);
    setSelectedGenre('');
    setSelectedCity('');
    setSelectedDate(null);
    
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

  const hasActiveFilters = selectedGenre || selectedCity || selectedDate;

  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = !selectedGenre || event.genre === selectedGenre;
      const matchesCity = !selectedCity || event.city === selectedCity;
      const matchesDate = !selectedDate || new Date(event.date).toDateString() === selectedDate.toDateString();
      
      return matchesSearch && matchesGenre && matchesCity && matchesDate;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, displayLimit);

  return (
    <>
      <style>
        {`
          .agenda-container {
            height: ${height};
            width: ${width};
            overflow: auto;
            padding: 1.5rem;
            background: ${themeParam === 'dark' ? '#000000' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#000000'};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            background: ${themeParam === 'dark' ? 'transparent' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#000000'};
            font-size: 0.875rem;
            transition: all 0.3s ease;
          }

          .search-bar::placeholder {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          }

          .search-bar:focus {
            outline: none;
            border-color: ${themeParam === 'dark' ? '#ffffff' : '#000000'};
            box-shadow: 0 0 0 3px ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          }

          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
            pointer-events: none;
            transition: color 0.3s ease;
          }

          .search-bar:focus + .search-icon {
            color: ${themeParam === 'dark' ? '#ffffff' : '#000000'};
          }

          .filters-container {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          }

          .filter-select {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
            background: #ffffff;
            color: #000000;
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
            background: #ffffff;
            color: #000000;
            padding: 0.5rem;
          }

          .filter-select:hover {
            border-color: #1a48c4;
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .filter-select:focus {
            outline: none;
            border-color: #1a48c4;
            box-shadow: 0 0 0 3px rgba(26, 72, 196, 0.1);
          }

          .clear-filters {
            color: #ffffff;
            background: none;
            border: none;
            font-size: 0.875rem;
            cursor: pointer;
            padding: 0;
            font-weight: 700;
            margin-left: auto;
            transition: all 0.3s ease;
          }

          .clear-filters:hover {
            opacity: 0.7;
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
            border-bottom: 2px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
            padding: 1rem;
            text-align: left;
            font-size: 0.875rem;
            font-weight: 600;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563'};
            white-space: nowrap;
          }

          .table-header:nth-child(1) { width: 30%; }
          .table-header:nth-child(2) { width: 20%; }
          .table-header:nth-child(3) { width: 15%; }
          .table-header:nth-child(4) { width: 25%; }
          .table-header:nth-child(5) { width: 10%; }

          .table-row {
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
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
            background: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'};
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
            color: ${themeParam === 'dark' ? '#ffffff' : '#000000'};
            font-size: 1rem;
            letter-spacing: -0.01em;
            transition: color 0.3s ease;
            min-width: 0;
          }

          .date-cell {
            white-space: nowrap;
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563'};
            font-weight: 500;
            min-width: 0;
          }

          .location-cell {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563'};
            font-weight: 500;
            min-width: 0;
          }

          .venue-cell {
            color: ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563'};
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
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
            background: #ffffff;
            color: #000000;
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
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .react-datepicker {
            background: #ffffff !important;
            border: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'} !important;
            border-radius: 4px !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__header {
            background: #ffffff !important;
            border-bottom: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'} !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__current-month {
            color: #000000 !important;
            font-weight: 600 !important;
          }

          .react-datepicker__day-name {
            color: #000000 !important;
          }

          .react-datepicker__day {
            color: #000000 !important;
            transition: all 0.3s ease !important;
          }

          .react-datepicker__day:hover {
            background: #f3f4f6 !important;
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
            border-top: 1px solid ${themeParam === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          }

          .load-more-button {
            padding: 0.75rem 2rem;
            background: transparent;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
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
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
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
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <div className="agenda-container">
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Buscar por nombre o artista..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-bar"
          />
          <svg 
            className="search-icon" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <div className="filters-container">
          <select
            value={selectedGenre}
            onChange={handleGenreChange}
            className="filter-select"
          >
            <option value="">Géneros</option>
            {allGenres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="filter-select"
          >
            <option value="">Ciudades</option>
            {allCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <div className="date-picker-wrapper">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              locale={es}
              dateFormat="dd/MM/yyyy"
              placeholderText="Fecha"
              minDate={new Date()}
              customInput={
                <button className="date-picker-button">
                  {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Fecha'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              }
            />
          </div>
          
          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              className="clear-filters"
            >
              Limpiar filtros
            </button>
          )}
      </div>

      {loading ? (
          <div className="loading">Cargando eventos...</div>
      ) : error ? (
          <div className="error">{error}</div>
      ) : filteredEvents.length === 0 ? (
          <div className="no-events">
          No se encontraron eventos que coincidan con tu búsqueda
        </div>
      ) : (
          <>
            <table className={`events-table ${isAnimating ? 'fade-out' : 'fade-in'}`}>
              <thead>
                <tr>
                  <th className="table-header">Artista</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Ubicación</th>
                  <th className="table-header">Lugar</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr 
                    key={event.id} 
                    className={`table-row ${isAnimating ? 'fade-out' : 'fade-in'}`}
                  >
                    <td className="table-cell artist-cell">
                      {event.artist}
                    </td>
                    <td className="table-cell date-cell">
                      {new Date(event.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="table-cell location-cell">
                      {event.city}
                    </td>
                    <td className="table-cell venue-cell">
                      {event.venue}
                    </td>
                    <td className="table-cell">
                      {event.ticket_url && (
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ticket-button"
                        >
                          Comprar
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div className="load-more-container">
                <button 
                  onClick={handleLoadMore}
                  className="load-more-button"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      Cargando...
                      <div className="loading-spinner" />
                    </>
                  ) : (
                    <>
                      Cargar más eventos
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
      )}
    </div>
    </>
  );
};

export default EmbeddedAgenda; 