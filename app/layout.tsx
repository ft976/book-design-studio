import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Playfair_Display, Lora, Merriweather, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const merriweather = Merriweather({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-merriweather' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Book Design Studio',
  description: 'Professional book layout design and printing prep with Google Drive export.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${playfair.variable} ${lora.variable} ${merriweather.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
