import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "Document QA Chatbot",
  description: "A sophisticated chatbot that can answer questions about documents with proper citation and reasoning.",
  icons: {
    icon: [
      { url: '/icon.svg?v=1', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=1', type: 'image/x-icon' }
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white dark:bg-slate-900`}>
        {children}
      </body>
    </html>
  );
}
