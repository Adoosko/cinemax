import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; seasonNumber: string; episodeNumber: string }> }
) {
  try {
    const { slug, seasonNumber, episodeNumber } = await params;

    if (!slug || !seasonNumber || !episodeNumber) {
      return NextResponse.json(
        { error: 'Series slug, season number, and episode number are required' },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(seasonNumber);
    const episodeNum = parseInt(episodeNumber);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
      return NextResponse.json({ error: 'Invalid season or episode number' }, { status: 400 });
    }

    // Fetch episode to get ID
    const episode = await prisma.episode.findFirst({
      where: {
        number: episodeNum,
        season: {
          number: seasonNum,
          series: {
            slug: slug,
            isActive: true,
            isPublished: true,
          },
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Fetch comments with replies
    const comments = await prisma.episodeComment.findMany({
      where: {
        episodeId: episode.id,
      },
      include: {
        replies: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform comments for frontend
    const transformedComments = comments
      .filter((comment) => !comment.parentId) // Only top-level comments
      .map((comment) => ({
        id: comment.id,
        content: comment.content,
        isSpoiler: comment.isSpoiler,
        createdAt: comment.createdAt,
        user: {
          name:
            comment.user.name ||
            `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() ||
            'Anonymous',
          avatar: comment.user.image,
        },
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          isSpoiler: reply.isSpoiler,
          createdAt: reply.createdAt,
          user: {
            name:
              reply.user.name ||
              `${reply.user.firstName || ''} ${reply.user.lastName || ''}`.trim() ||
              'Anonymous',
            avatar: reply.user.image,
          },
        })),
      }));

    return NextResponse.json(transformedComments);
  } catch (error) {
    console.error('Failed to fetch episode comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; seasonNumber: string; episodeNumber: string }> }
) {
  try {
    const { slug, seasonNumber, episodeNumber } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, isSpoiler = false, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const seasonNum = parseInt(seasonNumber);
    const episodeNum = parseInt(episodeNumber);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
      return NextResponse.json({ error: 'Invalid season or episode number' }, { status: 400 });
    }

    // Fetch episode to get ID
    const episode = await prisma.episode.findFirst({
      where: {
        number: episodeNum,
        season: {
          number: seasonNum,
          series: {
            slug: slug,
            isActive: true,
            isPublished: true,
          },
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Get user info for the comment
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.episodeComment.create({
      data: {
        episodeId: episode.id,
        userId: session.user.id,
        userName:
          user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
        userAvatar: user.image,
        content: content.trim(),
        isSpoiler,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      isSpoiler: comment.isSpoiler,
      createdAt: comment.createdAt,
      user: {
        name:
          comment.user.name ||
          `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() ||
          'Anonymous',
        avatar: comment.user.image,
      },
    });
  } catch (error) {
    console.error('Failed to create episode comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
