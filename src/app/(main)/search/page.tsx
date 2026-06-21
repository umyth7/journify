import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { SearchContent } from "./_search-content";

export const metadata: Metadata = {
  title: "Search Live Sets",
  description: "Search thousands of long-form live DJ sets by mood, artist, or genre on Senssetify.",
  alternates: { canonical: "https://www.senssetify.com/search" },
  openGraph: {
    title: "Search Live Sets",
    description: "Find live sets that match your mood — search by artist, genre, or emotional state.",
    url: "https://www.senssetify.com/search",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search Live Sets | Senssetify",
    description: "Find live sets that match your mood — search by artist, genre, or emotional state.",
  },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            <div className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3.5 h-[52px]" />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
