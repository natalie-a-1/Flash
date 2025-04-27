import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/components/web3/Web3Provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flash Blockchain | Flash Loan Arbitrage",
  description: "Flash loan arbitrage platform using Aave, Uniswap, and SushiSwap on Ethereum.",
  keywords: "flash loan, arbitrage, defi, ethereum, aave, uniswap, sushiswap, blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex flex-col`}
      >
        <Web3Provider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
