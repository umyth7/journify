"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Search, Upload, User } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  };

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
        <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-sm bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all duration-150">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
          <input
            name="q"
            type="search"
            placeholder="Search sets, artists…"
            className="bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none w-full"
            aria-label="Search sets and artists"
          />
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile search */}
          <Link
            href="/search"
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </Link>

          <SignedIn>
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 min-h-[40px] rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors duration-150"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload
            </Link>
            <div className="relative group">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonTrigger:
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-full",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Profilim"
                    labelIcon={<User className="w-4 h-4" />}
                    href={`/profile/${user?.username}`}
                  />
                </UserButton.MenuItems>
              </UserButton>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
            </div>
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
