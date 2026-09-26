import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from '@/components/app-shell';

const geistSans = localFont({
  src: './fonts/geist-latin.woff2',
  variable: "--font-geist-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CHAT USA — Seu inglês ganha voz",
  description: "Aprenda inglês americano conversando. Tutores com IA, prática de escrita e áudio, no seu ritmo.",
};

export const viewport: Viewport = { themeColor: '#100f15' };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AppShell>{children}</AppShell></body>
    </html>
  );
}
