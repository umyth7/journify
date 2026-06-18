# Journey — Proje Bağlamı

## Proje Özeti
Live set yükleme ve dinleme platformu. Kullanıcılar en az 40 dk'lık live set yükleyebilir ve dinleyebilir. Marka adı: **Journey** (Music is a Journey).

## Mimari Kararlar
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind — Vercel'e deploy
- **Backend:** Railway veya Render üzerinde Node.js API (ayrı servis — FFmpeg timeout sorunu nedeniyle Vercel Edge Functions kullanılmıyor)
- **Depolama:** Cloudflare R2 (S3 uyumlu, egress ücretsiz, global CDN)
- **Transcoding:** FFmpeg ile MP3 → AAC 128kbps (~400MB → ~230MB)
- **Streaming:** R2'den HTTP range request ile progressive streaming (HLS yok)
- **Veritabanı:** PostgreSQL (Railway) + Prisma ORM
- **Auth:** Clerk veya NextAuth
- **State:** Zustand (audio player)
- **Queue:** BullMQ + Redis (transcoding jobs)
- **Hedef:** 100 kullanıcıyla başla, kolayca ölçeklenebilir olsun

## Klasör Yapısı
```
src/
├── app/
│   ├── (auth)/              # login, register
│   ├── (main)/              # ana layout (navbar)
│   │   ├── page.tsx         # ana sayfa / feed
│   │   ├── sets/[id]/       # set detay sayfası
│   │   └── profile/[username]/
│   └── api/                 # API route'ları
├── components/
│   ├── ui/                  # Button, Input, Card
│   ├── player/              # AudioPlayer
│   ├── set/                 # SetCard, SetGrid
│   └── profile/             # ProfileHeader, AvatarUpload
├── lib/
│   ├── db.ts                # Prisma client
│   ├── r2.ts                # Cloudflare R2 client
│   └── utils.ts
├── hooks/                   # usePlayer, useUpload
├── store/                   # Zustand store
├── types/                   # global TypeScript tipleri
└── styles/
```

## Geliştirme Planı (Fazlar)
- **Phase 1 (2 hafta):** Temel altyapı — DB, Auth, R2, FFmpeg worker
- **Phase 2 (2.5 hafta):** Upload & Audio core — player, streaming, metadata formu
- **Phase 3 (2 hafta):** Profil & Sosyal — like, follow, paylaşım
- **Phase 4 (1.5 hafta):** Ana sayfa & Keşif — feed, arama, trending
- **Phase 5 (2 hafta):** Güvenlik, optimizasyon, test
- **Phase 6 (2 hafta):** Launch — beta, email bildirimleri, analytics

Toplam: ~14 hafta (haftada 4 gün × 8 saat = 32 saat/hafta)

## Temel Özellikler
- Set yükleme: min 40 dk, max 3 saat, sadece audio; chunked multipart upload
- Betimleme / metadata zorunlu (başlık, açıklama, genre, kapak görseli)
- Audio player: play/pause, seek, süre göstergesi
- Profil: avatar, bio, sosyal linkler, yüklenen setler, beğenilen setler
- Like + Follow sistemi
- Sosyal paylaşım (og:image meta tag'leri)
- Upload sonrası transcoding status polling (SSE veya WebSocket)