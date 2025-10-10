import axios from 'axios';
import type { ArtworksApiResponse, Artwork } from '../types/artwork';

const API_BASE_URL = 'https://api.artic.edu/api/v1/artworks';

// The fields we want the API to return
const API_FIELDS = [
  'id',
  'title',
  'place_of_origin',
  'artist_display',
  'inscriptions',
  'date_start',
  'date_end',
].join(',');

/**
 * Fetches a paginated list of artworks from the API.
 * @param page - The page number to fetch.
 * @param limit - The number of items per page.
 * @returns A promise that resolves to the data and total record count.
 */
export const getArtworks = async (page: number, limit: number): Promise<{ data: Artwork[], total: number }> => {
  try {
    const response = await axios.get<ArtworksApiResponse>(API_BASE_URL, {
      params: {
        page,
        limit,
        fields: API_FIELDS,
      },
    });

    return {
      data: response.data.data,
      total: response.data.pagination.total,
    };
  } catch (error) {
    console.error('Error fetching artworks:', error);
    // Return empty state in case of an error
    return { data: [], total: 0 };
  }
};