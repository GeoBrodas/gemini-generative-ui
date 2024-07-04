import { AI } from '../actions';

export default function GenUILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AI
      initialAIState={{
        interactions: [],
        messages: [],
      }}
    >
      <section>{children}</section>
    </AI>
  );
}
