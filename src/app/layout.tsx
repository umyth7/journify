import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = "https://www.senssetify.com";

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Senssetify",
  description: "Mood-based live set discovery platform for underground electronic music",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Senssetify — Music is a Journey",
    template: "%s | Senssetify",
  },
  description: "Discover and share long-form live sets. Deep listening for the long road.",
  keywords: ["live sets", "electronic music", "techno", "DJ sets", "ambient", "mood music", "underground", "house music"],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "Senssetify — Music is a Journey",
    description: "Discover and share long-form live sets. Deep listening for the long road.",
    url: BASE_URL,
    siteName: "Senssetify",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Senssetify — Music is a Journey" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Senssetify — Music is a Journey",
    description: "Discover and share long-form live sets. Deep listening for the long road.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
