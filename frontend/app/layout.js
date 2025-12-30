import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI-ULU | Sizi Gerçekten Hatırlayan Yapay Zeka',
  description: 'Kalıcı hafızaya sahip yapay zeka asistanı. Kendinizi tekrar etmeyin, AI-ULU sizi hatırlıyor.',
  keywords: ['yapay zeka', 'chatbot', 'hafıza', 'AI', 'asistan'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}