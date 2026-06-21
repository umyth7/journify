"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  setId: string;
  onReset: () => void;
  onView: () => void;
}

type SetStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export function ProcessingOrDone({ setId, onReset, onView }: Props) {
  const [setStatus, setSetStatus] = useState<SetStatus>("PROCESSING");

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/sets/${setId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        setSetStatus(data.status);
        if (data.status === "READY" || data.status === "FAILED") {
          clearInterval(timer);
        }
      } catch {}
    };

    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [setId]);

  if (setStatus === "PROCESSING" || setStatus === "PENDING") {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Zap className="w-7 h-7 text-violet-400" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Sıkıştırılıyor…</h1>
          <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
            Dosyan MP3 128kbps formatına dönüştürülüyor.<br />
            Bu işlem dosya boyutuna göre 1-5 dakika sürebilir.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          İşlem devam ediyor, sayfayı kapatabilirsin
        </div>
      </div>
    );
  }

  if (setStatus === "FAILED") {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">İşlem başarısız</h1>
          <p className="text-zinc-400 mt-2 text-sm">Dosya dönüştürülemedi. Tekrar yüklemeyi dene.</p>
        </div>
        <Button onClick={onReset}>Tekrar dene</Button>
      </div>
    );
  }

  // READY
  return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Set hazır!</h1>
        <p className="text-zinc-400 mt-2 text-sm">Sıkıştırma tamamlandı. Setini dinleyebilirsin.</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onReset}>Başka set yükle</Button>
        <Button onClick={onView}>Seti gör</Button>
      </div>
    </div>
  );
}
