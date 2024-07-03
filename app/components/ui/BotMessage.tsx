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

  return <div>{text}</div>;
}
