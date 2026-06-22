"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff, Mic2, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Role = "artist" | "listener";

export default function RegisterPage() {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [role, setRole] = useState<Role>("listener");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signUp.create({
        username: username.trim(),
        emailAddress: email.trim(),
        password: password.trim(),
        unsafeMetadata: { role },
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerifying(true);
      } else {
        setError("Registration incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        setError("Verification incomplete.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: Role; icon: React.ReactNode; label: string; desc: string }[] = [
    { id: "artist",   icon: <Mic2 className="w-5 h-5" aria-hidden="true" />,      label: "Artist",   desc: "Upload & share live sets" },
    { id: "listener", icon: <Headphones className="w-5 h-5" aria-hidden="true" />, label: "Listener", desc: "Discover & follow artists" },
  ];

  if (verifying) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Verify your email</h1>
          <p className="text-sm text-zinc-500 mt-1">Enter the code sent to {email}.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <Input
            id="code"
            type="text"
            label="Verification code"
            placeholder="123456"
            autoComplete="one-time-code"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
          />

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? "Verifying…" : "Verify"}
          </Button>

          <button
            type="button"
            onClick={() => { setVerifying(false); setCode(""); setError(""); }}
            className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
          >
            ← Go back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Create your account</h1>
        <p className="text-sm text-zinc-500 mt-1">Start your journey today</p>
      </div>

      {/* Role selector */}
      <div role="group" aria-label="I am a…" className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">I am a…</p>
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
                <span className={`transition-colors duration-200 ${active ? "text-violet-400" : "text-zinc-500"}`}>
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
          label="Username"
          placeholder="djsolar"
          autoComplete="username"
          required
          pattern="[a-zA-Z0-9_]+"
          helperText="Letters, numbers and underscores only"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
        />

        <Input
          id="email"
          type="email"
          label="Email"
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
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            helperText="At least 8 characters"
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
            className="absolute right-3 bottom-[30px] text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
            aria-label={showPassword ? "Hide password" : "Show password"}
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
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-zinc-600">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
