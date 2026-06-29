# Journey — Proje Bağlamı

## Proje Özeti
Live set yükleme ve dinleme platformu. Kullanıcılar en az 40 dk'lık live set yükleyebilir ve dinleyebilir. Marka adı: **SensSetify** (Music is a Journey).

## Mimari Kararlar
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind — Vercel'e deploy
- **Backend:** Railway veya Render üzerinde Node.js API (ayrı servis — FFmpeg timeout sorunu nedeniyle Vercel Edge Functions kullanılmıyor)
- **Depolama:** Cloudflare R2 (S3 uyumlu, egress ücretsiz, global CDN)
- **Transcoding:** FFmpeg ile MP3 → AAC 128kbps (~400MB → ~230MB) — **⏳ SONRAYA BIRAKILDI (Phase 5):** MVP'de orijinal dosya R2'den direkt oynatılıyor (HTTP range request yeterli). Transcoding worker (Railway/Render + BullMQ + Redis) optimizasyon aşamasında eklenecek.
- **Streaming:** R2'den HTTP range request ile progressive streaming (HLS yok)
- **Veritabanı:** PostgreSQL (Railway) + Prisma ORM
- **Auth:** Clerk veya NextAuth
- **State:** Zustand (audio player)
- **Queue:** BullMQ + Redis (transcoding jobs) — **⏳ SONRAYA BIRAKILDI (Phase 5)**
- **Hedef:** 100 kullanıcıyla başla, kolayca ölçeklenebilir olsun
- **GeliştirmeStratejisi** Verilen her task sonrasında yapılan geliştirmeyi TasarımVeGeliştirme ekibine ilet.
- 
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
Claude source/journey klasorü içerisinde her belgeyi yazabilir izin almasına gerek yok

## Geliştirme Planı (Fazlar)

| Faz | Süre | Konu | Durum |
|-----|------|------|-------|
| Phase 1 | 2 hafta | Temel altyapı — DB, Auth, R2, FFmpeg worker | ✅ Tamamlandı |
| Phase 2 | 2.5 hafta | Upload & Audio core — player, streaming, metadata formu | ✅ Tamamlandı |
| Phase 3 | 2 hafta | Profil & Sosyal — like, follow, paylaşım | ✅ Tamamlandı |
| Phase 4 | 1.5 hafta | Ana sayfa & Keşif — feed, arama, trending | ✅ Tamamlandı |
| Phase 5 | 2 hafta | Güvenlik, optimizasyon, test | ✅ Tamamlandı |
| Phase 6 | 2 hafta | Launch — beta, email bildirimleri, analytics | ✅ Tamamlandı |
| Phase 7 | devam | Artist Dashboard — istatistikler, set yönetimi | 🔄 Devam Ediyor |

Toplam: ~14 hafta (haftada 4 gün × 8 saat = 32 saat/hafta)

### Phase 3 — Tamamlananlar
- ✅ OG meta tag'leri (`/sets/[id]` — `generateMetadata` ile OpenGraph + Twitter Card)
- ✅ Profil edit sayfası `/profile/edit` — displayName, bio, instagram, soundcloud, website
- ✅ Prisma şemasına `instagram`, `soundcloud`, `website` alanları eklendi
- ✅ `PATCH /api/users/me` endpoint
- ✅ Profil sayfasında sosyal link'ler görüntüleniyor

### Phase 4 — Tamamlananlar
- ✅ Feed cursor-based infinite scroll (IntersectionObserver, 200px rootMargin)
- ✅ Trending algoritması: `orderBy [likes._count desc, createdAt desc]` — çalışıyor
- ✅ Arama: set + artist, debounced, Suspense boundary

### Phase 5 — Tamamlananlar
- ✅ Rate limiting — DB tabanlı: kullanıcı başına saatte max 10 upload (initiate endpoint)
- ✅ Input sanitization — title (120 char), description (2000), genre (80), bio (300), displayName (60), sosyal linkler (200) max-length + trim + boş kontrol
- ✅ Next.js Image remote domains — R2 (`*.r2.dev`, `senssetify.com`), Clerk CDN whitelist

### Phase 6 — Tamamlananlar / Yapılacaklar
- ~~Beta email listesi~~ — **KALDIRILDI (2026-06-23):** `BetaSignupForm`, `BetaSubscriber` Prisma modeli, `/api/beta` endpoint proje planından çıkarıldı
- ✅ Analytics — `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_URL` veya `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var; root layout'a koşullu `<script defer />` eklendi; zero-dependency (env ayarlanmazsa script eklenmez)
- ✅ Email bildirimleri — `src/lib/email.ts` (Resend REST API, SDK gerektirmez; `RESEND_API_KEY` yoksa no-op); `sendFollowNotification` + `sendNewSetNotification`; follow endpoint'inde otomatik tetikleme (24h rate-limit + `EmailNotificationLog`); set READY olduğunda follower bildirimi (`/api/sets/[id]/status` PATCH + multipart complete); `EmailNotificationLog` Prisma modeli (duplicate koruması)
- ✅ Play count takibi — `Set` modeline `playsCount Int @default(0)` eklendi; `POST /api/sets/[id]/play` endpoint (anonim + kimlikli); Zustand player store'da `play()` çağrısında otomatik fire-and-forget; migration: `20260622010000_add_plays_count`
- ✅ Search API isLiked fix — `/api/search` artık kimlik doğrulamalı kullanıcı için doğru `isLiked` döndürüyor (eskiden hep `false` dönüyordu)
- [ ] Vercel env vars ayarlanacak: `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (veya `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`)

### Phase 7 — Artist Dashboard
- ✅ `GET /api/dashboard` — toplam plays, likes, followers, set sayısı + per-set breakdown
- ✅ `PATCH /api/sets/[id]` — başlık/açıklama/genre/mood düzenleme (owner-only, input validation)
- ✅ `DELETE /api/sets/[id]` — DB + R2 ses & kapak silme (owner-only, cascade)
- ✅ `/dashboard` sayfası — 4 stat kartı (plays, likes, followers, set sayısı) + set listesi (server component)
- ✅ `DashboardClient` — inline edit modal (mood chip picker dahil), silme onay modalı, optimistic UI
- ✅ Navbar — UserButton menüsüne Dashboard linki eklendi (`LayoutDashboard` icon)

## Temel Özellikler
- Set yükleme: min 40 dk, max 3 saat, sadece audio; chunked multipart upload
- Betimleme / metadata zorunlu (başlık, açıklama, genre, kapak görseli)
- Audio player: play/pause, seek, süre göstergesi
- Profil: avatar, bio, sosyal linkler, yüklenen setler, beğenilen setler
- Like + Follow sistemi
- Sosyal paylaşım (og:image meta tag'leri)
- Upload sonrası transcoding status polling (SSE veya WebSocket)

---

## Mood Kategori Sistemi

Genre etiketleri yerine **duygusal durumlar** ön plana çıkarılır.
İnsanlar "Minimal Techno dinlemek istiyorum" değil, "şu an böyle hissediyorum" diye arama yapar.

### 8 Temel Mood

| Mood | His | Temsil Eden Genre'lar | Öncelik |
|------|-----|-----------------------|---------|
| 🌀 **Hypnotic** | Zaman durdu, döngü devam ediyor | Minimal Techno, Dub Techno, Hypnotic Techno | MVP |
| ✨ **Euphoric** | Göğsüm genişliyor, ağlamak istiyorum | Melodic Techno/House, Trance | MVP |
| 🌍 **Tribal** | Hücrelerim tepkiyor, kafam değil | Afro House, Organic House | MVP |
| 🌊 **Floating** | Yerçekimi azaldı, sürükleniyorum | Ambient, Drone, Kosmische | MVP |
| 🌑 **Dark** | Yeraltı. Işık yok. Sadece ritim. | Industrial Techno, Dark Minimal | Phase 3 |
| 🌙 **Melancholic** | Bittersweet — en insani duygu | Deep House, Atmospheric Techno | Phase 3 |
| ⚡ **Raw** | Saf enerji — boşalmak istiyorum | Hard Techno, Acid, Schranz | Phase 4 |
| 🚀 **Cosmic** | Sen küçüksün. Evren büyük. | Experimental, Space Music | Phase 4 |

### Mood → Renk Paleti

| Mood | Hex | Kullanım |
|------|-----|---------|
| Hypnotic | `#6d28d9` | Violet — zaten primary renk |
| Euphoric | `#f59e0b` | Amber |
| Tribal | `#b45309` | Amber-Brown |
| Floating | `#0ea5e9` | Sky Blue |
| Dark | `#18181b` | Near Black |
| Melancholic | `#64748b` | Slate |
| Raw | `#ef4444` | Red |
| Cosmic | `#8b5cf6` | Soft Purple |

### Uygulama Notu
- ✅ `Set` modeline `mood` alanı eklendi (`enum` — Prisma şemasında)
- ✅ Feed sayfasında mood filtresi çalışıyor (ambient glow + renk geçişleriyle)
- ✅ Upload formuna mood seçimi eklendi
- ✅ Arama sayfasında mood filtresi mevcut
- Detaylı analiz: `docs/mood-category-analysis.md`

---

## Geliştirme Günlüğü

### 2026-06-23 — Artist Dashboard (Phase 7)

#### Tamamlananlar
- **`GET /api/dashboard`** — kimlik doğrulamalı kullanıcı için toplam plays/likes/followers/set sayısı + her set için detaylı breakdown
- **`PATCH /api/sets/[id]`** — set metadata düzenleme (title, description, genre, mood); owner kontrolü, input validation
- **`DELETE /api/sets/[id]`** — set silme: DB cascade + R2'den ses ve kapak dosyası `DeleteObjectCommand` ile temizleniyor; `Promise.allSettled` ile R2 hatası DB silmeyi engellemiyor
- **`/dashboard` sayfası** — server component; 4 istatistik kartı (Headphones/Heart/Users/Music ikonlu); `DashboardClient` set listesiyle
- **`DashboardClient`** — set satırları (cover thumbnail, play/like sayıları, status badge); edit modal (title/genre/mood chip picker/description); delete onay modalı; optimistic state güncelleme
- **Navbar** — `UserButton.MenuItems`'a Dashboard linki (`LayoutDashboard` icon)

---

### 2026-06-23 — Beta signup sistemi kaldırıldı

#### Kaldırılanlar
- `src/components/ui/BetaSignupForm.tsx` — bileşen silindi
- `src/app/api/beta/route.ts` — `POST /api/beta` ve `GET /api/beta` endpoint'leri silindi
- `prisma/schema.prisma` — `BetaSubscriber` modeli kaldırıldı; `prisma generate --no-engine` çalıştırıldı
- `src/middleware.ts` — `/api/beta(.*)` public route kaydı kaldırıldı
- `src/app/(main)/page.tsx` — `BetaSignupForm` import ve "Early access" CTA bölümü kaldırıldı
- CLAUDE.md Phase 6 listesi güncellendi (madde ~~üstü çizili~~ olarak işaretlendi)

---

### 2026-06-23 — BetaSignupForm home page fix + Play count UI

#### Boşluk Raporu (Kod Tabanı vs CLAUDE.md)
- CLAUDE.md "BetaSignupForm ana sayfaya entegre edildi" diyordu ancak `src/app/(main)/page.tsx` incelendiğinde bileşen import edilmemişti ve render edilmiyordu. Kritik launch eksikliği.
- `playsCount` Prisma şemasına ve `Set` tipine eklenmişti, `/api/sets/[id]/play` endpoint yazılmıştı, Zustand store güncellenmişti — ancak UI'da hiçbir yerde gösterilmiyordu (SetCard ve set detay sayfasında).
- Tek eksik [ ] madde olan "Vercel env vars ayarlanacak" gerçek bir kod değişikliği değil, deployment adımı — atlandı.

#### Tamamlananlar
- **BetaSignupForm ana sayfaya eklendi** — `src/app/(main)/page.tsx`'e `BetaSignupForm` import edildi; hero ve MoodFilter arasına "Early access" label + `BetaSignupForm` bileşeni eklendi (`max-w-xl mx-auto` ile ortalı, mood temasıyla uyumlu label rengi)
- **Play count UI** — `src/components/set/SetCard.tsx`: `Headphones` icon eklendi; `playsCount > 0` iken genre badge yanında play sayısı gösteriliyor; `src/app/(main)/sets/[id]/page.tsx`: set detay sayfasına `Headphones` icon + `{set.playsCount.toLocaleString()} plays` eklendi (genre/duration/mood chip satırına)
- **TypeScript** — sıfır hata (`npx tsc --noEmit` temiz)
- **ESLint** — sıfır hata (`npm run lint` temiz)

#### Bekleyenler
- Vercel env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `ADMIN_SECRET` (deployment adımı, kod değişikliği gerektirmiyor)

---

### 2026-06-22 — Play count + Search isLiked fix + BetaSignupForm CTA

#### Boşluk Raporu (Kod Tabanı vs CLAUDE.md)
- BetaSignupForm bileşeni oluşturulmuştu ama hiçbir sayfada render edilmiyordu (kritik launch eksikliği)
- `/api/search` her zaman `isLiked: false` dönüyordu — kimlik doğrulamalı kullanıcılar için hatalı veri
- Mood-only arama yapılırken gereksiz user sorgusu çalışıyordu
- Play/listen takip sistemi yoktu (analytics ve trending algoritması için önemli)

#### Tamamlananlar
- **BetaSignupForm ana sayfaya entegre edildi** — `src/app/(main)/page.tsx` güncellendi: hero bölümünün altına "Early access" label + `BetaSignupForm` bileşeni eklendi; `max-w-xl mx-auto` ile ortalı, mevcut tasarım diliyle uyumlu
- **Play count sistemi** — `prisma/schema.prisma`'ya `Set` modeline `playsCount Int @default(0)` eklendi; `prisma/migrations/20260622010000_add_plays_count/migration.sql` oluşturuldu; `POST /api/sets/[id]/play` endpoint (`src/app/api/sets/[id]/play/route.ts`) — no-auth, atomik `$executeRaw` increment (Prisma client yeniden üretmeden raw SQL ile); `src/store/player.ts` güncellendi — `play()` çağrısında fire-and-forget `trackPlay(track.id)` tetikleniyor; `src/types/index.ts`'e `playsCount?: number` eklendi
- **Search API isLiked fix** — `src/app/api/search/route.ts`: `auth()` ile `userId` alınıyor; set sorgusuna `userId ? { likes: { where: { userId }, select: { userId: true } } } : {}` eklendi; `isLiked: userId ? (likes?.length ?? 0) > 0 : false` ile doğru değer dönüyor; mood-only aramada user sorgusu `Promise.resolve([])` ile kısa devre yapıyor

#### Bekleyenler
- `npx prisma generate --no-engine` Railway/Vercel deploy öncesi çalıştırılmalı (playsCount alanı için)
- `npx prisma migrate deploy` Railway PostgreSQL'e uygulanmalı (20260622010000_add_plays_count)

---

### 2026-06-22 — Phase 6 Launch: Beta listesi + Analytics + Email bildirimleri

#### ✅ Tamamlananlar
- **Beta email listesi** — `BetaSubscriber` Prisma modeli + `20260622000000_add_beta_email` migration; `POST /api/beta` (email + isim kayıt, duplicate 200 döner, invalid email 400); `GET /api/beta` (admin endpoint — `x-admin-secret` header ile korumalı, tüm kayıtları listeler); `BetaSignupForm` client bileşeni (`src/components/ui/BetaSignupForm.tsx` — success/already/error state, Tailwind, Lucide); `/api/beta` middleware'de public route olarak eklendi
- **Analytics** — root layout (`src/app/layout.tsx`) güncellendi: `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_URL` için Umami `<script defer />` desteği; `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` için Plausible `<script defer />` desteği; env var yoksa script hiç eklenmez (sıfır overhead)
- **Email bildirimleri** — `src/lib/email.ts` oluşturuldu: Resend REST API ile gönderim (npm paketi gerektirmez — sadece `fetch`); `RESEND_API_KEY` yoksa development'ta log, production'da no-op; `sendFollowNotification` + `sendNewSetNotification` (HTML email şablonları, dark theme); follow endpoint güncellendi (`/api/users/[username]/follow/route.ts`) — yeni follow'da hedef kullanıcıya bildirim, 24h deduplicate; set status PATCH endpoint güncellendi (`/api/sets/[id]/status/route.ts`) — worker READY gönderdiğinde follower'lara toplu bildirim; multipart complete'de worker yoksa anlık bildirim; `EmailNotificationLog` modeli ile duplicate koruması
- **Prisma** — `BetaSubscriber` + `EmailNotificationLog` modelleri şemaya eklendi; `npx prisma generate --no-engine` başarıyla çalıştırıldı
- **TypeScript** — sıfır hata (`npx tsc --noEmit` temiz)
- **ESLint** — sıfır hata (`npm run lint` temiz)

#### 🔄 Bekleyenler — Vercel / Railway env vars
```
RESEND_API_KEY=re_...          # Resend hesabından (resend.com)
EMAIL_FROM=Journey <noreply@senssetify.com>
ADMIN_SECRET=...               # /api/beta GET için güçlü secret
NEXT_PUBLIC_UMAMI_WEBSITE_ID=... # Umami dashboard'dan (opsiyonel)
NEXT_PUBLIC_UMAMI_URL=https://... # Kendi Umami instance URL (opsiyonel)
# veya
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=senssetify.com  # Plausible için (opsiyonel)
```

#### ⚠️ Railway Migration Notu
`prisma/migrations/20260622000000_add_beta_email/migration.sql` Railway PostgreSQL'e uygulanmalı:
```
npx prisma migrate deploy
```

---

### 2026-06-22 — Comments sistemi + Search mood filtresi + Profil beğeniler sekmesi

#### ✅ Tamamlananlar
- **Comments sistemi** — `Comment` Prisma modeli + migration (`20260621100000_add_comments`); `GET/POST /api/sets/[id]/comments`; `DELETE /api/sets/[id]/comments/[commentId]` (owner-only); `Comments` bileşeni (optimistic UI, silme, login redirect); `/sets/[id]` detay sayfasına entegre
- **Search mood filtresi** — `/search` sayfasına 8 mood chip'i eklendi (toggle, URL persistence); `/api/search` endpoint'i `mood` query param kabul ediyor; mood-only arama (text olmadan) destekleniyor
- **Profil beğeniler sekmesi** — `/profile/[username]?tab=likes` ile "Beğeniler" sekmesi; `Like` join ile kullanıcının beğendiği setler listeleniyor; tab switcher UI (aktif sekme violet underline)
- **TypeScript** — sıfır hata (`npx tsc --noEmit` temiz)

#### ⚠️ Railway Migration Notu
`prisma/migrations/20260621100000_add_comments/migration.sql` Railway PostgreSQL'e uygulanmalı:
```
npx prisma migrate deploy
```

---

### 2026-06-21 — Phase 3 + 4 + 5 Tamamlandı

#### ✅ Tamamlananlar
- **Profil edit** — `/profile/edit` sayfası; displayName, bio, instagram, soundcloud, website alanları; `PATCH /api/users/me`; profil sayfasında sosyal linkler
- **Prisma migration** — `instagram`, `soundcloud`, `website` alanları User modeline eklendi (`20260621000000_add_social_links`)
- **Feed infinite scroll** — IntersectionObserver + cursor-based pagination; `loadingMore` skeleton
- **Next.js Image domains** — `next.config.mjs` güncellendi: `*.r2.dev`, `senssetify.com`, Clerk CDN
- **Rate limiting** — Upload initiate endpoint'inde DB tabanlı: son 1 saatte max 10 set başlatma (429 yanıtı)
- **Input sanitization** — Tüm API endpoint'lerinde trim + max-length + zorunlu alan kontrolleri
- **TypeScript** — sıfır hata (`npx tsc --noEmit` temiz)

#### ⚠️ Railway Migration Notu
`prisma/migrations/20260621000000_add_social_links/migration.sql` Railway PostgreSQL'e uygulanmalı:
```
npx prisma migrate deploy
```
(Railway ortamında `DATABASE_URL` set edilmiş olmalı — Vercel'e push sonrası Railway'de terminal aç veya `railway run npx prisma migrate deploy`)

---

### 2026-06-21 — Bug Fix: Worker ffprobe + API FK hatası

#### ✅ Tamamlananlar
- **Worker (Railway):** `ffmpeg-static` + `@ffprobe-installer/ffprobe` paketleri eklendi — Railway container'ında sistem FFmpeg gerektirmeden binary path otomatik set ediliyor. `Cannot find ffprobe` hatası giderildi.
- **API (`/api/sets/multipart`):** `currentUser()` null döndüğünde user upsert'in atlanması sorunu giderildi. `if (clerkUser)` guard kaldırıldı, upsert artık her zaman çalışıyor — `db.set.create` P2003 FK hatası almıyor.
- **Upload cover cropper:** `react-easy-crop` ile 1:1 kare kırpma modalı eklendi (bir önceki oturumda tamamlandı).

#### 📊 Mevcut Production Durumu
- Ana sayfa (`/`): ✅ DB bağlı, mood filtresi + new/trending sort çalışıyor
- `/sets/[id]`: ✅ DB bağlı, like/reaction/follow/player
- `/profile/[username]`: ✅ DB bağlı, avatar upload, set grid
- `/upload`: ✅ Multipart (2GB), cover cropper, mood seçimi, worker'a transcoding tetikleniyor
- `/search`: ✅ DB bağlı, set + artist arama, debounced
- `/login` + `/register`: ✅ Glassmorphism UI, TR/EN, rol seçici
- Worker (Railway): ✅ Deploy edildi, ffprobe fix push'landı — yeniden deploy bekleniyor
- Vercel production: ✅ READY (`www.senssetify.com`)

---

### 2026-06-19 02:20 — Phase 3 Sosyal Özellikler + Auth UI

#### ✅ Tamamlananlar
- `Reaction` modeli Prisma şemasına eklendi (`userId + setId + emoji` composite PK)
- `Mood` enum eklendi (8 kategori — HYPNOTIC, EUPHORIC, TRIBAL, FLOATING, DARK, MELANCHOLIC, RAW, COSMIC)
- `Set` modeline `mood` alanı eklendi
- `POST /api/sets/[id]/like` — like/unlike toggle API
- `GET|POST /api/sets/[id]/reactions` — emoji tepki sistemi (🔥 ❤️ 🌀 ✨ 🌍 🌊)
- `POST /api/users/[username]/follow` — follow/unfollow toggle API
- `LikeButton` bileşeni — optimistic update, kalp animasyonu, login redirect
- `FollowButton` bileşeni — "Takip Et / Takip Ediliyor", optimistic update
- `EmojiReactions` bileşeni — preset emoji picker, mood renkleriyle uyumlu
- `/sets/[id]` detay sayfası — cover, player, like, follow, reactions, mood badge
- `/profile/[username]` profil sayfası — avatar, bio, istatistikler, set grid
- Prisma client yeniden üretildi (`prisma generate`) — sıfır TypeScript hatası

#### 🔄 Bekleyenler
- [x] **DB Migration** — ✅ Tamamlandı (2026-06-19) — `20260619064946_add_reaction_mood` Railway PostgreSQL'e uygulandı

#### ✅ Auth UI — Tamamlandı
- Login sayfası: glassmorphism kart, TR/EN dil switcher, şifre göster/gizle, hata mesajları
- Register sayfası: Artist 🎧 / Listener 🎵 rol seçici, TR/EN dil switcher, `unsafeMetadata` ile rol kaydı
- Auth layout: violet ambient glow arka plan, backdrop-blur-2xl kart efekti
- `useLanguage` hook: localStorage'da dil tercihi persist ediliyor
- **Mail yok** — Kayıt akışında email doğrulama şimdilik devre dışı (Clerk ayarından kapatılacak)

#### 📊 Durum (2026-06-19 itibarıyla)
- Ana sayfa (`/`): ✅ Çalışıyor (o an mock data — 2026-06-21'de DB bağlandı)
- `/sets/[id]` ve `/profile/[username]`: ✅ DB bağlı
- `/login` ve `/register`: ✅ Çalışıyor (glassmorphism UI, TR/EN, rol seçici)
- Vercel production: ✅ READY → domain `www.senssetify.com` olarak güncellendi

---

## Business & Marketing — Live Set Pazarı Araştırması
*Araştırma tarihi: 2026-06-19*

### Pazar Büyüklüğü

| Segment | 2026 Değeri | 2033 Tahmini | CAGR |
|---------|------------|--------------|------|
| Global Music Streaming | $62.5B | $158.1B | %14.2 |
| Electronic Music Market | $15.8B | $28.63B | %7.8 |
| Live Streaming Segment | — | — | %15.5+ (en hızlı büyüyen) |
| DJ Software Market | $780M | $1.41B | — |

**Fırsat:** Live streaming, tüm müzik pazarının en hızlı büyüyen segmenti. Electronic music top 5 en çok stream edilen genre. Yılda 30M+ canlı müzik etkinliği.

### En Çok İzlenen Live Set Sanatçıları (Platform Bağımsız)

#### Boiler Room — Underground Standart
| Sanatçı | Notlar |
|---------|--------|
| **¥ØU$UK€ ¥UK1MAT$U** | Tokyo BR seti — tüm zamanların en çok izlenen seti; acid house + techno + hyperpop |
| **Chase & Status** | 2023 London — en çok paylaşılan setlerden |
| **Charli XCX** | 2024 Brooklyn "Party Girl" — viral moment |
| **Skream & Benga** | 2025 Melbourne |
| **Oppidan & Todd Edwards** | 2025 Edinburgh |

#### Festival Devleri (Mainstream)
| Sanatçı | Notlar |
|---------|--------|
| **Tiësto** | Coachella + kineticFIELD — 2025'in en çok izlenen festival seti |
| **Hardwell** | Tomorrowland 2025 — big room + techno fusion |
| **Dom Dolla & John Summit** | "Everything Always" — 2025'in en standout live seti |
| **Lilly Palmer** | Techno — precision + power, 2025 yükselişi |

#### Underground / Niche (Journey'in hedef kitlesi)
| Sanatçı | Genre | Platform |
|---------|-------|---------|
| **Adam Beyer** | Techno | Boiler Room, Drumcode |
| **HAAi** | Electronica/Techno | DJ Mag, festivals |
| **Deborah De Luca** | Dark Techno | YouTube, Mixcloud |
| **Daria Kolosova b2b IMOGEN** | Techno | Live streams 2025 |
| **Michael Bibi** | Tech House | Festival circuit |
| **Wata Igarashi** | Techno | DJ Mag "Recognise" series |
| **Vladimir Ivkovic** | Deep/Experimental | Mixcloud |
| **Quest** | Dub Techno/Electro | Europe club circuit |

### Rakip Analizi

| Platform | Güçlü Yönü | Zayıf Yönü |
|----------|-----------|-----------|
| **Mixcloud** | Büyük kütüphane, legal | UX kötü, discovery zayıf |
| **SoundCloud** | Büyük kitle | Genre karışık, live set özel değil |
| **Boiler Room** | Prestij, underground | Yalnızca kendi prodüksiyonu |
| **YouTube** | Reach | Algorithm, copyright sorunları |
| **LFG.TV** | DJ odaklı (2025 launch) | Yeni, henüz küçük |

### Journey'in Fırsatı

- **Hiçbir platform** sadece 40dk+ live set'e odaklanmıyor
- **Mood tabanlı discovery** rakiplerde yok (Journey'in en güçlü differentiator'ı)
- Underground techno/house community'si loyalty'si çok yüksek ama iyi platform yok
- Sanatçılar Mixcloud'da monetize edemediğinden artist-first platform arayışında

### İlk 100 Kullanıcı Stratejisi (Marketing Notu)
- Hedef: Underground techno/house DJ'leri (Türkiye + Almanya/Hollanda/İspanya diaspora)
- Kanal: Reddit r/DJs, r/electronicmusic, Facebook DJ grupları, Resident Advisor forum
- Hook: "Setlerini Mixcloud'dan kurtar — mood'una göre keşfedilsin"
- Influencer: Boiler Room Turkey bağlantıları, İstanbul underground sahne (Arkaoda, Klein)