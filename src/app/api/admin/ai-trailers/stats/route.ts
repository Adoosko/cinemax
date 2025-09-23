import { NextResponse } from 'next/server';
import { getAiTrailerStats } from '@/lib/data/ai-trailers';
import { testOpenAIConnection } from '@/lib/services/openai';
import { testElevenLabsConnection } from '@/lib/services/elevenlabs';
import { testS3Connection } from '@/lib/services/s3-audio';

export async function GET() {
  try {
    // Get trailer statistics
    const stats = await getAiTrailerStats();

    // Test service connections
    const [openaiConnected, elevenlabsConnected, s3Connected] = await Promise.all([
      testOpenAIConnection(),
      testElevenLabsConnection(),
      testS3Connection(),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      serviceStatus: {
        openai: openaiConnected,
        elevenlabs: elevenlabsConnected,
        s3: s3Connected,
      },
      requiredEnvVars: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        NEXT_PUBLIC_AWS_S3_BUCKET: !!process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
        NEXT_PUBLIC_AWS_S3_REGION: !!process.env.NEXT_PUBLIC_AWS_S3_REGION,
      },
    });
  } catch (error) {
    console.error('Error fetching AI trailer stats:', error);
    return NextResponse.json({ error: 'Failed to fetch AI trailer statistics' }, { status: 500 });
  }
}
