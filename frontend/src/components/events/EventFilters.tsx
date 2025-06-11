import { useState, useEffect } from 'react';
import { EventFilters as FilterTypes } from '../../types';
import { useEventStore } from '../../store/eventStore';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { format as formatDate } from 'date-fns';

interface EventFiltersProps {
  onFilterChange: (filters: FilterTypes) => void;
}

const EventFilters = ({ onFilterChange }: EventFiltersProps) => {
  const { genres, cities, fetchGenres, fetchCities, filters: globalFilters, resetFilters } = useEventStore();
  const [filters, setFilters] = useState<FilterTypes>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  useEffect(() => {
    fetchGenres();
    fetchCities();
  }, [fetchGenres, fetchCities]);

  // Sincronizar estado local con filtros globales
  useEffect(() => {
    setFilters(globalFilters || {});
    if (globalFilters?.dateFrom && globalFilters?.dateTo && globalFilters.dateFrom === globalFilters.dateTo) {
      // Corregir desfase de zona horaria: crear Date local a partir de YYYY-MM-DD
      const [year, month, day] = globalFilters.dateFrom.split('-');
      setSelectedDate(new Date(Number(year), Number(month) - 1, Number(day)));
    } else {
      setSelectedDate(null);
    }
  }, [globalFilters]);
  
  const handleFilterChange = (key: keyof FilterTypes, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '') {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    const newFilters = { ...filters };
    if (date) {
      const formatted = formatDate(date, 'yyyy-MM-dd');
      newFilters.dateFrom = formatted;
      newFilters.dateTo = formatted;
    } else {
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
    }
    console.log('[DatePicker] handleDateChange:', { date, newFilters });
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSelectedDate(null);
    setFilters({});
    resetFilters();
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      filters.genre ||
      filters.city ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.search
    );
  };

  return (
    <div className="bg-[#101119] rounded-lg shadow-md p-4 mb-6 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-4">Filtrar eventos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Género musical
          </label>
          <select
            className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm"
            value={filters.genre || ''}
            onChange={(e) => handleFilterChange('genre', e.target.value || undefined)}
          >
            <option value="">Todos los géneros</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Ciudad
          </label>
          <select
            className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm"
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
          >
            <option value="">Todas las ciudades</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            Fecha
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            locale={es}
            dateFormat="dd/MM/yyyy"
            placeholderText="Seleccionar fecha"
            minDate={new Date()}
            className="w-full"
            customInput={
              <button
                className="w-full min-w-[180px] px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm text-left flex items-center justify-between hover:border-[#1a48c4] transition-colors"
                type="button"
              >
                <span className={selectedDate ? '' : 'text-white/50'}>
                  {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Seleccionar fecha'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            }
          />
        </div>

        {hasActiveFilters() && (
          <div className="flex items-end justify-end ml-auto">
            <button
              onClick={handleClearFilters}
              className="text-white text-sm font-medium hover:underline transition-all duration-300 ease-in-out"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <input
          type="text"
          placeholder="Buscar por nombre, artista o descripción"
          className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50 text-sm"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
        />
      </div>
    </div>
  );
};

export default EventFilters; 