import axios from 'axios';
import { Event, EventFilters, EventListResponse, PaginationParams, EventRequest, EventRequestCreate, EventRequestStatusUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL;
console.log('[API_URL]', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para logging y manejo de errores
apiClient.interceptors.request.use((config) => {
  console.log('Request final:', {
    baseURL: config.baseURL,
    url: config.url,
    fullURL: `${config.baseURL}${config.url}`,
    method: config.method,
    headers: config.headers
  });
  
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const getEvents = async (
  filters: EventFilters = {},
  pagination: PaginationParams = { skip: 0, limit: 12 }
): Promise<EventListResponse> => {
  const { genre, city, dateFrom, dateTo, search, dateTypes } = filters;
  const { skip, limit } = pagination;

  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  if (genre) params.append('genre', genre);
  if (city) params.append('city', city);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (search) params.append('search', search);
  if (dateTypes && dateTypes.length > 0) {
    dateTypes.forEach((type) => params.append('date_types', type));
  }

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

export const deleteEventsBulk = async (ids: number[]): Promise<{ detail: string; deleted_count: number }> => {
  console.log('Sending bulk delete request with IDs:', ids);
  const response = await apiClient.post('/events/bulk-delete', { 
    event_ids: ids
  });
  console.log('Bulk delete response:', response.data);
  return response.data;
};

export const createEventRequest = async (data: EventRequestCreate): Promise<EventRequest> => {
  const response = await apiClient.post('/event-requests/', data);
  return response.data;
};

export const getEventRequests = async (status?: string): Promise<EventRequest[]> => {
  const params = status ? { status } : {};
  const response = await apiClient.get('/event-requests/', { params });
  return response.data;
};

export const updateEventRequestStatus = async (id: number, status: string): Promise<EventRequest> => {
  const response = await apiClient.put(`/event-requests/${id}/status`, { status });
  return response.data;
}; 