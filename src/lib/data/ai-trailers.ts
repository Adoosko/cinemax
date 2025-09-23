'use server';

import { PrismaClient, AiTrailerStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
  script: string;
  fileUrl: string;
  fileSize: number;
  voiceStyle: string;
  status?: AiTrailerStatus;
  createdBy?: string;
}

export interface UpdateAiTrailerData {
  script?: string;
  fileUrl?: string;
  fileSize?: number;
  voiceStyle?: string;
  status?: AiTrailerStatus;
  errorMessage?: string | null;
}

// Create a new AI trailer record
export async function createAiTrailer(data: CreateAiTrailerData): Promise<AiTrailerData> {
  try {
    const trailer = await prisma.aiTrailer.create({
      data: {
        movieId: data.movieId,
        script: data.script,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        voiceStyle: data.voiceStyle,
        status: data.status || AiTrailerStatus.COMPLETED,
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

    return trailer as AiTrailerData;
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
  data: UpdateAiTrailerData
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

    return trailer as AiTrailerData;
  } catch (error) {
    console.error('Error updating AI trailer:', error);
    throw new Error(
      `Failed to update AI trailer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Get AI trailer by ID
export async function getAiTrailerById(id: string): Promise<AiTrailerData | null> {
  try {
    const trailer = await prisma.aiTrailer.findUnique({
      where: { id },
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

    return trailer as AiTrailerData | null;
  } catch (error) {
    console.error('Error fetching AI trailer:', error);
    return null;
  }
}

// Get all AI trailers for a movie
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

    return trailers as AiTrailerData[];
  } catch (error) {
    console.error('Error fetching AI trailers for movie:', error);
    return [];
  }
}

// Get all AI trailers with pagination
export async function getAiTrailers(
  page: number = 1,
  limit: number = 10,
  status?: AiTrailerStatus
): Promise<{
  trailers: AiTrailerData[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [trailers, total] = await Promise.all([
      prisma.aiTrailer.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.aiTrailer.count({ where }),
    ]);

    return {
      trailers: trailers as AiTrailerData[],
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching AI trailers:', error);
    return {
      trailers: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

// Delete an AI trailer
export async function deleteAiTrailer(id: string): Promise<boolean> {
  try {
    await prisma.aiTrailer.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting AI trailer:', error);
    return false;
  }
}

// Get AI trailer statistics
export async function getAiTrailerStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  byVoiceStyle: Record<string, number>;
}> {
  try {
    const [total, completed, failed, pending, byVoiceStyle] = await Promise.all([
      prisma.aiTrailer.count(),
      prisma.aiTrailer.count({ where: { status: AiTrailerStatus.COMPLETED } }),
      prisma.aiTrailer.count({ where: { status: AiTrailerStatus.FAILED } }),
      prisma.aiTrailer.count({
        where: {
          status: {
            in: [
              AiTrailerStatus.PENDING,
              AiTrailerStatus.GENERATING_SCRIPT,
              AiTrailerStatus.GENERATING_AUDIO,
              AiTrailerStatus.UPLOADING,
            ],
          },
        },
      }),
      prisma.aiTrailer.groupBy({
        by: ['voiceStyle'],
        _count: { voiceStyle: true },
      }),
    ]);

    const voiceStyleStats = byVoiceStyle.reduce(
      (acc, item) => {
        acc[item.voiceStyle] = item._count.voiceStyle;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      completed,
      failed,
      pending,
      byVoiceStyle: voiceStyleStats,
    };
  } catch (error) {
    console.error('Error fetching AI trailer stats:', error);
    return {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      byVoiceStyle: {},
    };
  }
}

// Check if a movie already has a trailer with the same voice style
export async function hasExistingTrailer(movieId: string, voiceStyle: string): Promise<boolean> {
  try {
    const existing = await prisma.aiTrailer.findFirst({
      where: {
        movieId,
        voiceStyle,
        status: AiTrailerStatus.COMPLETED,
      },
    });

    return !!existing;
  } catch (error) {
    console.error('Error checking existing trailer:', error);
    return false;
  }
}
