import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// GET /api/movies/[slug]/comments - Fetch comments for a movie
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Get top-level comments (no parent) with their replies
    const comments = await prisma.movieComment.findMany({
      where: {
        movieSlug: slug,
        parentId: null, // Only top-level comments
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        userAvatar: true,
        content: true,
        isSpoiler: true,
        parentId: true,
        createdAt: true,
        replies: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userAvatar: true,
            content: true,
            isSpoiler: true,
            parentId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      comments,
      totalCount: comments.reduce((total, comment) => total + 1 + comment.replies.length, 0),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/movies/[slug]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, isSpoiler = false, parentId } = body;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Verify movie exists
    const movie = await prisma.movie.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // If parentId is provided, verify the parent comment exists and belongs to the same movie
    if (parentId) {
      const parentComment = await prisma.movieComment.findUnique({
        where: { id: parentId },
        select: { movieSlug: true, parentId: true },
      });

      if (!parentComment || parentComment.movieSlug !== slug) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Prevent nested replies (only allow 1 level of nesting)
      if (parentComment.parentId) {
        return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 });
      }
    }

    // Create the comment
    const comment = await prisma.movieComment.create({
      data: {
        movieSlug: slug,
        userId: session.user.id,
        userName: session.user.name || 'Anonymous',
        userAvatar: session.user.image || null,
        content: content.trim(),
        isSpoiler,
        parentId,
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        userAvatar: true,
        content: true,
        isSpoiler: true,
        parentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE /api/movies/[slug]/comments - Delete a comment (only by comment owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
    const comment = await prisma.movieComment.findUnique({
      where: { id: commentId },
      select: { userId: true, movieSlug: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    if (comment.movieSlug !== slug) {
      return NextResponse.json({ error: 'Comment does not belong to this movie' }, { status: 400 });
    }

    // Delete the comment
    await prisma.movieComment.delete({
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
