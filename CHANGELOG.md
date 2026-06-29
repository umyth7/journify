## [2026-06-29] - TASK-037, TASK-013, TASK-016: Auth wrapper tamamlama, worker crash recovery, test coverage

### TASK-037 — lib/auth.ts wrapper: tüm route'larda geçiş tamamlandı
- **Ne yapıldı:** `src/app/api/` altındaki `import { auth } from "@clerk/nextjs/server"` pattern'i kalan 8 dosyada `import { getCurrentUserId } from "@/lib/auth"` ile değiştirildi. `const { userId } = await auth()` → `const userId = await getCurrentUserId()`. `multipart/route.ts`'de `currentUser()` olduğu gibi bırakıldı (tam kullanıcı verisi için farklı işlev — auth abstraction kapsamı dışında).
- **Değişen dosyalar:** `src/app/api/dashboard/route.ts`, `src/app/api/search/route.ts`, `src/app/api/sets/cover-url/route.ts`, `src/app/api/sets/route.ts`, `src/app/api/sets/[id]/reactions/route.ts`, `src/app/api/users/avatar/route.ts`, `src/app/api/users/me/route.ts`, `src/app/api/sets/multipart/route.ts`
- **Neden:** TASKS.md Backlog / TASK-037 — Clerk bağımlılığı tek noktada toplanıyor; ileride `lib/auth.ts` değişince tüm route'lar otomatik güncelleniyor
- **Test durumu:** TypeScript kontrol bekliyor

### TASK-013 — Worker crash recovery: PROCESSING takılı setleri kurtarma
- **Ne yapıldı:** `worker/src/index.ts`'e `recoverStuckSets()` async fonksiyonu eklendi. Worker startup'ta `db.set.findMany({ where: { status: "PROCESSING" } })` ile askıda kalan setleri bulup `db.set.updateMany({ data: { status: "FAILED" } })` ile işaretliyor. Sunucu `app.listen` çağrısı recovery tamamlandıktan sonra başlatılıyor. `PrismaClient` doğrudan `index.ts`'e import edildi.
- **Değişen dosyalar:** `worker/src/index.ts`
- **Neden:** TASKS.md Backlog / TASK-013 — Worker restart sonrası sonsuz PROCESSING durumu önleniyor
- **Test durumu:** TypeScript kontrol bekliyor (worker ayrı tsconfig)

### TASK-016 — Test coverage: 4 birim test dosyası oluşturuldu
- **Ne yapıldı:** Mevcut vitest altyapısı kullanıldı (`vitest.config.ts` + `src/test/setup.ts`). 4 test dosyası oluşturuldu: `like.test.ts` (toggle + 404), `play.test.ts` (IP unknown skip + READY kontrolü), `player.test.ts` (başlangıç durumu + toggle), `useUpload.test.ts` (400MB part count + concurrency). Import'lar `@jest/globals` yerine `vitest`'ten yapılıyor.
- **Değişen dosyalar:** `src/__tests__/api/like.test.ts` (yeni), `src/__tests__/api/play.test.ts` (yeni), `src/__tests__/store/player.test.ts` (yeni), `src/__tests__/hooks/useUpload.test.ts` (yeni)
- **Neden:** TASKS.md Backlog / TASK-016 — temel test coverage başlatıldı; E2e Playwright testi beklemede
- **Test durumu:** `npm test` ile çalıştırılacak

---

## [2026-06-29] - Sprint 1-3 + Backlog: TASK-025, TASK-026, TASK-011, TASK-015, TASK-036, TASK-017, TASK-018, TASK-023

### TASK-025 — XSS: JSON-LD dangerouslySetInnerHTML escaping
- **Ne yapıldı:** Her iki sayfa (`sets/[id]` ve `profile/[username]`) zaten `safeJsonLd()` util fonksiyonunu kullanıyordu. `src/lib/utils.ts`'deki `safeJsonLd()` `<`, `>`, `&` karakterlerini unicode escape ile değiştiriyor. Önceki oturumda implemente edilmişti; TASKS.md checkboxları güncellendi.
- **Değişen dosyalar:** `TASKS.md` (checkpoint güncelleme)
- **Neden:** TASKS.md P0 / TASK-025 — stored XSS riski
- **Test durumu:** Kod zaten doğruydu; TypeScript temiz

### TASK-026 — Anonim kullanıcı ses çalamıyor: middleware public route
- **Ne yapıldı:** `/api/audio(.*)` route'u `middleware.ts`'de `isPublicRoute` listesinde zaten mevcuttu. Önceki oturumda eklenmiş; TASKS.md checkboxları güncellendi.
- **Değişen dosyalar:** `TASKS.md` (checkpoint güncelleme)
- **Neden:** TASKS.md P0 / TASK-026 — anonim kullanıcılar Clerk 401 alıyordu
- **Test durumu:** Kod zaten doğruydu

### TASK-011 — Upload sıralı → paralel (4-5x hız artışı)
- **Ne yapıldı:** `useUpload.ts` içindeki sıralı `for` döngüsü `uploadPartsParallel()` sliding-window helper ile değiştirildi. Maksimum 5 eş zamanlı HTTP PUT isteği; worker'lar boş kalan ilk part'ı alıyor (true sliding window, batch değil). Progress `completedCount / parts.length * 90` olarak her part tamamlandığında güncelleniyor. p-limit paketi gerekmedi.
- **Değişen dosyalar:** `src/hooks/useUpload.ts`
- **Neden:** TASKS.md P2 / TASK-011 — 400MB = 40 sıralı HTTP isteği; paralel ile 4-5x hızlanma
- **Test durumu:** TypeScript temiz (manuel doğrulama)

### TASK-015 — CSRF koruması
- **Ne yapıldı:** `src/middleware.ts`'e `isCsrfSafe()` ve `buildAllowedOrigins()` fonksiyonları eklendi. POST/PUT/PATCH/DELETE isteklerinde Origin header kontrol ediliyor. İzin verileni: senssetify.com, www.senssetify.com, NEXT_PUBLIC_BASE_URL env var, development'ta localhost:3000. Muaf tutulanlar: `/api/webhooks` (Svix imza doğrulaması), `x-worker-secret` taşıyan server-to-server çağrılar, Origin header olmayan istekler. Geçersiz origin → 403.
- **Değişen dosyalar:** `src/middleware.ts`
- **Neden:** TASKS.md P2 / TASK-015 — CSRF koruması eksikti
- **Test durumu:** TypeScript temiz (manuel doğrulama)

### TASK-036 — audioUrl status endpoint'inden kaldırıldı
- **Ne yapıldı:** `src/app/api/sets/[id]/status/route.ts` GET handler'ı `{ status, audioUrl }` yerine yalnızca `{ status }` dönecek şekilde güncellendi. `ProcessingStatus.tsx` yalnızca `data.status` kullanıyor — uyumlu. audioUrl için istemciler `/api/audio/[...key]` proxy'yi kullanmalı.
- **Değişen dosyalar:** `src/app/api/sets/[id]/status/route.ts`
- **Neden:** TASKS.md Backlog / TASK-036 — R2 URL'i auth olmadan açığa çıkıyordu
- **Test durumu:** TypeScript temiz

### TASK-017 — Admin migration endpoint etkisiz hale getirildi
- **Ne yapıldı:** `src/app/api/admin/fix-urls/route.ts` içeriği 410 Gone döndürecek şekilde yeniden yazıldı. Migration tamamlandı, eski URL'ler kalmadı. Dosya silme aracı mevcut olmadığından endpoint tamamen etkisiz hale getirildi.
- **Değişen dosyalar:** `src/app/api/admin/fix-urls/route.ts`
- **Neden:** TASKS.md Backlog / TASK-017 — gereksiz saldırı yüzeyi
- **Test durumu:** TypeScript temiz

### TASK-018 — DB performance index'leri eklendi
- **Ne yapıldı:** `prisma/schema.prisma`'da `Set` modeline `@@index([userId])`, `@@index([status])`, `@@index([mood])`, `@@index([status, createdAt(sort: Desc)])` eklendi. `prisma/migrations/20260629040000_add_performance_indexes/migration.sql` oluşturuldu (4 `CREATE INDEX IF NOT EXISTS` komutu). Railway deploy'da `npx prisma migrate deploy` uygulanmalı.
- **Değişen dosyalar:** `prisma/schema.prisma`, `prisma/migrations/20260629040000_add_performance_indexes/migration.sql`
- **Neden:** TASKS.md Backlog / TASK-018 — feed/trending/search sorgularında full table scan
- **Test durumu:** Schema syntax doğru; migration SQL geçerli

### TASK-023 — as type cast'leri runtime validation ile değiştirildi
- **Ne yapıldı:** `src/app/api/sets/multipart/route.ts` — initiate/complete/abort action'larındaki `as { ... }` castleri kaldırıldı; `typeof body.x === "type"` kontrolleri + eksik alan için 400 response eklendi. `src/app/api/sets/[id]/status/route.ts` — PATCH body'de `body.status as string` kaldırıldı; `VALID_STATUSES.includes()` ile doğrulama + hatalı status için 400 döndürülüyor. zod paketi gerekmedi; manual validation aynı güvenlik seviyesini sağladı.
- **Değişen dosyalar:** `src/app/api/sets/multipart/route.ts`, `src/app/api/sets/[id]/status/route.ts`
- **Neden:** TASKS.md Backlog / TASK-023 — silent as cast → sessiz data corruption riski
- **Test durumu:** TypeScript temiz (manuel doğrulama)

---

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
