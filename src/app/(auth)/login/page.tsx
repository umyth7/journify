"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage, authTranslations } from "@/hooks/useLanguage";

export default function LoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { lang, setLang } = useLanguage();
  const t = authTranslations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({ identifier: email.trim(), password: password.trim() });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        setError(
          lang === "tr"
            ? "Giriş tamamlanamadı. Email doğrulamanı kontrol et."
            : "Sign in incomplete. Please check your email for verification."
        );
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(
        clerkErr.errors?.[0]?.longMessage ??
          (lang === "tr" ? "Giriş başarısız. Tekrar dene." : "Sign in failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row: title + language switcher */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t.welcome}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t.welcomeSub}</p>
        </div>

        {/* Language toggle */}
        <div
          role="group"
          aria-label="Language"
          className="flex items-center bg-zinc-800 border border-zinc-700/50 rounded-lg p-0.5 shrink-0 mt-0.5"
        >
          {(["en", "tr"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                lang === l
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-pressed={lang === l}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          label={t.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
        />

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label={t.password}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              setPassword(e.clipboardData.getData("text").trim());
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 bottom-[11px] text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {t.forgotPassword}
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? t.signingIn : t.signIn}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {t.noAccount}{" "}
        <Link
          href="/register"
          className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          {t.createOne}
        </Link>
      </p>
    </div>
  );
}
