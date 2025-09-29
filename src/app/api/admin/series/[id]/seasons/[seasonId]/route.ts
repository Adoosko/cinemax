import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// DELETE - Delete a season and all its episodes
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: seriesId, seasonId } = await params;

    // Verify the season belongs to the series
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        seriesId: seriesId,
      },
      include: {
        series: true,
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // Delete the season (this will cascade delete all episodes and their watch history)
    await prisma.season.delete({
      where: { id: seasonId },
    });

    // Revalidate the series page to reflect changes
    revalidatePath('/series');
    revalidatePath(`/series/${season.series.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }
}
