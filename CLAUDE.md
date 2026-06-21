# Journey — Proje Bağlamı

## Proje Özeti
Live set yükleme ve dinleme platformu. Kullanıcılar en az 40 dk'lık live set yükleyebilir ve dinleyebilir. Marka adı: **Journey** (Music is a Journey).

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
- `Set` modeline `mood` alanı eklenecek (`enum` — Prisma şemasında)
- Feed ve arama sayfasında mood filtresi olarak görünecek
- Upload formuna genre yerine/yanına mood seçimi eklenecek
- Detaylı analiz: `docs/mood-category-analysis.md`

---

## Geliştirme Günlüğü

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

#### 📊 Durum
- Ana sayfa (`/`): ✅ Çalışıyor (mock data)
- `/sets/[id]` ve `/profile/[username]`: ✅ DB bağlı, 404 (henüz kayıt yok — Clerk webhook'tan user gelince çalışacak)
- `/login` ve `/register`: ✅ Çalışıyor (glassmorphism UI, TR/EN, rol seçici)
- Vercel production: ✅ READY (`journify-j3zsgp8sr-journalred.vercel.app`)

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