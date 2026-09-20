import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Jev's Pirate Sorting Dock",
  description: 'A live decision-model demo sorting Pirate Nation PFPs.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
