'use server';

import { unstable_cache } from 'next/cache';

// NOTE: This file is not automatically updated. Please update it manually.
export type Series = {
  id: string;
  title: string;
  description: string;
  genre: string[];
  rating?: string;
  director: string;
  cast: string[];
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
};

// Cache the series fetch for 1 minute (60 seconds)
export const getSeries = unstable_cache(
  async (isAdmin: boolean = false): Promise<Series[]> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const endpoint = isAdmin ? '/api/admin/series' : '/api/series';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        next: { tags: ['series'] },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch series: ${response.status}`);
      }

      const data = await response.json();
      return data.series || [];
    } catch (error) {
      console.error('Error fetching series:', error);
      return [];
    }
  },
  ['series'],
  { revalidate: 60, tags: ['series'] }
);

// Cache a single series fetch for 1 minute
export const getSeriesById = unstable_cache(
  async (id: string): Promise<Series | null> => {
    try {
      const url = new URL(`/api/series/${id}`, ``);
      const response = await fetch(url, {
        next: { tags: [`series-${id}`] },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch series: ${response.status}`);
      }
      const data = await response.json();
      return data.series || null;
    } catch (error) {
      console.error(`Error fetching series ${id}:`, error);
      return null;
    }
  },
  ['series-by-id'],
  { revalidate: 60, tags: ['series'] }
);
// Cache a single series fetch by slug for 1 minute
export const getSeriesBySlug = unstable_cache(
  async (slug: string): Promise<Series | null> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/series/slug/${slug}`, {
        next: { tags: [`series-${slug}`] },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch series by slug: ${response.status}`);
      }
      const data = await response.json();
      return data.series || null;
    } catch (error) {
      console.error(`Error fetching series by slug ${slug}:`, error);
      return null;
    }
  },
  ['series-by-slug'],
  { revalidate: 60, tags: ['series'] }
);
// Function to revalidate the series cache
export async function revalidateSeriesCache() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const revalidateResponse = await fetch(`${baseUrl}/api/revalidate?tag=series`, {
      method: 'POST',
    });
    if (!revalidateResponse.ok) {
      throw new Error(`Failed to revalidate: ${revalidateResponse.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error revalidating series cache:', error);
    return false;
  }
}
// Add a series and revalidate the cache
export async function addSeries(seriesData: Partial<Series>): Promise<Series | null> {
  try {
    // Use full URL to ensure correct routing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/series`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seriesData),
    });
    if (!response.ok) {
      throw new Error(`Failed to add series: ${response.status}`);
    }
    const { series } = await response.json();
    // Revalidate the cache
    await revalidateSeriesCache();
    return series;
  } catch (error) {
    console.error('Error adding series:', error);
    return null;
  }
}
// Update a series and revalidate the cache
export async function updateSeries(
  id: string,
  seriesData: Partial<Series>
): Promise<Series | null> {
  try {
    const url = new URL(
      `/api/admin/series/${id}`,
      process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk'
    );
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seriesData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update series: ${response.status}`);
    }
    const { series } = await response.json();
    // Revalidate the cache
    await revalidateSeriesCache();
    return series;
  } catch (error) {
    console.error(`Error updating series ${id}:`, error);
    return null;
  }
}
// Delete a series and revalidate the cache
export async function deleteSeries(id: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/series/${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `Failed to delete series: ${response.status} - ${errorData.error || response.statusText}`
      );
    }
    // Revalidate the cache
    await revalidateSeriesCache();
    return true;
  } catch (error) {
    console.error(`Error deleting series ${id}:`, error);
    return false;
  }
}
