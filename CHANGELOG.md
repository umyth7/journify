## [2026-06-29] - Backlog: TASK-034, TASK-035, TASK-038, TASK-039, TASK-037, TASK-022

### TASK-034 — Clerk getUserList 500 follower sınırı aşıldı
- **Ne yapıldı:** `src/lib/notifications.ts` içindeki tek `getUserList` çağrısı, `unnotifiedIds` dizisini 100'lük parçalara bölen ve `Promise.all` ile paralel çalıştıran paginated yaklaşıma dönüştürüldü. `batchResults.flatMap` ile sonuçlar birleştiriliyor; 500 üstü follower'da da tüm kullanıcılara bildirim gidiyor.
- **Değişen dosyalar:** `src/lib/notifications.ts`
- **Neden:** TASKS.md Backlog / TASK-034 — `limit: Math.min(..., 500)` ile 500 üstü follower sessizce atlanıyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-035 — PlayLog IP "unknown" rate-limit devre dışıydı + CF header eksikti
- **Ne yapıldı:** `src/app/api/sets/[id]/play/route.ts` güncellendi. IP çözümlemesi: `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` → `"unknown"` öncelik sırasıyla. IP `"unknown"` ise PlayLog yazılmıyor ama `playsCount` yine de artırılıyor (tüm anonim isteklerin aynı rate-limit bucket'ına düşmesini önler).
- **Değişen dosyalar:** `src/app/api/sets/[id]/play/route.ts`
- **Neden:** TASKS.md Backlog / TASK-035 — "unknown" IP tüm anonim istekleri tek bucket'a sokuyordu, rate limit etkisizdi
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-038 — Set sahibi kendi setindeki yorumları moderasyon yapabiliyor
- **Ne yapıldı:** `src/app/api/sets/[id]/comments/[commentId]/route.ts` DELETE endpoint'i: yorum sahibi kontrolünün yanına set sahibi kontrolü eklendi (`comment.userId !== userId` ise `set.userId === userId` de kontrol ediliyor). `src/components/set/Comments.tsx`'e `isOwner?: boolean` prop eklendi; silme butonu `isOwn || isOwner` koşulunda gösteriliyor. `src/app/(main)/sets/[id]/page.tsx`: `<Comments setId={set.id} isOwner={userId === set.userId} />` ile prop aktarıldı.
- **Değişen dosyalar:** `src/app/api/sets/[id]/comments/[commentId]/route.ts`, `src/components/set/Comments.tsx`, `src/app/(main)/sets/[id]/page.tsx`
- **Neden:** TASKS.md Backlog / TASK-038 — set sahibi spam/uygunsuz yorumları kaldıramıyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-039 — Email template HTML escaping eklendi
- **Ne yapıldı:** `src/lib/email.ts`'e `escapeHtml(s: string)` yardımcı fonksiyon eklendi (`&`, `<`, `>`, `"` karakterlerini entity'lere çeviriyor). `baseTemplate` içinde `<title>` etiketi, `sendFollowNotification` içinde `followerName` ve `toName`, `sendNewSetNotification` içinde `artistName`, `setTitle`, `toName`, `coverUrl` (alt + src) ve tüm href URL'leri `escapeHtml()` ile sarıldı.
- **Değişen dosyalar:** `src/lib/email.ts`
- **Neden:** TASKS.md Backlog / TASK-039 — kullanıcı kaynaklı string'ler HTML template'e doğrudan interpolate ediliyordu; email client XSS riski
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-037 — Auth abstraction pilot: 5 API route'u `getCurrentUserId` kullanıyor
- **Ne yapıldı:** 5 API route'unda `import { auth } from "@clerk/nextjs/server"` → `import { getCurrentUserId } from "@/lib/auth"` olarak değiştirildi; `const { userId } = await auth()` → `const userId = await getCurrentUserId()` olarak güncellendi. Follow route'unda `clerkClient` import'u ayrı tutuldu (farklı amaçla kullanılıyor). Geçiş yapılan route'lar: `sets/[id]/comments/[commentId]/route.ts`, `sets/[id]/comments/route.ts`, `sets/[id]/like/route.ts`, `sets/[id]/route.ts`, `users/[username]/follow/route.ts`.
- **Değişen dosyalar:** `src/app/api/sets/[id]/comments/[commentId]/route.ts`, `src/app/api/sets/[id]/comments/route.ts`, `src/app/api/sets/[id]/like/route.ts`, `src/app/api/sets/[id]/route.ts`, `src/app/api/users/[username]/follow/route.ts`
- **Neden:** TASKS.md Backlog / TASK-037 — Clerk bağımlılığının tek noktadan yönetilebilmesi için pilot geçiş
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-022 — Marka adı tutarsızlığı: APP_NAME sabiti eklendi
- **Ne yapıldı:** `src/lib/constants.ts`'e `export const APP_NAME = "SensSetify"` eklendi. `src/app/layout.tsx`: WEBSITE_SCHEMA `name`, metadata `title.default`, `title.template`, `openGraph.title`, `openGraph.siteName`, `openGraph.images[0].alt`, `twitter.title` alanları `APP_NAME` kullanıyor. `src/lib/email.ts`: `FROM` default ve `baseTemplate` header'ı `APP_NAME` kullanıyor.
- **Değişen dosyalar:** `src/lib/constants.ts`, `src/app/layout.tsx`, `src/lib/email.ts`
- **Neden:** TASKS.md Backlog / TASK-022 — "Senssetify", "SensSetify", "Journey" karışık kullanılıyordu; canonical form "SensSetify"
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

## [2026-06-29] - Sprint 3: TASK-030, TASK-031, TASK-032, TASK-033, TASK-008

### TASK-030 — PlayLog FK kısıtı eklendi
- **Ne yapıldı:** `prisma/schema.prisma`'da `PlayLog` modeline `set Set @relation(fields: [setId], references: [id], onDelete: Cascade)` eklendi. `Set` modeline `playLogs PlayLog[]` eklendi. `@@index([setId, ip, createdAt])` zaten mevcuttu. `npx prisma migrate dev` yerel `DATABASE_URL` olmadığı için çalışmadı; SQL migration dosyası manuel olarak `prisma/migrations/20260629020000_add_playlog_fk/migration.sql` olarak oluşturuldu.
- **Değişen dosyalar:** `prisma/schema.prisma`, `prisma/migrations/20260629020000_add_playlog_fk/migration.sql`
- **Neden:** TASKS.md Sprint 3 / TASK-030 (P2) — set silindiğinde PlayLog kayıtları orphaned kalıyordu; geçersiz setId ile kayıt oluşturulabiliyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz. Railway'e deploy sırasında `npx prisma migrate deploy` ile uygulanmalı.

### TASK-031 — BetaSubscriber drop migration oluşturuldu
- **Ne yapıldı:** `prisma/migrations/20260629030000_drop_beta_subscriber/migration.sql` oluşturuldu (`DROP TABLE IF EXISTS "BetaSubscriber"`). Timestamp `20260629000000` zaten `add_coffee_mood` tarafından kullanıldığından `030000` kullanıldı.
- **Değişen dosyalar:** `prisma/migrations/20260629030000_drop_beta_subscriber/migration.sql`
- **Neden:** TASKS.md Sprint 3 / TASK-031 (P2) — BetaSubscriber şemadan kaldırıldı ama Railway DB'de tablo hâlâ var; schema drift
- **Test durumu:** Sadece SQL dosyası oluşturma; Railway'e deploy sırasında `npx prisma migrate deploy` ile uygulanmalı.

### TASK-032 — description maxLength tutarsızlığı düzeltildi
- **Ne yapıldı:** `src/app/(main)/upload/page.tsx` içindeki textarea `maxLength={1000}` → `maxLength={2000}` ve sayaç metni `/1000` → `/2000` güncellendi. `src/components/dashboard/DashboardClient.tsx` içinde `maxLength={2000}` zaten mevcuttu; karakter sayacı (`{editState.description.length}/2000`) eklendi.
- **Değişen dosyalar:** `src/app/(main)/upload/page.tsx`, `src/components/dashboard/DashboardClient.tsx`
- **Neden:** TASKS.md Sprint 3 / TASK-032 (P2) — UI 1000 char gösterirken API 2000 kabul ediyordu; tutarsızlık
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-033 — prisma migrate deploy build script'inden kaldırıldı
- **Ne yapıldı:** `package.json` içindeki `"build"` script'inden `prisma migrate deploy &&` kaldırıldı. Yeni değer: `"build": "prisma generate && next build"`. Prisma generate tip üretimi için kaldı; migration Vercel build'ine değil Railway'de ayrı one-off komutla çalıştırılmalı.
- **Değişen dosyalar:** `package.json`
- **Neden:** TASKS.md Sprint 3 / TASK-033 (P2) — paralel Vercel build'lerde race condition riski; preview deploy'larda production DB'ye migration tetikleniyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-008 — Yorum pagination eklendi
- **Ne yapıldı:** `src/app/api/sets/[id]/comments/route.ts` GET endpoint'ine `cursor` ve `limit` (default 20, max 100) query parametreleri eklendi. `take: limit + 1` pattern ile `hasMore` belirlendi; response'a `nextCursor` (son elemanın `id`si) eklendi. `take: 100` hard cap kaldırıldı. `src/components/set/Comments.tsx`'e `loadingMore` state, `handleLoadMore` fonksiyonu ve `nextCursor` varsa görünen "Daha fazla yorum yükle" butonu eklendi. Yorum sayacı `nextCursor` varsa `(N+)` gösteriyor.
- **Değişen dosyalar:** `src/app/api/sets/[id]/comments/route.ts`, `src/components/set/Comments.tsx`
- **Neden:** TASKS.md Sprint 3 / TASK-008 (P2) — `take: 100` hard cap'i aşan yorumlar kullanıcıya görünmüyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

---

## [2026-06-29] - Sprint 2: TASK-027, TASK-028, TASK-029, TASK-012

### TASK-027 — Search API mood enum validasyonu
- **Ne yapıldı:** `src/app/api/search/route.ts` dosyasının üstüne `VALID_MOODS` const dizisi ve `ValidMood` tipi eklendi. `mood` query parametresi artık Prisma'ya geçirilmeden önce dizi üyeliği kontrolünden geçiyor; geçersiz değer (`?mood=INVALID` vb.) `null` olarak ele alınıyor ve boş sonuç dönüyor, 500 hatası yok.
- **Değişen dosyalar:** `src/app/api/search/route.ts`
- **Neden:** TASKS.md Sprint 2 / TASK-027 (P1) — geçersiz mood enum Prisma P2009 / 500 döndürüyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-028 — COFFEE mood chip set detail sayfasında eksikti
- **Ne yapıldı:** `src/app/(main)/sets/[id]/page.tsx` içindeki `MOOD_LABELS` objesine `COFFEE` entry'si eklendi (`label`, `emoji`, `color` alanlarıyla). `set.mood === "COFFEE"` olan setlerde artık amber temalı chip render ediliyor.
- **Değişen dosyalar:** `src/app/(main)/sets/[id]/page.tsx`
- **Neden:** TASKS.md Sprint 2 / TASK-028 (P1) — COFFEE mood chip UI'da sessizce kayboluyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-029 — Worker gerçek duration'ı DB'ye yazıyor
- **Ne yapıldı:** `worker/src/transcode.ts` içinde hem "skip transcode" hem de "transcode + upload" branch'lerine `duration: Math.round(probe.duration)` alanı eklendi. `src/app/api/sets/multipart/route.ts` içinde `db.set.create` çağrısında `duration: 0` olarak kaydediliyor (yorum: "worker overwrites this with real duration from ffprobe"). Böylece DB'deki süre artık worker'ın ffprobe ölçümüne dayanıyor, client tarafından manipüle edilemez.
- **Değişen dosyalar:** `worker/src/transcode.ts`, `src/app/api/sets/multipart/route.ts`
- **Neden:** TASKS.md Sprint 2 / TASK-029 (P1) — yanlış süre UI'da gösteriliyor, 40dk minimum kuralı client-side ile atlatılabiliyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz

### TASK-012 — R2_PUBLIC_URL non-null assertion runtime crash riski giderildi
- **Ne yapıldı:** `src/app/api/users/avatar/route.ts` içinde `process.env.R2_PUBLIC_URL!` (non-null assertion) kaldırıldı. POST handler'da `const r2PublicUrl = process.env.R2_PUBLIC_URL ?? ""` ile güvenli erişim sağlandı. PATCH handler'da da aynı pattern uygulandı; env var tanımsızsa `TypeError` yerine `avatarUrl.startsWith("")` kontrolü geçmez ve 400 döner — crash olmaz.
- **Değişen dosyalar:** `src/app/api/users/avatar/route.ts`
- **Neden:** TASKS.md Sprint 2 / TASK-012 (P1) — undefined `R2_PUBLIC_URL` tüm avatar güncellemelerini 500 ile çökertiyordu
- **Test durumu:** `npx tsc --noEmit` geçti, `npm run lint` temiz
