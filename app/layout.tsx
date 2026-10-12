import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { absoluteUrl, SITE_URL } from "@/lib/utils";
import {
  HONEST_UI_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "@/globals/constants/site";
import "./globals.css";

const loveSans = localFont({
  src: [
    {
      path: "../public/fonts/LoveSans-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-LightItalic.woff",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-RegularItalic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-MediumItalic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-SemiboldItalic.woff",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-love-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s - Honest AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Connor Love", url: "https://x.com/cando145" }],
  creator: "Connor Love",
  publisher: "Honest AI",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@cando145",
  },
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
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: absoluteUrl(""),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: absoluteUrl(""),
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
      founder: { "@type": "Person", name: "Connor Love", url: "https://x.com/cando145" },
      sameAs: [HONEST_UI_URL],
    },
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#151718" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${loveSans.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
      data-style="modern"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" so no value can smuggle in a premature </script>.
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider
          defaultTheme="system"
          attribute={["class", "data-theme"]}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
