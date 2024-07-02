import 'server-only';

import { z } from 'zod';
import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { trainedPrompt } from '@/lib/prompt';
import { nanoid } from '@/lib/helper';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_VERTEX_KEY,
});

const searchDoctors = async (location: string, symptoms: string) => {
  return [
    {
      id: '1',
      name: 'Doc. Satish Dhawan',
      phone: '123-456-323',
    },
    {
      id: '2',
      name: 'Doc. Palavi Nambiyaar',
      phone: '123-456-323',
    },
  ];
};

const diagnose = async (symptoms: string) => {
  return {
    response: 'You may have cancer!',
  };
};

export async function submitUserMessage(input: string) {
  'use server';

  const aiState = getMutableAIState();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: `${aiState.get().join('\n\n')}\n\n${input}`,
      },
    ],
  });

  console.log(aiState.get());

  const history = aiState.get().messages.map((message: any) => ({
    role: message.role,
    content: message.content,
  }));

  const ui = await streamUI({
    //@ts-ignore
    model: google('models/gemini-1.5-flash-latest'),
    system: trainedPrompt,
    messages: [...history],
    tools: {
      searchDoctors: {
        description:
          'Search for doctors within the location specified by the user',
        parameters: z.object({
          location: z.string().describe('Location of the user'),
          symptoms: z.string().describe('Symptoms the user is facing'),
        }),
        generate: async function* ({ location, symptoms }) {
          yield `Searching for doctors nearby`;
          const results = await searchDoctors(location, symptoms);
          return (
            <div className="bg-gray-200">
              {results.map((result) => (
                <div key={result.id}>
                  <div>{result.name}</div>
                  <div>{result.phone}</div>
                </div>
              ))}
            </div>
          );
        },
      },
      diagnose: {
        description:
          'Based on the symptoms, diagnose the nearest condition the user may be facing',
        parameters: z.object({
          symptoms: z.string().describe('Symptoms the user is facing'),
        }),
        generate: async function* ({ symptoms }) {
          yield `Diagnosing...`;
          const results = await diagnose(symptoms);
          return <div>{results.response}</div>;
        },
      },
    },
  });

  return ui.value;
}

export const AI = createAI<any[], React.ReactNode[]>({
  initialUIState: [],
  initialAIState: [],
  actions: {
    submitUserMessage,
  },
});
