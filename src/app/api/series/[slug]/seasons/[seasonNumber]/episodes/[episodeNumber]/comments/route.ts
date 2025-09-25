import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({
      success: true,
      comments: transformedComments,
      totalCount: transformedComments.reduce(
        (total, comment) => total + 1 + (comment.replies?.length || 0),
        0
      ),
    });
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

    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
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
      success: true,
      comment: {
        id: comment.id,
        userId: session.user.id,
        userName:
          comment.user.name ||
          `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() ||
          'Anonymous',
        userAvatar: comment.user.image,
        content: comment.content,
        isSpoiler: comment.isSpoiler,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create episode comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; seasonNumber: string; episodeNumber: string }> }
) {
  try {
    const { slug, seasonNumber, episodeNumber } = await params;

    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Find and verify ownership of the comment
    const comment = await prisma.episodeComment.findUnique({
      where: { id: commentId },
      select: { userId: true, episodeId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Delete the comment
    await prisma.episodeComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
