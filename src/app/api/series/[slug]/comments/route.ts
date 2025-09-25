import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Series slug is required' }, { status: 400 });
    }

    // Fetch series to get ID
    const series = await prisma.series.findUnique({
      where: {
        slug: slug,
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Fetch comments with replies
    const comments = await prisma.seriesComment.findMany({
      where: {
        seriesId: series.id,
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

    // Transform comments for frontend (same format as movie comments)
    const transformedComments = comments
      .filter((comment) => !comment.parentId) // Only top-level comments
      .map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.userName,
        userAvatar: comment.userAvatar,
        content: comment.content,
        isSpoiler: comment.isSpoiler,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          userId: reply.userId,
          userName: reply.userName,
          userAvatar: reply.userAvatar,
          content: reply.content,
          isSpoiler: reply.isSpoiler,
          parentId: reply.parentId,
          createdAt: reply.createdAt,
        })),
      }));

    return NextResponse.json({
      success: true,
      comments: transformedComments,
      totalCount: transformedComments.reduce(
        (total, comment) => total + 1 + comment.replies.length,
        0
      ),
    });
  } catch (error) {
    console.error('Failed to fetch series comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

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

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Fetch series to get ID
    const series = await prisma.series.findUnique({
      where: {
        slug: slug,
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

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

    // If parentId is provided, verify the parent comment exists and belongs to the same series
    if (parentId) {
      const parentComment = await prisma.seriesComment.findUnique({
        where: { id: parentId },
        select: { seriesId: true, parentId: true },
      });

      if (!parentComment || parentComment.seriesId !== series.id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Prevent nested replies (only allow 1 level of nesting)
      if (parentComment.parentId) {
        return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 });
      }
    }

    // Create the comment
    const comment = await prisma.seriesComment.create({
      data: {
        seriesId: series.id,
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
    console.error('Failed to create series comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE /api/series/[slug]/comments - Delete a comment (only by comment owner)
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
    const comment = await prisma.seriesComment.findUnique({
      where: { id: commentId },
      select: { userId: true, seriesId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Verify the comment belongs to the series
    const series = await prisma.series.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!series || comment.seriesId !== series.id) {
      return NextResponse.json(
        { error: 'Comment does not belong to this series' },
        { status: 400 }
      );
    }

    // Delete the comment
    await prisma.seriesComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting series comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
