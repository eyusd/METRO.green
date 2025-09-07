import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Metro.green - Explore Paris, one station at a time",
    template: "%s | Metro.green"
  },
  description: "You think you know Paris? Think again. Metro.green is an invitation to tear up the well-worn routes and forge your own path through the City of Lights. This is your adventure. Uncover the real Paris, one station at a time. Where will the journey take you?",
  keywords: [
    "metro", "paris", "transport", "stations", "exploration", "gamification",
    "location-based", "discovery", "public transport", "RATP", "subway",
    "underground", "train", "travel", "paris metro", "french transport"
  ],
  authors: [{ name: "Metro.green Team" }],
  creator: "Metro.green",
  publisher: "Metro.green",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://metro.green'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://metro.green',
    title: 'Metro.green - Explore Paris, one station at a time',
    description: 'You think you know Paris? Think again. Metro.green is an invitation to tear up the well-worn routes and forge your own path through the City of Lights. This is your adventure. Uncover the real Paris, one station at a time. Where will the journey take you?',
    siteName: 'Metro.green',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Metro.green App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metro.green - Explore Paris, one station at a time',
    description: 'You think you know Paris? Think again. Metro.green is an invitation to tear up the well-worn routes and forge your own path through the City of Lights. This is your adventure. Uncover the real Paris, one station at a time. Where will the journey take you?',
    images: ['/android-chrome-512x512.png'],
    creator: '@metro_green',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Metro.green',
    'application-name': 'Metro.green',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <link rel="canonical" href="https://metro.green" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Metro.green" />
        <meta name="application-name" content="Metro.green" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Metro.green",
              "alternateName": "Metro.green - Explore Paris, one station at a time",
              "description": "You think you know Paris? Think again. Metro.green is an invitation to tear up the well-worn routes and forge your own path through the City of Lights. This is your adventure. Uncover the real Paris, one station at a time. Where will the journey take you?",
              "url": "https://metro.green",
              "applicationCategory": "TravelApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "featureList": [
                "Metro station discovery",
                "Location-based gaming",
                "Progress tracking",
                "Interactive maps",
                "Station statistics",
                "Gamified exploration"
              ],
              "screenshot": "https://metro.green/android-chrome-512x512.png",
              "author": {
                "@type": "Organization",
                "name": "Metro.green Team"
              },
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "inLanguage": "en-US",
              "isAccessibleForFree": true,
              "keywords": "metro, paris, transport, stations, exploration, gamification, location-based, discovery, public transport, RATP"
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
