import axios from 'axios';
import { Event, EventFilters, EventListResponse, PaginationParams } from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://agenda-backend-production.up.railway.app');
console.log('[API_URL]', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Añadir el interceptor aquí
apiClient.interceptors.request.use((config) => {
  // Asegurarse de que baseURL use HTTPS en producción
  if (config.baseURL && config.baseURL.startsWith('http://') && !import.meta.env.DEV) {
    console.log('Forzando HTTPS en baseURL:', config.baseURL);
    config.baseURL = config.baseURL.replace('http://', 'https://');
  }
  
  // Asegurarse de que la URL completa use HTTPS en producción
  if (config.url && config.url.startsWith('http://') && !import.meta.env.DEV) {
    console.log('Forzando HTTPS en URL:', config.url);
    config.url = config.url.replace('http://', 'https://');
  }
  
  // Añadir más logs para depuración
  console.log('Request final:', {
    baseURL: config.baseURL,
    url: config.url,
    fullURL: `${config.baseURL}${config.url}`
  });
  
  return config;
});

export const getEvents = async (
  filters: EventFilters = {},
  pagination: PaginationParams = { skip: 0, limit: 12 }
): Promise<EventListResponse> => {
  const { genre, city, dateFrom, dateTo, search } = filters;
  const { skip, limit } = pagination;

  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  if (genre) params.append('genre', genre);
  if (city) params.append('city', city);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (search) params.append('search', search);

  const response = await apiClient.get(`/events?${params.toString()}`);
  return response.data;
};

export const getEvent = async (id: number): Promise<Event> => {
  const response = await apiClient.get(`/events/${id}`);
  return response.data;
};

export const getGenres = async (): Promise<string[]> => {
  const response = await apiClient.get('/events/filters/genres');
  return response.data;
};

export const getCities = async (): Promise<string[]> => {
  const response = await apiClient.get('/events/filters/cities');
  return response.data;
};

export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> => {
  const response = await apiClient.post('/events', event);
  return response.data;
};

export const updateEvent = async (id: number, event: Partial<Event>): Promise<Event> => {
  const response = await apiClient.put(`/events/${id}`, event);
  return response.data;
};

export const deleteEvent = async (id: number): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
}; 