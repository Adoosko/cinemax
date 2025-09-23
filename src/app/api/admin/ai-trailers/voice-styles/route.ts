import { NextResponse } from 'next/server';
import { getAvailableVoiceStyles } from '@/lib/services/elevenlabs';

export async function GET() {
  try {
    const voiceStyles = getAvailableVoiceStyles();

    return NextResponse.json({
      success: true,
      voiceStyles,
    });
  } catch (error) {
    console.error('Error fetching voice styles:', error);
    return NextResponse.json({ error: 'Failed to fetch voice styles' }, { status: 500 });
  }
}
