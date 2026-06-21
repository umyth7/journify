import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Senssetify — Music is a Journey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 55%, #1c1033 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          gap: 0,
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            borderRadius: "50%",
            background: "rgba(109,40,217,0.35)",
            filter: "blur(100px)",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(109,40,217,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 28, color: "#a78bfa" }}>◉</div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>
            Senssetify
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          Music is a Journey
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 22, color: "#a1a1aa", textAlign: "center", maxWidth: 600 }}>
          Discover long-form live sets by mood
        </div>

        {/* Mood tags */}
        <div style={{ display: "flex", gap: 10, marginTop: 36 }}>
          {["🌀 Hypnotic", "✨ Euphoric", "🌊 Floating", "🌑 Dark"].map((m) => (
            <div
              key={m}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: "1px solid rgba(167,139,250,0.3)",
                background: "rgba(109,40,217,0.15)",
                color: "#c4b5fd",
                fontSize: 16,
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
