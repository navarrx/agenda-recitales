import { useState, useEffect } from 'react';
import { EventFilters as FilterTypes } from '../../types';
import { useEventStore } from '../../store/eventStore';

interface EventFiltersProps {
  onFilterChange: (filters: FilterTypes) => void;
}

const EventFilters = ({ onFilterChange }: EventFiltersProps) => {
  const { genres, cities, fetchGenres, fetchCities } = useEventStore();
  const [filters, setFilters] = useState<FilterTypes>({});
  
  useEffect(() => {
    fetchGenres();
    fetchCities();
  }, [fetchGenres, fetchCities]);
  
  const handleFilterChange = (key: keyof FilterTypes, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    
    // If empty string, remove the filter
    if (value === '') {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtrar eventos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Género musical
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ciudad
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
          />
        </div>
      </div>
      
      <div className="mt-4">
        <input
          type="text"
          placeholder="Buscar por nombre, artista o descripción"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
        />
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

export default EventFilters; 