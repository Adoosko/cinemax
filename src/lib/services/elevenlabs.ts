export interface VoiceOptions {
  voice_id?: string;
  voice_style: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsResponse {
  audio: ArrayBuffer;
  contentType: string;
}

// Predefined voice styles with their corresponding ElevenLabs voice IDs
export const VOICE_STYLES = {
  epic: {
    voice_id: 'FF7KdobWPaiR0vkcALHF', // David - Epic Movie Trailer
    name: 'Epic Narrator',
    description: 'Deep, powerful voice perfect for action and adventure trailers',
  },
  dramatic: {
    voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel - Calm, professional
    name: 'Dramatic Narrator',
    description: 'Smooth, dramatic voice ideal for thrillers and dramas',
  },
  mysterious: {
    voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - Confident, mysterious
    name: 'Mysterious Narrator',
    description: 'Intriguing voice perfect for mystery and horror trailers',
  },
  heroic: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - Friendly, warm
    name: 'Heroic Narrator',
    description: 'Inspiring voice great for superhero and adventure films',
  },
  classic: {
    voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - Well-rounded, pleasant
    name: 'Classic Narrator',
    description: 'Traditional movie trailer voice, versatile for all genres',
  },
} as const;

export type VoiceStyleKey = keyof typeof VOICE_STYLES;

export async function synthesizeVoice(
  text: string,
  voiceStyle: VoiceStyleKey = 'epic',
  options: Partial<VoiceOptions> = {}
): Promise<ElevenLabsResponse> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key is not configured');
  }

  const voiceConfig = VOICE_STYLES[voiceStyle];
  if (!voiceConfig) {
    throw new Error(`Invalid voice style: ${voiceStyle}`);
  }

  const voice_id = options.voice_id || voiceConfig.voice_id;

  // Validate voice settings
  const stability = options.stability ?? 0.5;
  const similarity_boost = options.similarity_boost ?? 0.8;
  const style = options.style ?? 0.0;

  // ElevenLabs API constraints
  if (![0.0, 0.5, 1.0].includes(stability)) {
    throw new Error('Stability must be one of: 0.0, 0.5, 1.0');
  }
  if (similarity_boost < 0.0 || similarity_boost > 1.0) {
    throw new Error('Similarity boost must be between 0.0 and 1.0');
  }
  if (style < 0.0 || style > 1.0) {
    throw new Error('Style must be between 0.0 and 1.0');
  }

  // Clean the text for better synthesis
  const cleanedText = text
    .replace(/\[PAUSE\]/g, '... ') // Replace [PAUSE] with natural pauses
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const requestBody = {
    text: cleanedText,
    model_id: 'eleven_v3',
    voice_settings: {
      stability,
      similarity_boost,
      style,
      use_speaker_boost: options.use_speaker_boost ?? true,
    },
  };

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audio = await response.arrayBuffer();

    return {
      audio,
      contentType: response.headers.get('content-type') || 'audio/mpeg',
    };
  } catch (error) {
    console.error('Error synthesizing voice:', error);
    throw new Error(
      `Failed to synthesize voice: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function testElevenLabsConnection(): Promise<boolean> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return false;
    }

    // Test with a simple text
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('ElevenLabs connection test failed:', error);
    return false;
  }
}

export function getAvailableVoiceStyles(): Array<{
  key: VoiceStyleKey;
  name: string;
  description: string;
}> {
  return Object.entries(VOICE_STYLES).map(([key, config]) => ({
    key: key as VoiceStyleKey,
    name: config.name,
    description: config.description,
  }));
}
