import Link from "next/link";
import { Radio } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="flex items-center gap-2 mb-10 text-zinc-100 hover:text-violet-400 transition-colors duration-150"
        aria-label="Journey — go to home"
      >
        <Radio className="w-6 h-6 text-violet-500" aria-hidden="true" />
        <span className="text-xl font-semibold tracking-tight">Journey</span>
      </Link>

      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl shadow-black/40">
        {children}
      </div>
    </div>
  );
}
