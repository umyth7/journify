"use client";

import Link from "next/link";
import { Radio, Search, Upload } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-100 hover:text-violet-400 transition-colors duration-150 shrink-0"
          aria-label="Senssetify — home"
        >
          <Radio className="w-5 h-5 text-violet-500" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Senssetify</span>
        </Link>

        {/* Search — desktop */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all duration-150">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search sets, artists…"
            className="bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none w-full"
            aria-label="Search sets and artists"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile search */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          <SignedIn>
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 min-h-[40px] rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors duration-150"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                  userButtonTrigger:
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-full",
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-2 min-h-[40px] flex items-center rounded-lg hover:bg-zinc-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-3 py-2 min-h-[40px] flex items-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 active:bg-violet-700 transition-colors duration-150"
            >
              Sign up
            </Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
