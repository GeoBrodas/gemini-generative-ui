import { AI } from '../actions';

export default function GenUILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AI>
      <section>{children}</section>
    </AI>
  );
}
