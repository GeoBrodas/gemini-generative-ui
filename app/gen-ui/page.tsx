'use client';

import { useState } from 'react';
import { AI } from '.././actions';
import { useActions, useUIState } from 'ai/rsc';
import { nanoid } from '@/lib/helper';
import { useScrollAnchor } from '@/lib/use-scroll-anchor';

export default function Page() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInput('');
    setConversation((currentConversation) => [
      ...currentConversation,
      {
        id: nanoid(),
        display: <div>{input}</div>,
      },
    ]);
    const message = await submitUserMessage(input);
    setConversation((currentConversation) => [...currentConversation, message]);
  };

  console.log(conversation);

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  return (
    <main
      ref={scrollRef}
      className="flex min-h-screen flex-col items-center justify-between p-24"
    >
      <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
        <div className="space-y-4" ref={messagesRef}>
          {conversation.map((message, i) => (
            <div key={i}>
              {message.spinner}
              {message.display}
              {message.attachments}
            </div>
          ))}

          <div className="h-px w-full" ref={visibilityRef} />
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
