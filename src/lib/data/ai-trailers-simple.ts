'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AiTrailerStatus =
  | 'PENDING'
  | 'GENERATING_SCRIPT'
  | 'GENERATING_AUDIO'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED';

export interface AiTrailerData {
  id: string;
  movieId: string;
  script: string;
  fileUrl: string;
  fileSize: number;
  voiceStyle: string;
  status: AiTrailerStatus;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  movie?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface CreateAiTrailerData {
  movieId: string;
  script?: string;
  fileUrl?: string;
  fileSize?: number;
  voiceStyle: string;
  status?: AiTrailerStatus;
  createdBy?: string;
}

// Create a new AI trailer record
export async function createAiTrailer(data: CreateAiTrailerData): Promise<AiTrailerData> {
  try {
    const trailer = await prisma.aiTrailer.create({
      data: {
        movieId: data.movieId,
        script: data.script || '',
        fileUrl: data.fileUrl || '',
        fileSize: data.fileSize || 0,
        voiceStyle: data.voiceStyle,
        status: data.status || 'PENDING',
        createdBy: data.createdBy,
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return trailer as any; // Type assertion to avoid complex type mapping
  } catch (error) {
    console.error('Error creating AI trailer:', error);
    throw new Error(
      `Failed to create AI trailer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Update an existing AI trailer
export async function updateAiTrailer(
  id: string,
  data: Partial<CreateAiTrailerData>
): Promise<AiTrailerData> {
  try {
    const trailer = await prisma.aiTrailer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return trailer as any;
  } catch (error) {
    console.error('Error updating AI trailer:', error);
    throw new Error(
      `Failed to update AI trailer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Get AI trailers for a movie
export async function getAiTrailersByMovieId(movieId: string): Promise<AiTrailerData[]> {
  try {
    const trailers = await prisma.aiTrailer.findMany({
      where: { movieId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return trailers as any;
  } catch (error) {
    console.error('Error fetching AI trailers for movie:', error);
    return [];
  }
}

// Check if a movie already has a trailer with the same voice style
export async function hasExistingTrailer(movieId: string, voiceStyle: string): Promise<boolean> {
  try {
    const existing = await prisma.aiTrailer.findFirst({
      where: {
        movieId,
        voiceStyle,
        status: 'COMPLETED',
      },
    });

    return !!existing;
  } catch (error) {
    console.error('Error checking existing trailer:', error);
    return false;
  }
}
