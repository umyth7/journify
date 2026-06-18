import { Navbar } from "@/components/layout/Navbar";
import { AudioPlayer } from "@/components/player/AudioPlayer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950">
      <Navbar />
      <main className="pt-14 pb-24 max-w-7xl mx-auto px-4 sm:px-8">
        {children}
      </main>
      <AudioPlayer />
    </div>
  );
}
