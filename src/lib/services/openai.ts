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

  const { title, genre, releaseYear, tagline, description, mainCast, director, awards, rating } = movieData;

  // Create the prompt for OpenAI
  const prompt = `Write an engaging movie trailer script for voice-over, max 120 words. Use a cinematic narrator tone, include dramatic pauses as [PAUSE]. Start with a hook, mention main cast/director if interesting, end with a strong call to action ("Streaming soon on CinemaX!"). Do not include spoilers.

Example:
[PAUSE] This fall… a legend returns. [PAUSE] Starring {main cast}. [PAUSE] Directed by {director}. [PAUSE] Only on CinemaX!

Here is the movie:
Title: ${title}
Genre: ${genre.join(', ')}
Year: ${releaseYear}
Tagline/Summary: ${tagline || description || 'An unforgettable cinematic experience'}
Main Cast: ${mainCast.join(', ')}
Director: ${director || 'Unknown'}
${rating ? `Rating: ${rating}` : ''}
${awards ? `Highlight: ${awards}` : ''}

Extract and return only the actual script text for voice synthesis.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional movie trailer script writer. Create engaging, cinematic voice-over scripts that build excitement without revealing spoilers. Keep scripts under 120 words and include dramatic pauses marked as [PAUSE].'
        },
        {
          role: 'user',
          content: prompt
        }
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
    throw new Error(`Failed to generate trailer script: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
