"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Flash</h3>
            <p className="text-sm text-white/60 mb-4">
              Flash loan arbitrage platform built on Ethereum.
            </p>
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Flash
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://docs.aave.com/developers/guides/flash-loans" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Aave Flash Loans
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.uniswap.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Uniswap Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://dev.sushi.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  SushiSwap Docs
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Networks</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-white/60">Ethereum Mainnet</span>
              </li>
              <li>
                <span className="text-white/60">Local Development (Mainnet Fork)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-white/60 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li className="pt-2 text-xs text-amber-400">
                For educational purposes only. Use at your own risk.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 