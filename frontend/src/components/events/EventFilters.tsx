import { useState, useEffect, useRef } from 'react';
import { EventFilters as FilterTypes } from '../../types';
import { useEventStore } from '../../store/eventStore';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { format as formatDate } from 'date-fns';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { DollarSign, Ticket, Music, Mic, Disc3, X } from 'lucide-react';
import { sanitizeText, sanitizeSearchText, validateLength } from '../../utils/security';

interface EventFiltersProps {
  onFilterChange: (filters: FilterTypes) => void;
  viewMode: 'card' | 'list';
  onViewModeChange: (mode: 'card' | 'list') => void;
}

const EVENT_TYPES = [
  { value: 'gratis', label: 'Gratis', icon: <Ticket className="w-4 h-4" /> },
  { value: 'pago', label: 'Pago', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'festival', label: 'Festival', icon: <Music className="w-4 h-4" /> },
  { value: 'concierto', label: 'Concierto', icon: <Mic className="w-4 h-4" /> },
  { value: 'dj', label: 'DJ', icon: <Disc3 className="w-4 h-4" /> },
];

const EventFilters = ({ onFilterChange, viewMode, onViewModeChange }: EventFiltersProps) => {
  const { cities, fetchCities, filters: globalFilters, resetFilters } = useEventStore();
  const [filters, setFilters] = useState<FilterTypes>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

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
  
  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!showTypeDropdown) return;
    function handleClick(e: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTypeDropdown]);

  // ToggleGroup handler
  const handleDateTypesChange = (values: string[]) => {
    let newTypes = values;
    // Exclusión lógica entre pago y gratis
    if (values.includes('pago') && values.includes('gratis')) {
      // Si se selecciona uno, se deselecciona el otro
      newTypes = values.filter((v) => v !== (values[values.length - 1] === 'pago' ? 'gratis' : 'pago'));
    }
    const newFilters = { ...filters, dateTypes: newTypes.length > 0 ? newTypes : undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterChange = (key: keyof FilterTypes, value: string | undefined) => {
    let sanitizedValue = value;
    let error = null;
    
    // Sanitizar específicamente el campo de búsqueda
    if (key === 'search' && value) {
      const originalValue = value;
      sanitizedValue = sanitizeSearchText(value);
      
      // Validar longitud máxima para búsqueda
      if (!validateLength(sanitizedValue, 100)) {
        sanitizedValue = sanitizedValue.substring(0, 100);
      }
      
      // Mostrar advertencia si se removieron caracteres peligrosos
      if (originalValue !== sanitizedValue) {
        error = 'Se removieron caracteres no permitidos de la búsqueda';
      }
    }
    
    // Actualizar error de búsqueda
    if (key === 'search') {
      setSearchError(error);
    }
    
    const newFilters = { ...filters, [key]: sanitizedValue };
    if (sanitizedValue === '') {
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
    setSearchError(null);
    resetFilters();
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      filters.city ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.search ||
      filters.dateTypes?.length
    );
  };

  return (
    <div className="mb-6">
      {/* Filtros principales - reorganizados para móviles */}
      <div className="flex flex-col gap-3 w-full">
        {/* Primera fila: Ciudad y Fecha */}
        <div className="flex gap-3 w-full">
          <div className="w-1/2">
            {/* Ciudad */}
            <label className="block text-sm font-medium text-white/80 mb-1">Ciudad</label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm font-medium flex items-center gap-2 appearance-none pr-8"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {/* Flecha de select */}
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
          <div className="w-1/2">
            {/* Fecha */}
            <label className="block text-sm font-medium text-white/80 mb-1">Fecha</label>
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
                  className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm font-medium flex items-center justify-between gap-4 text-left hover:border-[#1a48c4] transition-colors"
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
        </div>
        {/* Segunda fila: Tipo de evento (dropdown en mobile) y selector de vista */}
        <div className="flex gap-3 w-full items-end">
          {/* Tipo de evento - dropdown en mobile, ToggleGroup en desktop */}
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-white/80 mb-1">Tipo de evento</label>
            {/* Mobile: dropdown */}
            <div className="block md:hidden" ref={typeDropdownRef}>
              <button
                className="w-full px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm text-white text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1a48c4]"
                onClick={() => setShowTypeDropdown((v) => !v)}
                type="button"
              >
                <span>
                  {filters.dateTypes && filters.dateTypes.length > 0
                    ? EVENT_TYPES.filter(t => filters.dateTypes?.includes(t.value)).map(t => t.label).join(', ')
                    : 'Todos'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showTypeDropdown && (
                <div className="absolute z-20 mt-2 w-full bg-[#101119] border border-white/20 rounded-md shadow-lg py-2 animate-fade-in">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-white text-sm hover:bg-[#1a48c4]/30 transition-colors ${filters.dateTypes?.includes(type.value) ? 'bg-[#1a48c4]/40' : ''}`}
                      onClick={() => {
                        let newTypes = filters.dateTypes ? [...filters.dateTypes] : [];
                        if (newTypes.includes(type.value)) {
                          newTypes = newTypes.filter((v) => v !== type.value);
                        } else {
                          // Exclusión lógica entre pago y gratis
                          if ((type.value === 'pago' && newTypes.includes('gratis')) || (type.value === 'gratis' && newTypes.includes('pago'))) {
                            newTypes = [type.value];
                          } else {
                            newTypes.push(type.value);
                          }
                        }
                        const newFilters = { ...filters, dateTypes: newTypes.length > 0 ? newTypes : undefined };
                        setFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                      type="button"
                    >
                      {type.icon}
                      <span>{type.label}</span>
                      {filters.dateTypes?.includes(type.value) && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Desktop: ToggleGroup */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <ToggleGroup.Root
                type="multiple"
                value={filters.dateTypes || []}
                onValueChange={handleDateTypesChange}
                className="flex flex-wrap gap-2"
              >
                {EVENT_TYPES.map((type) => (
                  <ToggleGroup.Item
                    key={type.value}
                    value={type.value}
                    className={
                      'flex items-center gap-1 px-2 sm:px-3 h-8 sm:h-10 rounded-lg border border-white/20 text-white/80 text-xs sm:text-sm font-medium transition-all duration-150 ' +
                      'data-[state=on]:bg-[#1a48c4] data-[state=on]:text-white data-[state=on]:border-[#1a48c4] ' +
                      'hover:bg-[#1a48c4]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1a48c4] focus:z-10'
                    }
                    aria-label={type.label}
                  >
                    {type.icon}
                    <span className="hidden sm:inline">{type.label}</span>
                    <span className="sm:hidden">{type.label.charAt(0)}</span>
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
              {hasActiveFilters() && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-white/60 hover:text-red-400 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded transition-colors duration-200 whitespace-nowrap"
                  style={{ minHeight: '32px' }}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Limpiar filtros</span>
                  <span className="sm:hidden">Limpiar</span>
                </button>
              )}
            </div>
          </div>
          {/* Selector de vista */}
          <div className="flex flex-col justify-end h-full gap-2 ml-2 pb-[2px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewModeChange('card')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'card' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
                aria-label="Vista en tarjetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
                aria-label="Vista en lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Tercera fila: Buscador */}
        <div className="w-full mt-1">
          <input
            type="text"
            placeholder="Buscar por nombre, artista o descripción"
            className={`w-full px-3 py-2 bg-[#101119] border rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50 text-sm ${searchError ? 'border-yellow-500' : 'border-white/20'}`}
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            maxLength={100}
          />
          {searchError && (
            <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {searchError}
            </p>
          )}
        </div>
        {/* Botón Limpiar filtros solo en mobile */}
        {hasActiveFilters() && (
          <div className="flex justify-end mt-2 md:hidden">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-white/60 hover:text-red-400 text-xs font-medium px-2 py-1 rounded transition-colors duration-200 whitespace-nowrap border border-transparent hover:border-red-400 bg-transparent"
              type="button"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFilters; 