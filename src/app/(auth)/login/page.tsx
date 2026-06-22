"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();

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
        setError("Sign in incomplete. Please check your email for verification.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Welcome back</h1>
        <p className="text-sm text-zinc-500 mt-1">Sign in to continue your journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
