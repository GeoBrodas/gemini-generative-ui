'use client';

import { useStreamableText } from '@/lib/hooks';
import { StreamableValue } from 'ai/rsc';

export default function BotMessage({
  content,
  className,
}: {
  content: string | StreamableValue<string>;
  className?: string;
}) {
  const text = useStreamableText(content);

  return <div className="bg-gray-100 rounded-lg p-4">{text}</div>;
}
