import type { Metadata } from 'next';
import { ReactNode } from 'react';

// Review links are private: keep them out of search engines
export const metadata: Metadata = {
  title: 'Votre avis',
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
