import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "myskillora — Learn from the Best",
    template: "%s | myskillora",
  },
  description:
    "Discover and book expert teachers for academic subjects, music, arts, martial arts, coding, and more. Join thousands of learners on myskillora.",
  keywords: ["online tutoring", "learn music", "martial arts", "coding classes", "home tuition"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "myskillora",
    title: "myskillora — Learn from the Best",
    description: "Discover expert teachers for every subject and skill.",
  },
  twitter: {
    card: "summary_large_image",
    title: "myskillora",
    description: "Discover expert teachers for every subject and skill.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
