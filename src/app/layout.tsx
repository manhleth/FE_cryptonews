// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toast } from "@radix-ui/react-toast";
import { Toaster } from "@/components/ui/toaster";
import { HeaderCrypto } from "@/components/sections/news/HeaderCrypto";
import { FooterCrypto } from "@/components/sections/news/FooterCrypto";
import { CryptoTicker } from "@/components/sections/news/CryptoTicker";
// import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto News Platform",
  description: "Latest news and courses about cryptocurrency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HeaderCrypto/>
        <CryptoTicker/>
        {children}
        <FooterCrypto/>
        <div className="fixed top-4 right-4 z-50">
          <Toaster />
        </div>
      </body>
    </html>
  );
}