import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  image_url?: string;
  ticket_url?: string;
  is_featured: boolean;
  latitude?: number;
  longitude?: number;
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

const EmbeddedAgenda: React.FC<EmbeddedAgendaProps> = ({
  theme = 'dark',
  width = '100%',
  initialFilters = {}
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <style>
        {`
          .agenda-container {
            width: ${width};
            overflow: auto;
            padding: 1.5rem;
            background: ${themeParam === 'dark' ? '#101119' : '#ffffff'};
            color: ${themeParam === 'dark' ? '#ffffff' : '#101119'};
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
                  <th className="table-header">Lugar</th>
                  <th className="table-header">Sala</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr 
                    key={event.id} 
                    className={`table-row ${isAnimating ? 'fade-out' : 'fade-in'}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <td className="table-cell artist-cell">
                      {event.artist}
                    </td>
                    <td className="table-cell date-cell">
                      {format(new Date(event.date), "EEEE d 'de' MMMM", { locale: es })}
                    </td>
                    <td className="table-cell location-cell">
                      {event.location}
                    </td>
                    <td className="table-cell venue-cell">
                      {event.venue}
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

      {isModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="event-hero">
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt={selectedEvent.name} />
              ) : (
                <div style={{ 
                  background: '#1a48c4', 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  {selectedEvent.artist}
                </div>
              )}
              <div className="event-hero-overlay" />
            </div>

            <div className="event-content">
              <div className="event-header">
                <span className="event-genre">{selectedEvent.genre}</span>
                <h1 className="event-title">{selectedEvent.name}</h1>
                <h2 className="event-artist">{selectedEvent.artist}</h2>
              </div>

              <div className="event-details">
                <div className="event-info">
                  <h3>Descripción</h3>
                  <p>{selectedEvent.description}</p>
                </div>

                <div className="event-info">
                  <h3>Información del Evento</h3>
                  <p>
                    <strong>Fecha:</strong> {format(new Date(selectedEvent.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <div className="event-location">
                    <h4>Ubicación</h4>
                    <p>{selectedEvent.venue}</p>
                    <p>{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default EmbeddedAgenda; 