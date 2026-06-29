# Journey — Geliştirme Notları

Bu klasör, projeye ait analiz ve teknik dokümanları içerir.

---

## Görev Geçmişi

### 2026-06-29 — Backlog (TASK-034, TASK-035, TASK-038, TASK-039, TASK-037, TASK-022)

**TASK-034 — Clerk getUserList 500 follower sınırı aşıldı**
`src/lib/notifications.ts`: `unnotifiedIds` dizisi 100'lük parçalara bölünüyor; her parça için ayrı `getUserList` çağrısı yapılıyor; `Promise.all` + `flatMap` ile sonuçlar birleştiriliyor. 500 üstü follower'da artık hiç bildirim sessizce atlanmıyor.

**TASK-035 — PlayLog IP "unknown" rate-limit devre dışıydı**
`src/app/api/sets/[id]/play/route.ts`: IP header önceliği `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` → `"unknown"` şeklinde düzenlendi. IP `"unknown"` olunca PlayLog oluşturulmuyor (rate-limit atlanıyor) ama `playsCount` artırılmaya devam ediyor.

**TASK-038 — Set sahibi kendi setindeki yorumları moderasyon yapabiliyor**
DELETE endpoint'inde yorum sahibi veya set sahibi kontrolü eklendi. `Comments.tsx`'e `isOwner?: boolean` prop'u eklendi; `(isOwn || isOwner)` koşulunda silme butonu gösteriliyor. Set detail page'den `isOwner={userId === set.userId}` aktarılıyor.

**TASK-039 — Email template HTML escaping**
`src/lib/email.ts`'e `escapeHtml()` fonksiyonu eklendi. `baseTemplate` title, tüm kullanıcı kaynaklı string'ler (`followerName`, `toName`, `artistName`, `setTitle`, `coverUrl` alt/src, href URL'leri) artık `escapeHtml()` ile sarılıyor.

**TASK-037 — Auth abstraction pilot: 5 API route geçişi**
5 API route'unda `import { auth } from "@clerk/nextjs/server"` → `import { getCurrentUserId } from "@/lib/auth"` geçişi yapıldı: `comments/[commentId]/route.ts`, `comments/route.ts`, `like/route.ts`, `sets/[id]/route.ts`, `users/[username]/follow/route.ts`. Davranış değişmedi; ileride Clerk bağımlılığı tek noktadan kesilebilir.

**TASK-022 — Marka adı: APP_NAME sabiti**
`src/lib/constants.ts`'e `export const APP_NAME = "SensSetify"` eklendi. `layout.tsx` tüm meta tag başlıkları ve `email.ts` FROM adresi + header artık `APP_NAME` kullanıyor. Canonical form: **SensSetify**.

---

### 2026-06-29 — Sprint 3 (TASK-030, TASK-031, TASK-032, TASK-033, TASK-008)

**TASK-030 — PlayLog FK kısıtı eklendi**
`prisma/schema.prisma`'da `PlayLog.set` ilişkisi ve `Set.playLogs` ters ilişkisi eklendi. `onDelete: Cascade` ile set silinince PlayLog'lar otomatik temizlenir. Migration: `20260629020000_add_playlog_fk` (manuel SQL, yerel DATABASE_URL yok).

**TASK-031 — BetaSubscriber drop migration oluşturuldu**
`20260629030000_drop_beta_subscriber/migration.sql` ile Railway DB'deki `BetaSubscriber` tablosu kaldırılacak. Schema drift giderildi.

**TASK-032 — description maxLength tutarsızlığı düzeltildi**
Upload formu: `maxLength={1000}` → `2000`, sayaç güncellendi. Dashboard edit modal: `maxLength={2000}` zaten mevcuttu; karakter sayacı eklendi. UI ve API artık aynı limiti gösteriyor.

**TASK-033 — prisma migrate deploy build script'inden kaldırıldı**
`package.json` build komutu: `prisma generate && next build`. `migrate deploy` artık Vercel build'ini tetiklemiyor; Railway'de ayrı one-off komutla çalıştırılmalı.

**TASK-008 — Yorum cursor-based pagination eklendi**
GET `/api/sets/[id]/comments?cursor=xxx&limit=20` desteği. `take: 100` hard cap kaldırıldı. Response'da `nextCursor` dönüyor. `Comments.tsx`'e "Daha fazla yorum yükle" butonu eklendi.

---

### 2026-06-29 — Sprint 2 (TASK-027, TASK-028, TASK-029, TASK-012)

**TASK-027 — Search API mood enum validasyonu**
`src/app/api/search/route.ts` dosyasına `VALID_MOODS` dizisi ve `ValidMood` tipi eklendi. Geçersiz mood query parametresi artık Prisma'ya ulaşmadan `null`'a düşüyor; 500 hatası ortadan kalktı.

**TASK-028 — COFFEE mood chip set detail sayfasında eksikti**
`MOOD_LABELS` objesine `COFFEE` entry'si eklendi. COFFEE mood'lu setlerde chip artık amber renkle render ediliyor.

**TASK-029 — Worker gerçek duration'ı DB'ye yazıyor**
`worker/src/transcode.ts` içinde her iki READY branch'ine `duration: Math.round(probe.duration)` eklendi. `multipart/route.ts` içinde `duration: 0` placeholder kaydediliyor ve worker ffprobe ölçümüyle üzerine yazıyor.

**TASK-012 — R2_PUBLIC_URL non-null assertion kaldırıldı**
`avatar/route.ts` içindeki `process.env.R2_PUBLIC_URL!` assertion'ları `?? ""` fallback ile değiştirildi. Env var tanımsızsa TypeError yerine 400 dönüyor.

---

## Belgeler

| Dosya | İçerik |
|-------|--------|
| `ANALYSIS_REPORT.md` | Kod tabanı analiz raporu |
| `GROWTH_ANALYSIS.md` | Büyüme ve pazar analizi |
| `mood-category-analysis.md` | Mood kategori sistemi detayları |
| `pending-security-notes.md` | Bekleyen güvenlik notları |
