// Defines the structure for a single artwork object based on API fields
export interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

// Defines the structure of the pagination object from the API response
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

// Defines the structure for the entire API response
export interface ArtworksApiResponse {
  pagination: Pagination;
  data: Artwork[];
}