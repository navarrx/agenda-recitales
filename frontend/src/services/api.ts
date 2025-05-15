import axios from 'axios';
import { Event, EventFilters, EventListResponse, PaginationParams } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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