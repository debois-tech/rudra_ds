import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://motoadmin.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MotoAdmin – #1 Driving School Management Platform",
    template: "%s | MotoAdmin – Driving School Management Platform",
  },
  description:
    "MotoAdmin is the most powerful driving school management platform in India. Manage students, vehicles, documents, services & revenue — all in one place. Trusted by driving schools across the country.",
  keywords: [
    "driving school management platform",
    "moto admin",
    "motoadmin",
    "driving school software",
    "driving school management system",
    "driving school crm",
    "driving school app",
    "RTO management software",
    "vehicle school management",
    "driving institute management",
    "student tracking driving school",
    "fleet management driving school",
    "driving school saas india",
  ],
  authors: [{ name: "MotoAdmin Team" }],
  creator: "MotoAdmin",
  publisher: "MotoAdmin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "MotoAdmin",
    title: "MotoAdmin – #1 Driving School Management Platform",
    description:
      "The most powerful driving school management platform in India. Manage students, vehicles, documents & revenue from a single dashboard.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MotoAdmin – Driving School Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MotoAdmin – #1 Driving School Management Platform",
    description:
      "The most powerful driving school management platform in India. Manage students, vehicles, documents & revenue.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@motoadmin",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MotoAdmin",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "MotoAdmin is the #1 driving school management platform in India. Manage students, vehicles, fleet, documents, services and revenue all in one place.",
  url: BASE_URL,
  keywords:
    "driving school management platform, moto admin, driving school software, RTO management",
  provider: {
    "@type": "Organization",
    name: "MotoAdmin",
    url: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#7c3aed" />
        <Script
          id="json-ld-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
