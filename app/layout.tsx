import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Oscars App',
  description: 'Aplikace na hlasování v soutěži Oscars predictions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="bg-linear-to-r from-amber-400 to-yellow-500 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              🏆 Oscars Predictions 2026
            </h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
