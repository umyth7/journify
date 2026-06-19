"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff, Mic2, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage, authTranslations } from "@/hooks/useLanguage";

type Role = "artist" | "listener";

export default function RegisterPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const t = authTranslations[lang];

  const [role, setRole] = useState<Role>("listener");
  const [username, setUsername] = useState("");
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
      const result = await signUp.create({
        username,
        emailAddress: email,
        password,
        unsafeMetadata: { role },
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(
        clerkErr.errors?.[0]?.longMessage ??
          (lang === "tr" ? "Kayıt başarısız. Tekrar dene." : "Sign up failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: Role; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      id: "artist",
      icon: <Mic2 className="w-5 h-5" aria-hidden="true" />,
      label: t.artist,
      desc: t.artistDesc,
    },
    {
      id: "listener",
      icon: <Headphones className="w-5 h-5" aria-hidden="true" />,
      label: t.listener,
      desc: t.listenerDesc,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header row: title + language switcher */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t.createAccount}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t.createAccountSub}</p>
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

      {/* Role selector */}
      <div role="group" aria-label={t.selectRole} className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t.selectRole}</p>
        <div className="grid grid-cols-2 gap-2">
          {roles.map(({ id, icon, label, desc }) => {
            const active = role === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                  active
                    ? "bg-violet-600/15 border-violet-500/60 text-violet-300 shadow-lg shadow-violet-900/20"
                    : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`transition-colors duration-200 ${active ? "text-violet-400" : "text-zinc-500"}`}
                >
                  {icon}
                </span>
                <span className="font-medium text-sm leading-none">{label}</span>
                <span className={`text-xs leading-snug transition-colors duration-200 ${active ? "text-violet-300/70" : "text-zinc-600"}`}>
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="username"
          type="text"
          label={t.username}
          placeholder="djsolar"
          autoComplete="username"
          required
          pattern="[a-zA-Z0-9_]+"
          helperText={t.usernameHint}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          id="email"
          type="email"
          label={t.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label={t.password}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            helperText={t.passwordHint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 bottom-[30px] text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
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

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? t.creating : t.createAccountBtn}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {t.haveAccount}{" "}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          {t.signInLink}
        </Link>
      </p>

      <p className="text-center text-xs text-zinc-600">
        {t.agreePrefix}{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          {t.terms}
        </Link>{" "}
        {t.and}{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          {t.privacy}
        </Link>
      </p>
    </div>
  );
}
