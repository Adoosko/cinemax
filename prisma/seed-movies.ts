import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMovies() {
  console.log('🎬 Seeding movies...');

  const movies = [
    // Existing Quantum Nexus
    {
      id: 'quantum-nexus',
      title: 'Quantum Nexus',
      description:
        'A mind-bending sci-fi thriller that explores the boundaries of reality and consciousness across parallel dimensions.',
      duration: 148, // 2h 28m
      rating: 'PG-13',
      releaseDate: new Date('2024-03-01'),
      posterUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Sci-Fi', 'Thriller'],
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy', 'Elliot Page'],
      isActive: true,
    },

    // Digital Uprising - AI Thriller
    {
      id: 'digital-uprising',
      title: 'Digital Uprising',
      description:
        'When artificial intelligence evolves beyond human control, a cybersecurity expert must prevent a digital apocalypse.',
      duration: 132, // 2h 12m
      rating: 'R',
      releaseDate: new Date('2024-02-15'),
      posterUrl:
        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/91a7623d-2dd0-4e35-8873-b1ca3ca826c4.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Action', 'Thriller', 'Sci-Fi'],
      director: 'Denis Villeneuve',
      cast: ['Ryan Gosling', 'Scarlett Johansson', 'Oscar Isaac', 'Alicia Vikander'],
      isActive: true,
    },

    // Stellar Journey - Space Adventure
    {
      id: 'stellar-journey',
      title: 'Stellar Journey',
      description:
        "An epic space odyssey following humanity's first mission to colonize a distant galaxy beyond the Milky Way.",
      duration: 156, // 2h 36m
      rating: 'PG-13',
      releaseDate: new Date('2024-01-20'),
      posterUrl:
        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/5c5b6087-b959-4acc-816c-7c27df8d8f56.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      director: 'Ridley Scott',
      cast: ['Matthew McConaughey', 'Jessica Chastain', 'Anne Hathaway', 'Michael Caine'],
      isActive: true,
    },

    // Midnight Mansion - Horror
    {
      id: 'midnight-mansion',
      title: 'Midnight Mansion',
      description:
        'A group of paranormal investigators spend a night in the most haunted mansion in America, uncovering terrifying secrets.',
      duration: 98, // 1h 38m
      rating: 'R',
      releaseDate: new Date('2024-04-01'),
      posterUrl:
        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/4b3c8870-cca4-4746-bab7-c5aa647b2425.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Horror', 'Thriller'],
      director: 'James Wan',
      cast: ['Vera Farmiga', 'Patrick Wilson', 'Madison Wolfe', "Frances O'Connor"],
      isActive: true,
    },

    // Paris Hearts - Romantic Comedy
    {
      id: 'paris-hearts',
      title: 'Paris Hearts',
      description:
        'A charming romantic comedy about two strangers who meet in Paris and discover that love knows no boundaries.',
      duration: 112, // 1h 52m
      rating: 'PG',
      releaseDate: new Date('2024-02-14'),
      posterUrl:
        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/a726a7a0-174f-4eb8-ae30-65b940388a0c.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Romance', 'Comedy'],
      director: 'Nancy Meyers',
      cast: ['Emma Stone', 'Ryan Reynolds', 'Rachel McAdams', 'Hugh Grant'],
      isActive: true,
    },

    // Shadow Guardian - Superhero Action
    {
      id: 'shadow-guardian',
      title: 'Shadow Guardian',
      description:
        'A mysterious vigilante emerges from the shadows to protect the city from a powerful criminal syndicate.',
      duration: 144, // 2h 24m
      rating: 'PG-13',
      releaseDate: new Date('2024-05-01'),
      posterUrl:
        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/762d2b09-2f4f-4651-8461-deff1a81c638.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Action', 'Adventure', 'Crime'],
      director: 'Christopher Nolan',
      cast: ['Christian Bale', 'Margot Robbie', 'Michael Shannon', 'Gary Oldman'],
      isActive: true,
    },

    // Future Wars - Post-Apocalyptic Action
    {
      id: 'future-wars',
      title: 'Future Wars',
      description:
        'In a dystopian future, rebels fight against an oppressive regime using advanced technology and guerrilla warfare.',
      duration: 128, // 2h 8m
      rating: 'R',
      releaseDate: new Date('2024-03-15'),
      posterUrl:
        'https://images.unsplash.com/photo-1489599162406-d8e805b9b621?w=200&h=300&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Action', 'Thriller'],
      director: 'Rian Johnson',
      cast: ['Chris Evans', 'Tilda Swinton', 'Jamie Bell', 'Ed Harris'],
      isActive: true,
    },

    // Ocean's Mystery - Thriller Drama
    {
      id: 'oceans-mystery',
      title: "Ocean's Mystery",
      description:
        'A marine biologist discovers an ancient secret in the deepest parts of the ocean that could change humanity forever.',
      duration: 118, // 1h 58m
      rating: 'PG-13',
      releaseDate: new Date('2024-06-01'),
      posterUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=300&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Drama', 'Thriller', 'Adventure'],
      director: 'James Cameron',
      cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker', 'Michael Stuhlbarg'],
      isActive: true,
    },

    // Neon Nights - Crime Drama
    {
      id: 'neon-nights',
      title: 'Neon Nights',
      description:
        'A gritty crime drama set in the underground world of street racing and organized crime in Miami.',
      duration: 142, // 2h 22m
      rating: 'R',
      releaseDate: new Date('2024-07-15'),
      posterUrl: 'https://images.unsplash.com/photo-1551109307-7a5ae9398b0f?w=200&h=300&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Crime', 'Drama', 'Action'],
      director: 'Nicolas Winding Refn',
      cast: ['Oscar Isaac', 'Jessica Chastain', 'David Isaac', 'Abel Morales'],
      isActive: true,
    },

    // Coming Soon Movies
    {
      id: 'cosmic-dawn',
      title: 'Cosmic Dawn',
      description:
        'The first contact with an alien civilization brings both wonder and terror to Earth.',
      duration: 134, // 2h 14m
      rating: 'PG-13',
      releaseDate: new Date('2024-08-01'),
      posterUrl:
        'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=300&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genre: ['Sci-Fi', 'Drama'],
      director: 'Denis Villeneuve',
      cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker', 'Michael Stuhlbarg'],
      isActive: false, // Coming Soon
    },
  ];

  for (const movieData of movies) {
    try {
      const movie = await prisma.movie.upsert({
        where: { id: movieData.id },
        create: movieData,
        update: {},
      });
      console.log(`✅ Created/Updated movie: ${movie.title}`);
    } catch (error) {
      console.error(`❌ Error creating movie ${movieData.title}:`, error);
    }
  }

  console.log('🎬 Movies seeding completed!');
}

// Run the seeder if called directly
if (require.main === module) {
  seedMovies()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
