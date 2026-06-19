import Link from "next/link";
import { Radio } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-violet-800/10 blur-[100px]"
      />

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-10 text-zinc-100 hover:text-violet-400 transition-colors duration-200"
        aria-label="Senssetify — go to home"
      >
        <Radio className="w-6 h-6 text-violet-500" aria-hidden="true" />
        <span className="text-xl font-semibold tracking-tight">Senssetify</span>
      </Link>

      {/* Glassmorphism card */}
      <div className="w-full max-w-sm bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800/60 rounded-2xl p-8 shadow-2xl shadow-black/60 relative">
        {children}
      </div>
    </div>
  );
}
