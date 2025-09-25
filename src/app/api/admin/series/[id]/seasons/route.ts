import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface EpisodeData {
  number: number;
  title?: string;
  overview?: string;
  runtime?: number;
  still_path?: string;
}

interface SeasonData {
  number: number;
  title?: string;
  overview?: string;
  episodeCount?: number;
  posterUrl?: string;
  episodes?: EpisodeData[];
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const prisma = new PrismaClient();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = (await request.json()) as { seasons: SeasonData[] };
    const { seasons } = data;

    if (!seasons || !Array.isArray(seasons)) {
      return NextResponse.json({ error: 'Seasons data is required' }, { status: 400 });
    }

    const { id: seriesId } = await params;

    // Check if series exists
    const series = await prisma.series.findUnique({
      where: { id: seriesId },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Create seasons and episodes
    const createdSeasons = [];

    for (const seasonData of seasons) {
      const { number, title, overview, episodeCount, episodes } = seasonData;

      // Check if season already exists
      const existingSeason = await prisma.season.findFirst({
        where: {
          seriesId,
          number,
        },
      });

      let season;
      if (existingSeason) {
        // Update existing season
        season = await prisma.season.update({
          where: { id: existingSeason.id },
          data: {
            title: title || `Season ${number}`,
            description: overview || '',
            coverUrl: seasonData.posterUrl || null,
          },
        });
      } else {
        // Create new season
        season = await prisma.season.create({
          data: {
            number,
            title: title || `Season ${number}`,
            description: overview || '',
            seriesId,
            coverUrl: seasonData.posterUrl || null,
          },
        });
      }

      createdSeasons.push(season);

      // Create or update episodes if provided
      if (episodes && Array.isArray(episodes)) {
        for (const episodeData of episodes) {
          // Check if episode already exists
          const existingEpisode = await prisma.episode.findFirst({
            where: {
              seasonId: season.id,
              number: episodeData.number,
            },
          });

          if (existingEpisode) {
            // Update existing episode
            await prisma.episode.update({
              where: { id: existingEpisode.id },
              data: {
                title: episodeData.title || `Episode ${episodeData.number}`,
                description: episodeData.overview || '',
                runtime: episodeData.runtime || 0,
                coverUrl: episodeData.still_path
                  ? `https://image.tmdb.org/t/p/w300${episodeData.still_path}`
                  : null,
              },
            });
          } else {
            // Create new episode
            await prisma.episode.create({
              data: {
                number: episodeData.number,
                title: episodeData.title || `Episode ${episodeData.number}`,
                description: episodeData.overview || '',
                runtime: episodeData.runtime || 0,
                seasonId: season.id,
                coverUrl: episodeData.still_path
                  ? `https://image.tmdb.org/t/p/w300${episodeData.still_path}`
                  : null,
              },
            });
          }
        }
      } else if (episodeCount) {
        // Create placeholder episodes based on episode count
        for (let i = 1; i <= episodeCount; i++) {
          // Check if episode already exists
          const existingEpisode = await prisma.episode.findFirst({
            where: {
              seasonId: season.id,
              number: i,
            },
          });

          if (!existingEpisode) {
            await prisma.episode.create({
              data: {
                number: i,
                title: `Episode ${i}`,
                description: '',
                runtime: 0,
                seasonId: season.id,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${createdSeasons.length} seasons to the series`,
      seasons: createdSeasons,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding seasons:', errorMessage);
    return NextResponse.json({ error: 'Failed to add seasons' }, { status: 500 });
  }
}
