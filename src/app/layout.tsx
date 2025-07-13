import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'URL Shortener',
  description: 'A simple URL shortener with analytics and QR codes',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-lg font-semibold text-gray-900">URL Shortener</h1>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}