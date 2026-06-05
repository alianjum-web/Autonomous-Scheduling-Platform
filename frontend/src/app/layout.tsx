import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppNav } from "@/components/common/AppNav";
import { SentryInit } from "@/components/common/SentryInit";
import { ToastProvider } from "@/components/ui/toast";
import { StoreProvider } from "@/store/StoreProvider";

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
  title: "Autonomous Scheduling Platform",
  description: "AI-first patient intake and autonomous scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <SentryInit />
          <ToastProvider>
            <AppNav />
            <main className="flex flex-1 flex-col">{children}</main>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
