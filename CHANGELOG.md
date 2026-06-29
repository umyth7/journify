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
