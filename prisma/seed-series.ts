import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSeries() {
  try {
    console.log('Seeding series data...');

    // Create a sample series
    const series = await prisma.series.create({
      data: {
        title: 'Breaking Bad',
        slug: 'breaking-bad',
        description:
          "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine to secure his family's future.",
        genres: ['Crime', 'Drama', 'Thriller'],
        releaseYear: 2008,
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        backdropUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
        cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'],
        director: 'Vince Gilligan',
        rating: 'TV-MA',
        isActive: true,
        isPublished: true,
        publishedAt: new Date('2008-01-20'),
      },
    });

    console.log('Created series:', series.title);

    // Create Season 1
    const season1 = await prisma.season.create({
      data: {
        seriesId: series.id,
        number: 1,
        title: 'Season 1',
        description:
          'Walter White begins his transformation from high school teacher to drug manufacturer.',
        releaseDate: new Date('2008-01-20'),
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        isActive: true,
      },
    });

    console.log('Created season:', season1.title);

    // Create episodes for Season 1
    const episodes = [
      {
        number: 1,
        title: 'Pilot',
        description:
          'Walter White, a struggling high school chemistry teacher, is diagnosed with inoperable lung cancer.',
        runtime: 58,
        airDate: new Date('2008-01-20'),
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      },
      {
        number: 2,
        title: "Cat's in the Bag...",
        description:
          'Walt and Jesse attempt to dispose of the bodies and Walt tries to come to terms with his actions.',
        runtime: 48,
        airDate: new Date('2008-01-27'),
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      },
      {
        number: 3,
        title: "...And the Bag's in the River",
        description:
          'Walt and Jesse face the consequences of their actions as they try to clean up the mess.',
        runtime: 48,
        airDate: new Date('2008-02-10'),
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      },
    ];

    for (const episodeData of episodes) {
      await prisma.episode.create({
        data: {
          seasonId: season1.id,
          ...episodeData,
          isActive: true,
        },
      });
    }

    console.log('Created episodes for Season 1');

    // Create Season 2
    const season2 = await prisma.season.create({
      data: {
        seriesId: series.id,
        number: 2,
        title: 'Season 2',
        description: 'Walter and Jesse expand their operation while dealing with new challenges.',
        releaseDate: new Date('2009-03-08'),
        coverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        isActive: true,
      },
    });

    console.log('Created season:', season2.title);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding series data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSeries();
