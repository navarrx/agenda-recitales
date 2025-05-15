export interface Event {
  id: number;
  name: string;
  artist: string;
  genre: string;
  date: string;
  location: string;
  city: string;
  venue: string;
  description: string;
  image_url: string | null;
  ticket_url: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventListResponse {
  items: Event[];
  total: number;
}

export interface EventFilters {
  genre?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginationParams {
  skip: number;
  limit: number;
} 