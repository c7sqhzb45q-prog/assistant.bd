import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'assistant.bd - AI Operating System',
  description: 'No-code automation + AI agents + CRM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
