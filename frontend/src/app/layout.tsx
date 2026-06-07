import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme/ThemeProvider";
import { SentryInit } from "@/components/common/SentryInit";
import { ToastProvider } from "@/components/ui/toast";
import { StoreProvider } from "@/components/common/store/StoreProvider";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Symptra · Autonomous Scheduling",
    template: "%s · Symptra",
  },
  description:
    "AI-first patient intake and autonomous scheduling for high-trust medical and dental clinics.",
  keywords: ["patient intake", "medical scheduling", "AI triage", "clinic software", "HIPAA"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Symptra Scheduling",
    title: "Symptra · Autonomous Scheduling",
    description: "AI-first patient intake and autonomous scheduling for modern clinics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Symptra · Autonomous Scheduling",
    description: "AI-first patient intake and autonomous scheduling for modern clinics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider>
          <StoreProvider>
            <SentryInit />
            <ToastProvider>{children}</ToastProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
