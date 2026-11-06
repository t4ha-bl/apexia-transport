import type { Metadata } from 'next';
import { ReactNode } from 'react';

// Driver job pages are private links: keep them out of search engines
export const metadata: Metadata = {
  title: 'Mission chauffeur · Apexia',
  robots: { index: false, follow: false },
};

export default function MissionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
