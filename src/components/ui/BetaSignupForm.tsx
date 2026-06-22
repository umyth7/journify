"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "already" | "error";

export function BetaSignupForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Bir hata oluştu, tekrar dene.");
        setStatus("error");
        return;
      }
      setStatus(data.message === "already_subscribed" ? "already" : "success");
    } catch {
      setErrorMsg("Bağlantı hatası, tekrar dene.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`flex items-center gap-3 text-sm text-emerald-400 ${className ?? ""}`}>
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <span>Listeye eklendi — beta erişiminde seni haberdar edeceğiz.</span>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className={`flex items-center gap-3 text-sm text-zinc-400 ${className ?? ""}`}>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <span>Bu email zaten listede. Yakında haber vereceğiz.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adın (isteğe bağlı)"
          maxLength={80}
          className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-150"
        />
        <div className="relative flex-[2]">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ornek.com"
            required
            maxLength={254}
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-150"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors duration-150 shrink-0 min-h-[44px]"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Bildir"
          )}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
