import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MovieTrailerData {
  title: string;
  genre: string[];
  releaseYear: number;
  tagline?: string;
  description?: string;
  mainCast: string[];
  director?: string;
  awards?: string;
  rating?: string;
}

export async function generateTrailerScript(movieData: MovieTrailerData): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const { title, genre, releaseYear, tagline, description, mainCast, director, awards, rating } =
    movieData;

  // Create the prompt for OpenAI
  const prompt = `
Write an AI movie trailer script (max 120 words), optimized for voice generation using ElevenLabs v3 audio scripting features, including [emotional], [environmental], and [dialogue] tags.

Instructions:
- Take full advantage of audio tags as stage directions: [whisper], [laughing], [rain], [explosion], [playful banter], etc.
- You can include light, playful spoilers, pop culture jokes, meme references, or genre clichés for humor and engagement—but do not spoil the full plot!
- If appropriate to the genre, add environment sound tags ([thunder], [crowd cheering], [cafe ambient], etc) to boost immersion.
- Include expressive emotion tags (ex: [mysterious], [excited], [commanding], [sob break], [reflective], [adrenaline], [confident]) for narrator or dialogue lines.
- For ensemble movies, use multi-speaker tags ([character:Name] ...), and natural dialogue to simulate a high-quality cast interaction.
- End with a memorable, emotionally tagged call to action (ex: [excited][projecting] “Streaming soon on CinemaX!”).
- Structure your script in short, cinematic lines or sentences, marking dramatic pauses with [PAUSE].
- Only return the script text, not commentary.

Example:
[dark ambient][PAUSE] When shadows fall over the city, only one legend rises. [thunder] [mysterious][PAUSE] Who can you trust when everyone wears a mask? [laughing] “You can run, but you’ll never hide.” [adrenaline][explosion] Starring Jane Doe and John Smith. [playful banter] “Just another day at the office.” [PAUSE][excited][triumphant] Streaming soon on CinemaX!

Here is the movie:
Title: ${title}
Genre: ${genre.join(', ')}
Year: ${releaseYear}
Tagline/Summary: ${tagline || description || 'An unforgettable ride'}
Main Cast: ${mainCast.join(', ')}
Director: ${director || 'Unknown'}
${rating ? `Rating: ${rating}` : ''}
${awards ? `Highlight: ${awards}` : ''}

Focus on humor, hype, creative spoilers, and full use of ElevenLabs v3 audio tags.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional movie trailer script writer. Create engaging, cinematic voice-over scripts that build excitement without revealing spoilers. Keep scripts under 120 words and include dramatic pauses marked as [PAUSE].',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    const script = completion.choices[0]?.message?.content?.trim();

    if (!script) {
      throw new Error('Failed to generate trailer script');
    }

    return script;
  } catch (error) {
    console.error('Error generating trailer script:', error);
    throw new Error(
      `Failed to generate trailer script: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function testOpenAIConnection(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return false;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
