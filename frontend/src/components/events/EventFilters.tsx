import { useState, useEffect, useRef } from 'react';
import { EventFilters as FilterTypes } from '../../types';
import { useEventStore } from '../../store/eventStore';
import Calendar from '../Calendar';
import { format as formatDate } from 'date-fns';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { DollarSign, Ticket, Music, Mic, Disc3, X } from 'lucide-react';
import { sanitizeSearchText, validateLength } from '../../utils/security';

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
  const { filters: globalFilters, resetFilters, genres, fetchGenres } = useEventStore();
  const [filters, setFilters] = useState<FilterTypes>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  // 1. Estado para mostrar/ocultar el dropdown de género
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // Debug: Log genres when they change
  useEffect(() => {
    console.log('[EventFilters] Genres loaded:', genres);
  }, [genres]);

  // Sincronizar estado local con filtros globales
  useEffect(() => {
    setFilters(globalFilters || {});
    if (globalFilters?.dateFrom && globalFilters?.dateTo && globalFilters.dateFrom === globalFilters.dateTo) {
      // Corregir desfase de zona horaria: crear Date local a partir de YYYY-MM-DD
      const [year, month, day] = globalFilters.dateFrom.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      setSelectedDate(date);
      setSelectedDateRange({ start: date, end: null });
    } else if (globalFilters?.dateFrom && globalFilters?.dateTo) {
      // Rango de fechas
      const [startYear, startMonth, startDay] = globalFilters.dateFrom.split('-');
      const [endYear, endMonth, endDay] = globalFilters.dateTo.split('-');
      const startDate = new Date(Number(startYear), Number(startMonth) - 1, Number(startDay));
      const endDate = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay));
      setSelectedDate(startDate);
      setSelectedDateRange({ start: startDate, end: endDate });
    } else {
      setSelectedDate(null);
      setSelectedDateRange({ start: null, end: null });
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

  // 2. Cerrar dropdown de género al hacer click fuera
  useEffect(() => {
    if (!showGenreDropdown) return;
    function handleClick(e: MouseEvent) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setShowGenreDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showGenreDropdown]);

  // 3. Cerrar dropdown del calendario al hacer click fuera
  useEffect(() => {
    if (!showCalendar) return;
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

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

  // Handlers para el nuevo calendario
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    setSelectedDateRange(range);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleCalendarCancel = () => {
    setSelectedDate(null);
    setSelectedDateRange({ start: null, end: null });
    setShowCalendar(false);
    
    // Limpiar filtros de fecha
    const newFilters = { ...filters };
    delete newFilters.dateFrom;
    delete newFilters.dateTo;
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCalendarConfirm = () => {
    const newFilters = { ...filters };
    
    if (selectedDateRange.start) {
      const startDate = formatDate(selectedDateRange.start, 'yyyy-MM-dd');
      newFilters.dateFrom = startDate;
      
      if (selectedDateRange.end) {
        const endDate = formatDate(selectedDateRange.end, 'yyyy-MM-dd');
        newFilters.dateTo = endDate;
      } else {
        // Si solo hay fecha de inicio, usar la misma como fecha final
        newFilters.dateTo = startDate;
      }
    } else {
      // Limpiar filtros de fecha si no hay selección
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    setShowCalendar(false);
  };

  const handleClearFilters = () => {
    setSelectedDate(null);
    setSelectedDateRange({ start: null, end: null });
    setFilters({});
    setSearchError(null);
    resetFilters();
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      filters.dateFrom ||
      filters.dateTo ||
      filters.search ||
      filters.genre ||
      filters.dateTypes?.length
    );
  };

  // Función para obtener el texto del botón de fecha
  const getDateButtonText = () => {
    if (selectedDateRange.start && selectedDateRange.end) {
      if (selectedDateRange.start.getTime() === selectedDateRange.end.getTime()) {
        return selectedDateRange.start.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
      } else {
        const startDate = selectedDateRange.start.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
        const endDate = selectedDateRange.end.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
        return `${startDate} - ${endDate}`;
      }
    } else if (selectedDateRange.start) {
      return selectedDateRange.start.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      });
    }
    return 'Seleccionar';
  };

  return (
    <div className="mb-6">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeInCalendar {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out;
          }
          
          .animate-fade-in-calendar {
            animation: fadeInCalendar 0.3s ease-out;
          }
        `}
      </style>
      
      {/* Filtros principales - reorganizados para móviles */}
      <div className="flex flex-col gap-3 w-full">
        {/* Primera fila: Filtros y selector de vista */}
        <div className="flex gap-3 w-full items-end">
          {/* Contenedor de filtros Tipo, Fecha y Género */}
          <div className="flex gap-3 items-end">
            {/* Tipo de evento - dropdown en mobile, ToggleGroup en desktop */}
            <div className="relative">
              <label className="block text-sm font-medium text-white/80 mb-1">Tipo</label>
              {/* Mobile: dropdown */}
              <div className="block md:hidden" ref={typeDropdownRef}>
                <button
                  className="w-[90px] px-2 py-1.5 bg-[#101119] border border-white/20 rounded-md shadow-sm text-white text-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1a48c4] min-w-0 md:w-[120px] md:px-3 md:py-2 md:text-sm"
                  onClick={() => setShowTypeDropdown((v) => !v)}
                  type="button"
                >
                  <span className="truncate text-left flex-1 mr-2 overflow-hidden whitespace-nowrap">
                    {filters.dateTypes && filters.dateTypes.length > 0
                      ? EVENT_TYPES.filter(t => filters.dateTypes?.includes(t.value)).map(t => t.label).join(', ')
                      : 'Todos'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showTypeDropdown && (
                  <div className="absolute z-20 mt-2 min-w-[110px] bg-[#101119] border border-white/20 rounded-md shadow-lg py-1 animate-fade-in md:min-w-[140px] md:py-2">
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-white text-sm hover:bg-[#1a48c4]/30 transition-colors min-w-0 ${filters.dateTypes?.includes(type.value) ? 'bg-[#1a48c4]/40' : ''}`}
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
                        <div className="flex-shrink-0">{type.icon}</div>
                        <span className="flex-1 truncate overflow-hidden whitespace-nowrap">{type.label}</span>
                        {filters.dateTypes?.includes(type.value) && (
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0"><path d="M5 13l4 4L19 7" /></svg>
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
              </div>
            </div>
            {/* Fecha - Nuevo calendario */}
            <div className="w-[90px] md:w-36 relative">
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha</label>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-[90px] px-2 py-1.5 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-xs font-medium flex items-center justify-between gap-2 text-left hover:border-[#1a48c4] transition-colors md:w-full md:px-3 md:py-2 md:text-sm md:gap-4"
                type="button"
              >
                <span className={`${selectedDateRange.start ? '' : 'text-white/50'} truncate whitespace-nowrap overflow-hidden flex-1`}>
                  {getDateButtonText()}
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform duration-200 flex-shrink-0 ${showCalendar ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              
              {/* Dropdown del calendario */}
              {showCalendar && (
                <>
                  {/* Overlay para móviles */}
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={handleCalendarCancel}
                  />
                  {/* Calendario */}
                  <div 
                    className="fixed md:absolute z-50 bg-[#101119] border border-white/20 rounded-lg shadow-lg p-4 animate-fade-in-calendar md:animate-fade-in md:mt-2 md:left-0 md:transform-none left-1/2 transform -translate-x-1/2 w-[calc(100vw-2rem)] md:w-auto md:min-w-[320px] md:max-w-[400px] top-[50vh] md:top-auto -translate-y-1/2 md:translate-y-0" 
                    ref={calendarRef}
                  >
                  <Calendar
                    selectedDate={selectedDate}
                    selectedDateRange={selectedDateRange}
                    onDateSelect={handleDateSelect}
                    onDateRangeChange={handleDateRangeChange}
                    onDateChange={handleDateChange}
                    onCancel={handleCalendarCancel}
                    onConfirm={handleCalendarConfirm}
                  />
                  </div>
                </>
              )}
            </div>
            {/* Género - dropdown custom igual al de Tipo */}
            <div className="w-[90px] relative md:w-36 ml-5 md:ml-0">
              <label className="block text-sm font-medium text-white/80 mb-1">Género</label>
              {/* Mobile: dropdown custom */}
              <div className="block md:hidden" ref={genreDropdownRef}>
                <button
                  className="w-[90px] px-2 py-1.5 bg-[#101119] border border-white/20 rounded-md shadow-sm text-white text-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1a48c4] min-w-0 md:w-[120px] md:px-3 md:py-2 md:text-sm"
                  onClick={() => {
                    console.log('[EventFilters] Genre dropdown clicked, current genres:', genres);
                    setShowGenreDropdown((v) => !v);
                  }}
                  type="button"
                >
                  <span className="truncate text-left flex-1 mr-2 overflow-hidden whitespace-nowrap">
                    {filters.genre ? filters.genre : 'Todos'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showGenreDropdown && (
                  <div className="absolute z-20 mt-2 min-w-[110px] bg-[#101119] border border-white/20 rounded-md shadow-lg py-1 animate-fade-in md:min-w-[140px] md:py-2">
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-white text-sm hover:bg-[#1a48c4]/30 transition-colors min-w-0 ${!filters.genre ? 'bg-[#1a48c4]/40' : ''}`}
                      onClick={() => {
                        setFilters({ ...filters, genre: undefined });
                        onFilterChange({ ...filters, genre: undefined });
                        setShowGenreDropdown(false);
                      }}
                      type="button"
                    >
                      <span className="flex-1 truncate overflow-hidden whitespace-nowrap">Todos</span>
                      {!filters.genre && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0"><path d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                    {genres.map((genre) => {
                      console.log('[EventFilters] Rendering genre:', genre);
                      return (
                        <button
                          key={genre}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-white text-sm hover:bg-[#1a48c4]/30 transition-colors min-w-0 ${filters.genre === genre ? 'bg-[#1a48c4]/40' : ''}`}
                          onClick={() => {
                            setFilters({ ...filters, genre });
                            onFilterChange({ ...filters, genre });
                            setShowGenreDropdown(false);
                          }}
                          type="button"
                        >
                          <span className="flex-1 truncate overflow-hidden whitespace-nowrap">{genre}</span>
                          {filters.genre === genre && (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0"><path d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Desktop: select nativo (puedes migrar a custom si quieres máxima coherencia) */}
              <div className="hidden md:block">
                <div className="relative">
                  <select
                    className="w-36 px-3 py-2 bg-[#101119] border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white text-sm font-medium flex items-center gap-2 appearance-none pr-8"
                    value={filters.genre || ''}
                    onChange={(e) => handleFilterChange('genre', e.target.value || undefined)}
                  >
                    <option value="">Todos</option>
                    {genres.map((genre) => {
                      console.log('[EventFilters] Desktop select - rendering genre:', genre);
                      return (
                        <option key={genre} value={genre}>{genre}</option>
                      );
                    })}
                  </select>
                  {/* Flecha de select */}
                  <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
            </div>
            {/* Limpiar filtros (desktop) */}
            {hasActiveFilters() && (
              <button
                onClick={handleClearFilters}
                className="hidden md:flex items-center gap-1 text-white/60 hover:text-red-400 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded transition-colors duration-200 whitespace-nowrap border border-transparent hover:border-red-400 bg-transparent h-10"
                type="button"
                style={{ alignSelf: 'flex-end' }}
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Limpiar filtros</span>
                <span className="sm:hidden">Limpiar</span>
              </button>
            )}
          </div>
          {/* Selector de vista (solo desktop) */}
          <div className="hidden md:flex flex-col justify-end h-full gap-2 pb-[2px] ml-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewModeChange('card')}
                className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
                aria-label="Vista en tarjetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
                aria-label="Vista en lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Tercera fila: Buscador + Selector de vista (mobile) */}
        <div className="w-full mt-1 flex items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, artista, ciudad o venue"
            className={`w-full px-3 py-2 bg-[#101119] border rounded-md shadow-sm focus:outline-none focus:ring-[#1a48c4] focus:border-[#1a48c4] text-white placeholder-white/50 text-sm ${searchError ? 'border-yellow-500' : 'border-white/20'}`}
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            maxLength={100}
          />
          {/* Selector de vista (solo mobile) */}
          <div className="flex md:hidden items-center ml-2 gap-1">
            <button
              onClick={() => onViewModeChange('card')}
              className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
              aria-label="Vista en tarjetas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'text-[#1a48c4]' : 'text-white/50 hover:text-white/70'}`}
              aria-label="Vista en lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
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