// Import necessary types and components
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { GlobalDataProvider } from "@/components/web3/GlobalDataProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Initialize Geist Sans font with custom CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Initialize Geist Mono font with custom CSS variable
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define metadata for the application
export const metadata: Metadata = {
  title: "Flash | Flash Loan Arbitrage", // Title of the application
  description:
    "Flash loan arbitrage platform using Aave, Uniswap, and SushiSwap on Ethereum.", // Description of the application
  keywords:
    "flash loan, arbitrage, defi, ethereum, aave, uniswap, sushiswap, blockchain", // Keywords for SEO
};

// Root layout component for the application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // Children components to be rendered within the layout
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-900 to-black text-white flex flex-col min-h-screen`}
      >
        <Web3Provider>
          <GlobalDataProvider>
            <Header />
            <div className="flex-1 max-w-full overflow-x-hidden pb-12">
              {children}
            </div>{" "}
            {/* Main content area with padding for footer */}
            <Footer />
          </GlobalDataProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
