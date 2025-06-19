// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toast } from "@radix-ui/react-toast";
import { Toaster } from "@/components/ui/toaster";
import { HeaderCrypto } from "@/components/sections/news/HeaderCrypto";
import { FooterCrypto } from "@/components/sections/news/FooterCrypto";
import { CryptoTicker } from "@/components/sections/news/CryptoTicker";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";
import DialogflowMessenger from "@/components/DialogflowMessenger";
import { ToastContainer } from "react-toastify";
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
        <AuthProvider>
        <HeaderCrypto/>
        <CryptoTicker/>
        {children}
        <Script 
          src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
          strategy="afterInteractive"
        />
        
       <DialogflowMessenger 
          agentId="f7fb9357-503f-4359-a909-184da5f4f532"
          chatTitle="CryptoChatBot"
          languageCode="vi"
        />
        <FooterCrypto/>
        <div className="fixed top-4 right-4 z-50">
          <Toaster />
        </div>
        </AuthProvider>
        <ToastContainer/>
      </body>
    </html>
  );
}