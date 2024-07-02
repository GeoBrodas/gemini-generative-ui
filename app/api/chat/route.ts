import { trainedPrompt } from '@/lib/prompt';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_VERTEX_KEY,
  });

  const result = await streamText({
    //@ts-ignore
    model: google('models/gemini-pro'),
    messages,
    system: trainedPrompt,
  });

  console.log(result.textStream);

  return result.toAIStreamResponse();
}
