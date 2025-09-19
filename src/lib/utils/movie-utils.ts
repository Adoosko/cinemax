/**
 * Utility functions for movie data handling
 */

/**
 * Generate a URL-friendly slug from a movie title
 * @param title - The movie title
 * @returns A URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Format movie duration from minutes to readable format
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 28m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
}

/**
 * Format movie rating for display
 * @param rating - Rating string or number
 * @returns Formatted rating number
 */
export function formatMovieRating(rating: string | number | null | undefined): number {
  if (!rating) return 8.5; // Default rating

  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 8.5 : parsed;
  }

  return rating;
}

/**
 * Format release date for display
 * @param releaseDate - Release date
 * @returns Formatted year string
 */
export function formatReleaseYear(releaseDate: Date | string | null | undefined): string {
  if (!releaseDate) return '2024';

  const date = typeof releaseDate === 'string' ? new Date(releaseDate) : releaseDate;
  return date.getFullYear().toString();
}

/**
 * Format genre array to string
 * @param genre - Genre array or string
 * @returns Formatted genre string
 */
export function formatGenre(genre: string[] | string | null | undefined): string {
  if (!genre) return 'Drama';

  if (Array.isArray(genre)) {
    return genre.length > 0 ? genre.join(', ') : 'Drama';
  }

  return genre;
}
