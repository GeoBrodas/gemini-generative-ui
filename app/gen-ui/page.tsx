'use client';

import { useState } from 'react';
import { AI } from '.././actions';
import { useActions, useUIState } from 'ai/rsc';

export default function Page() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInput('');
    setConversation((currentConversation) => [
      ...currentConversation,
      <div>{input}</div>,
    ]);
    const message = await submitUserMessage(input);
    setConversation((currentConversation) => [...currentConversation, message]);
  };

  console.log(conversation);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
        <div className="space-y-4">
          {conversation.map((message, i) => (
            <div key={i}>
              {message.spinner}
              {message.display}
              {message.attachments}
            </div>
          ))}
        </div>

        <div>
          <form onSubmit={handleSubmit}>
            <input
              className="fixed text-black bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
              value={input}
              placeholder="Type your prompt"
              onChange={(e) => setInput(e.target.value)}
            />
          </form>
        </div>
      </div>
    </main>
  );
}
