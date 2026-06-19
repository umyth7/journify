"use client";

import { useState, useEffect } from "react";

export type Lang = "en" | "tr";

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("journey_lang") as Lang | null;
    if (stored === "en" || stored === "tr") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("journey_lang", l);
    setLangState(l);
  };

  return { lang, setLang };
}

export const authTranslations = {
  en: {
    welcome: "Welcome back",
    welcomeSub: "Sign in to continue your journey",
    email: "Email",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgotPassword: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in…",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    createAccount: "Create your account",
    createAccountSub: "Start your journey today",
    username: "Username",
    usernameHint: "Letters, numbers and underscores only",
    passwordHint: "At least 8 characters",
    createAccountBtn: "Create account",
    creating: "Creating…",
    haveAccount: "Already have an account?",
    signInLink: "Sign in",
    agreePrefix: "By creating an account you agree to our",
    terms: "Terms",
    and: "and",
    privacy: "Privacy Policy",
    selectRole: "I am a…",
    artist: "Artist",
    artistDesc: "Upload & share live sets",
    listener: "Listener",
    listenerDesc: "Discover & follow artists",
  },
  tr: {
    welcome: "Tekrar hoş geldin",
    welcomeSub: "Yolculuğuna devam et",
    email: "E-posta",
    password: "Şifre",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    forgotPassword: "Şifremi unuttum",
    signIn: "Giriş yap",
    signingIn: "Giriş yapılıyor…",
    noAccount: "Hesabın yok mu?",
    createOne: "Oluştur",
    createAccount: "Hesap oluştur",
    createAccountSub: "Yolculuğuna bugün başla",
    username: "Kullanıcı adı",
    usernameHint: "Harf, rakam ve alt çizgi kullanabilirsin",
    passwordHint: "En az 8 karakter",
    createAccountBtn: "Hesap oluştur",
    creating: "Oluşturuluyor…",
    haveAccount: "Zaten hesabın var mı?",
    signInLink: "Giriş yap",
    agreePrefix: "Hesap oluşturarak kabul ediyorsun:",
    terms: "Kullanım Şartları",
    and: "ve",
    privacy: "Gizlilik Politikası",
    selectRole: "Ben bir…",
    artist: "Sanatçı",
    artistDesc: "Live set yükle ve paylaş",
    listener: "Dinleyici",
    listenerDesc: "Sanatçıları keşfet ve takip et",
  },
} as const;
