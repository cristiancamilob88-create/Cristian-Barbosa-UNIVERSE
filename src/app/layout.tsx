import type { Metadata } from "next";
import { Suspense } from "react";
import { Big_Shoulders, Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.universeName}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
};

// Structured data Google reads to build a knowledge panel / site name:
// who Cristian is (Person) and what this site is called (WebSite). Only
// facts already stated on the site — no invented awards, locations or
// profiles. `sameAs` (his social profiles) is deliberately left out:
// those URLs live only in the `social_profile` table
// (docs/SOCIAL_ROUTING.md), and this layout never queries the database.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteConfig.url}/#person`,
  name: siteConfig.name,
  url: siteConfig.url,
  image: new URL("/opengraph-image.jpg", siteConfig.url).toString(),
  description: siteConfig.description,
  jobTitle: "Atleta de calistenia, entrenador y artista",
  nationality: { "@type": "Country", name: "Colombia" },
  knowsAbout: ["Calistenia", "Entrenamiento", "Shows en vivo", "Música"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  alternateName: siteConfig.universeName,
  url: siteConfig.url,
  inLanguage: "es",
  publisher: { "@id": `${siteConfig.url}/#person` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bigShoulders.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-chalk">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([personJsonLd, websiteJsonLd]) }}
        />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
