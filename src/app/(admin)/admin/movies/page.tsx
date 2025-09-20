import { MoviesAdminClient } from '@/components/admin/movies-admin-client';
import { CachedMoviesData } from '@/components/admin/cached-movies-data';

export default async function MoviesAdmin() {
  const cachedData = await CachedMoviesData({ isAdmin: true });

  return <MoviesAdminClient initialMovies={cachedData.movies} />;
}
