import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const SITE_URL = 'https://prompt2app.tanisheesh.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0C0C0E',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prompt2App — Turn Plain English into Working Web Apps',
    template: '%s | Prompt2App',
  },
  description:
    'Describe any web app in plain English or voice and generate a complete, interactive, downloadable HTML5 application in seconds. Powered by Groq LPU.',
  applicationName: 'Prompt2App',
  keywords: [
    'Prompt2App',
    'AI Web App Builder',
    'Text to Web App',
    'HTML App Generator',
    'Groq AI App Builder',
    'Instant Prototype Generator',
    'No-Code AI Studio',
    'Tanish Poddar',
  ],
  authors: [
    { name: 'Tanish Poddar', url: 'https://tanisheesh.in' },
    { name: 'Nishant', url: 'https://github.com/nishant-codess' },
  ],
  creator: 'Tanish Poddar',
  publisher: 'Prompt2App',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Prompt2App',
    title: 'Prompt2App — Turn Plain English into Working Web Apps',
    description:
      'Describe any web app in plain English or voice. Preview it live across desktop, tablet, and mobile, iterate with follow-up prompts, and export zero-dependency HTML.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt2App — Turn Plain English into Working Web Apps',
    description:
      'Generate, preview, iterate, and download self-contained HTML5 web apps in seconds at 500+ tokens/sec with Groq LPU.',
    creator: '@tanisheesh',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Prompt2App',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'AI web application builder that turns plain English or voice prompts into working, downloadable single-file HTML5 web apps.',
  };

  return (
    <html
      lang="en"
      className={`dark scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
