import type {Metadata} from 'next';
import './globals.css';
import 'react-day-picker/style.css';
import { Toaster } from '@/components/ui/feedback/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGate } from '@/components/layout/auth-gate';

export const metadata: Metadata = {
  title: 'VectorFlow',
  description: 'Create and organize ideas with an AI-powered node graph.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased flex flex-col h-[100dvh] overflow-hidden">
        <FirebaseClientProvider>
          <AuthGate>
            <div className="flex-1 relative overflow-hidden flex flex-col">
               <main className="flex-1 w-full h-full overflow-auto">
                 {children}
               </main>
            </div>
          </AuthGate>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
