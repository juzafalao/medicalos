// ============================================================
// app/layout.tsx - Root layout (TypeScript)
// ============================================================
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedicalOS - Gestão Clínica Inteligente',
  description: 'Sistema SaaS para consultórios e clínicas médicas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { 
                background: '#1e293b', 
                color: '#f1f5f9', 
                borderRadius: '8px' 
              },
              success: { 
                iconTheme: { primary: '#10b981', secondary: '#fff' } 
              },
              error: { 
                iconTheme: { primary: '#ef4444', secondary: '#fff' } 
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}