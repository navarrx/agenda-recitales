import { create } from 'zustand';
import { Event, EventFilters, PaginationParams } from '../types';
import { getEvents, getEvent, getGenres, getCities } from '../services/api';

interface EventState {
  events: Event[];
  event: Event | null;
  genres: string[];
  cities: string[];
  filters: EventFilters;
  pagination: PaginationParams;
  loading: boolean;
  totalEvents: number;
  hasMore: boolean;
  
  // Actions
  fetchEvents: () => Promise<void>;
  fetchEvent: (id: number) => Promise<void>;
  fetchGenres: () => Promise<void>;
  fetchCities: () => Promise<void>;
  setFilters: (filters: Partial<EventFilters>) => void;
  resetFilters: () => void;
  loadMoreEvents: () => Promise<void>;
}

const DEFAULT_PAGINATION: PaginationParams = {
  skip: 0,
  limit: 12,
};

const DEFAULT_FILTERS: EventFilters = {
  genre: undefined,
  city: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  search: undefined,
};

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  event: null,
  genres: [],
  cities: [],
  filters: DEFAULT_FILTERS,
  pagination: DEFAULT_PAGINATION,
  loading: false,
  totalEvents: 0,
  hasMore: true,

  fetchEvents: async () => {
    try {
      set({ loading: true });
      const { filters, pagination } = get();
      const response = await getEvents(filters, pagination);
      
      set({
        events: response.items,
        totalEvents: response.total,
        hasMore: pagination.skip + pagination.limit < response.total,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      set({ loading: false });
    }
  },

  fetchEvent: async (id: number) => {
    try {
      set({ loading: true });
      const eventData = await getEvent(id);
      set({ event: eventData, loading: false });
    } catch (error) {
      console.error('Error fetching event details:', error);
      set({ loading: false });
    }
  },

  fetchGenres: async () => {
    try {
      const genres = await getGenres();
      set({ genres });
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  },

  fetchCities: async () => {
    try {
      const cities = await getCities();
      set({ cities });
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: DEFAULT_PAGINATION, // Reset pagination when filters change
    }));
    // Fetch events with new filters
    get().fetchEvents();
  },

  resetFilters: () => {
    set({
      filters: DEFAULT_FILTERS,
      pagination: DEFAULT_PAGINATION,
    });
  },

  loadMoreEvents: async () => {
    const { pagination, events, hasMore, filters } = get();
    
    if (!hasMore || get().loading) return;
    
    try {
      set({ loading: true });
      
      const nextPagination = {
        skip: pagination.skip + pagination.limit,
        limit: pagination.limit,
      };
      
      const response = await getEvents(filters, nextPagination);
      
      set({
        events: [...events, ...response.items],
        pagination: nextPagination,
        hasMore: nextPagination.skip + nextPagination.limit < response.total,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading more events:', error);
      set({ loading: false });
    }
  },
})); 