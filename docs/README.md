# Journey — Geliştirme Notları

Bu klasör, projeye ait analiz ve teknik dokümanları içerir.

---

## Görev Geçmişi

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
