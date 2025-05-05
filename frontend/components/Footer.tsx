"use client";

import Link from "next/link";

/**
 * Footer component for the application.
 * Displays information about the platform, resources, networks, and legal notices.
 * Fixed at the bottom of the viewport.
 *
 * @returns {JSX.Element} The rendered footer component.
 */
export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-800 py-2 text-xs bg-black/70 backdrop-blur-sm z-10">
      <div className="container mx-auto px-3">
        <div className="flex justify-between items-center">
          <p className="text-slate-500">
            © {new Date().getFullYear()} Flash
          </p>
          <div className="flex gap-3">
            <Link
              href="#"
              className="text-slate-500 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-slate-500 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <span className="text-amber-400/80">Educational use only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
