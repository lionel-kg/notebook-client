import type { Metadata, Viewport } from 'next';
import { Caveat, DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';

const hand = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-hand' });
const sans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans' });
const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Notre album',
  description: 'Album photo à créer à deux : photos, stickers, dessins et mots doux.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2b3340',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${hand.variable} ${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
