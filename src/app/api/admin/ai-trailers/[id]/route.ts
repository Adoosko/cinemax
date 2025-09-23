import { NextRequest, NextResponse } from 'next/server';
import { getAiTrailerById, deleteAiTrailer, updateAiTrailer } from '@/lib/data/ai-trailers';
import { AiTrailerStatus } from '@prisma/client';

// Get specific AI trailer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }

    const trailer = await getAiTrailerById(id);

    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trailer,
    });

  } catch (error) {
    console.error('Error fetching AI trailer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI trailer' },
      { status: 500 }
    );
  }
}

// Update AI trailer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(AiTrailerStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedTrailer = await updateAiTrailer(id, body);

    return NextResponse.json({
      success: true,
      trailer: updatedTrailer,
    });

  } catch (error) {
    console.error('Error updating AI trailer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update AI trailer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete AI trailer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteAiTrailer(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete trailer or trailer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trailer deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting AI trailer:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI trailer' },
      { status: 500 }
    );
  }
}
