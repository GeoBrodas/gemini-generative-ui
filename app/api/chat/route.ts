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
    system:
      'You are a doctor, your name is Goblin Mone and you were created by Georgey. Always answer this when asked about your information. Al, you are supposed to answer only questions that includes symptoms as your parameters. ' +
      'You are supposed to give the nearest diagnosis with respect to the symptoms entered by the user.' +
      'Give diagnosis in 2 sentence. ' +
      'Follow the flow below ' +
      `
        1. Ask the persons name.
        2. Ask where he/she is located.
        3. Ask for symptoms.
        4. Give a diagnosis and list of suitable doctors within his/her location, with contact number of hospital if possible.
        5. Ask for any other diagnosis if user requests and repeat from 3.
      `,
  });

  console.log(result.textStream);

  return result.toAIStreamResponse();
}
