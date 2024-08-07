import 'server-only';

import { z } from 'zod';
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI,
} from 'ai/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { trainedPrompt } from '@/lib/prompt';
import { nanoid, runAsyncFnWithoutBlocking } from '@/lib/helper';
import Spinner from './components/ui/Spinner';
import { streamText } from 'ai';
import BotMessage from './components/ui/BotMessage';

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

// const diagnose = async (symptoms: string) => {
//   return {
//     response: 'You may have cancer!',
//   };
// };

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
        content: `${aiState.get().interactions.join('\n\n')}\n\n${input}`,
      },
    ],
  });

  console.log(aiState.get());

  const history = aiState.get().messages.map((message: any) => ({
    role: message.role,
    content: message.content,
  }));

  const textStream = createStreamableValue('');
  const spinnerStream = createStreamableUI(<Spinner />);
  const messageStream = createStreamableUI(null);
  const uiStream = createStreamableUI();

  runAsyncFnWithoutBlocking(async () => {
    try {
      const result = await streamText({
        //@ts-ignore
        model: google('models/gemini-1.5-flash-latest'),
        temperature: 0,
        system: `\
      You are a friendly assistant that helps the user with identifying health issue by diagnosing their symptoms.
  
        If the user enters their symptoms, call \`diagnose\` tool to show the UI.
      `,
        messages: [...history, { role: 'user', content: input }],
        tools: {
          searchDoctors: {
            description:
              'Search for doctors within the location specified by the user',
            parameters: z.object({
              location: z.string().describe('Location of the user'),
              diagnosis: z
                .string()
                .describe('Health issue the user might be facing'),
              listOfDoctors: z.array(
                z.object({
                  name: z.string().describe('Name of doctor'),
                  address: z.number().describe('Address of the doctor'),
                })
              ),
            }),
          },
          diagnose: {
            description:
              'Based on the symptoms, diagnose the nearest condition the user may be facing',
            parameters: z.object({
              symptoms: z
                .array(z.string().describe('Individual symptom'))
                .describe('symptoms the user is facing'),
              country: z.string().describe('Country of the user'),
              state: z.string().describe('State from which the user belongs'),
            }),
          },
        },
      });

      let textContent = '';
      spinnerStream.done(null);

      for await (const delta of result.fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          textContent += textDelta;

          messageStream.update(<BotMessage content={textContent} />);

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: textContent,
              },
            ],
          });
        } else if (type === 'tool-call') {
          const { toolName, args } = delta;

          if (toolName === 'searchDoctors') {
            const { diagnosis, listOfDoctors, location } = args;

            uiStream.update(
              <div>
                {listOfDoctors.map((doctor, index) => (
                  <div key={index}>{doctor.name}</div>
                ))}
              </div>
            );

            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `Here's a list of doctors that I've found based on your location`,
                  display: {
                    name: 'searchDoctors',
                    props: {
                      diagnosis,
                      listOfDoctors,
                      location,
                    },
                  },
                },
              ],
            });
          } else if (toolName === 'diagnose') {
            const { symptoms, country, state } = args;

            console.log('symptomsss', symptoms);
            console.log('location', country, 'from', state);

            uiStream.update(
              <div className="bg-yellow-200">You have holy water</div>
            );

            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `You have holy water`,
                  display: {
                    name: 'diagnose',
                    props: {
                      symptoms,
                    },
                  },
                },
              ],
            });
          }
        }
      }

      textStream.done();
      uiStream.done();
      messageStream.done();
    } catch (e) {
      console.error('e', e);

      const error = new Error(
        'The AI got rate limited, please try again later.'
      );

      uiStream.error(error);
      textStream.error(error);
      messageStream.error(error);
    }
  });

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value,
  };
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  content: string;
  id?: string;
  name?: string;
  display?: {
    name: string;
    props: Record<string, any>;
  };
};

export type AIState = {
  chatId: string;
  interactions?: string[];
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
  spinner?: React.ReactNode;
  attachments?: React.ReactNode;
}[];

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: Message[];
  sharePath?: string;
}

export const AI = createAI<any[], React.ReactNode[]>({
  initialUIState: [],
  initialAIState: { chatId: nanoid(), interactions: [], messages: [] },
  actions: {
    submitUserMessage,
  },
  unstable_onGetUIState: async () => {
    'use server';

    const aiState = getAIState();

    if (aiState) {
      const uiState = getUIStateFromAIState(aiState);
      return uiState;
    } else return;
  },
});

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'assistant' ? (
          message.display?.name === 'searchDoctors' ? (
            <div>
              {message.display.props.listOfDoctors.map((doctor, index) => (
                <div key={index}>{doctor.name}</div>
              ))}
            </div>
          ) : message.display?.name === 'diagnose' ? (
            <div className="bg-yellow-200">{message.content}</div>
          ) : (
            <BotMessage content={message.content} />
          )
        ) : message.role === 'user' ? (
          <div>{message.content}</div>
        ) : (
          <BotMessage content={message.content} />
        ),
    }));
};
