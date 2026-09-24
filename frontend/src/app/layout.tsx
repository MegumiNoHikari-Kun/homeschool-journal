import type { Metadata } from 'next';
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });
const body = Public_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Jurnal Belajar Rumah',
  description: 'Catatan harian kegiatan belajar keluarga homeschooling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
