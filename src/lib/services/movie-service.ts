import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getFeaturedMovies(limit = 3) {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        releaseDate: 'desc',
      },
      take: limit,
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
        showtimes: {
          where: {
            startTime: {
              gte: new Date(),
            },
            isActive: true,
          },
          take: 1,
        },
      },
    });

    return movies.map((movie) => {
      // Calculate average rating
      const avgRating =
        movie.reviews.length > 0
          ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) / movie.reviews.length
          : null;

      // Format movie data for the UI
      return {
        id: movie.id,
        title: movie.title,
        description: movie.description || '',
        image:
          movie.posterUrl ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=1200&fit=crop',
        backdrop:
          movie.posterUrl?.replace('w=200&h=300', 'w=1920&h=1080') ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
        rating: avgRating ? Number(avgRating.toFixed(1)) : 8.5,
        duration: `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`,
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Drama',
        hasShowtimes: movie.showtimes.length > 0,
      };
    });
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    return [];
  }
}

export async function getAllMovies(limit = 10) {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        releaseDate: 'desc',
      },
      take: limit,
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    return movies.map((movie) => {
      // Calculate average rating
      const avgRating =
        movie.reviews.length > 0
          ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) / movie.reviews.length
          : null;

      return {
        id: movie.id,
        title: movie.title,
        description: movie.description || '',
        image:
          movie.posterUrl ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=1200&fit=crop',
        rating: avgRating ? Number(avgRating.toFixed(1)) : 8.5,
        duration: `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`,
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Drama',
        releaseDate: movie.releaseDate,
      };
    });
  } catch (error) {
    console.error('Error fetching all movies:', error);
    return [];
  }
}
