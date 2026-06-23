# Action Plan — senssetify.com SEO
**Oluşturulma:** 2026-06-22 | **Skor:** 42/100

---

## Phase 1: Critical Fixes (Hafta 1 — ~5 saat)

### 1. public/robots.txt oluştur (30 dk)
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://www.senssetify.com/sitemap.xml
```
Dosya: `public/robots.txt`

### 2. app/sitemap.ts oluştur (2 saat)
Next.js 14 native sitemap generation. Homepage, /search, tüm READY set'ler, tüm kullanıcı profilleri dahil edilmeli.

### 3. /login ve /register'a noindex (30 dk)
Her iki sayfanın `page.tsx` dosyasına:
```typescript
export const metadata = { robots: { index: false, follow: false } }
```

### 4. Root layout.tsx'e canonical ekle (30 dk)
```typescript
alternates: { canonical: 'https://www.senssetify.com' }
```

### 5. ⭐ Set ve profil sayfalarını herkese açık yap (3 saat — EN YÜKSEK ETKİ)
`middleware.ts` veya Clerk `publicRoutes` konfigürasyonunu kontrol et. `/sets/:id` ve `/profile/:username` route'larını public yap. Sadece mutation endpoint'leri (like, follow, comment POST) auth korumalı kalmalı.

---

## Phase 2: High-Impact (Hafta 2-3 — ~8 saat)

### 6. Open Graph + Twitter Card (root layout) (2 saat)
```typescript
openGraph: {
  title: 'Senssetify — Music is a Journey',
  description: 'Discover and share long-form live sets. Deep listening for the long road.',
  url: 'https://www.senssetify.com',
  siteName: 'Senssetify',
  type: 'website',
  images: [{ url: 'https://www.senssetify.com/og-image.jpg', width: 1200, height: 630 }],
},
twitter: {
  card: 'summary_large_image',
  title: 'Senssetify — Music is a Journey',
  description: 'Discover and share long-form live sets.',
  images: ['https://www.senssetify.com/og-image.jpg'],
},
```

### 7. OG image oluştur (1 saat)
1200×630px görsel: dark background, Senssetify logo, tagline. `public/og-image.jpg` olarak kaydet.

### 8. Unique title + description — tüm sayfalar (2 saat)
| Sayfa | Önerilen Title |
|-------|---------------|
| `/search` | `Search Live Sets | Senssetify` |
| `/login` | `Sign In | Senssetify` (noindex'li) |
| `/register` | `Join Senssetify` (noindex'li) |
| `/upload` | `Upload Your Set | Senssetify` |
| `/profile/[username]` | `[DisplayName] — Live Sets | Senssetify` |
| `/sets/[id]` | `[Set Title] by [Artist] | Senssetify` (zaten var) |

### 9. WebSite JSON-LD schema (homepage) (1 saat)
SearchAction ile birlikte — Google'da sitelinks search box aktive edebilir.

### 10. MusicRecording schema (/sets/[id]) (2 saat)
`generateMetadata` içine JSON-LD ekle.

---

## Phase 3: Analytics & Authority (Ay 2)

### 11. Plausible veya Umami Analytics (1 saat)
Phase 6 planı kapsamında — önce Google Search Console'a kayıt.

### 12. Google Search Console'a sitemap gönder
Sitemap hazır olduktan sonra: GSC → Sitemaps → URL gönder.

### 13. llms.txt oluştur (30 dk)
`public/llms.txt` — AI crawler rehberi.

### 14. Security headers (next.config.mjs) (1 saat)
```javascript
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ],
}]
```

---

## Phase 4: Uzun Vadeli (Süregelen)

### 15. Mood landing pages
`/mood/hypnotic`, `/mood/euphoric` vb. statik SEO sayfaları — "hypnotic techno live sets" gibi uzun kuyruk keyword'leri hedef alır.

### 16. Person schema (/profile/[username])
Artist sayfaları için schema markup.

### 17. BreadcrumbList schema
Set ve profil sayfalarında navigasyon zenginleştirmesi.

---

## Beklenen Etki (Phase 1-2 Sonrası)

| Metrik | Şu An | Beklenen |
|--------|-------|---------|
| SEO Health Score | 42/100 | ~72/100 |
| Google indexlenen sayfa sayısı | ~1-3 | 100+ (tüm setler/profiller) |
| Sosyal paylaşım CTR | Düşük (görsel yok) | Orta-Yüksek (OG image) |
| Organic trafik | Neredeyse 0 | Başlangıç keşfi |
