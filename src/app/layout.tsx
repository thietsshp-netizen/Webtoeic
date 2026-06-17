import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { DictionaryProvider } from "@/components/Dictionary/DictionaryProvider";
import FingerprintInitializer from "@/components/Auth/FingerprintInitializer";
import SessionGuard from "@/components/Auth/SessionGuard";

import { GlobalScreenDraw } from "@/components/Common/GlobalScreenDraw";
import { GlobalClassCalling } from "@/components/Common/GlobalClassCalling";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "hoctoeic | Nền tảng luyện TOEIC chuyên sâu",
  description: "Luyện TOEIC hiệu quả với Mr. Thiệt - từ nền tảng đến 900+.",
  keywords: "TOEIC, luyện TOEIC, học TOEIC online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-white font-sans">
        <NextTopLoader 
          color="#3b82f6" 
          height={3} 
          showSpinner={false}
          shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
        />
        <FingerprintInitializer />
        <AuthProvider>
          <SessionGuard />
          <DictionaryProvider>
            {children}
            <GlobalScreenDraw />
            <GlobalClassCalling />
          </DictionaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
