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
  date_types: string[] | null;
  ticket_price: number | null;
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
  dateTypes?: string[];
}

export interface PaginationParams {
  skip: number;
  limit: number;
}

export interface EventRequest {
  id: number;
  name: string;
  email: string;
  event_name: string;
  artist: string;
  date: string;
  venue: string;
  city: string;
  ticket_url: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EventRequestCreate {
  name: string;
  email: string;
  event_name: string;
  artist: string;
  date: string;
  venue: string;
  city: string;
  ticket_url: string;
  message?: string;
}

export interface EventRequestStatusUpdate {
  status: string;
} 