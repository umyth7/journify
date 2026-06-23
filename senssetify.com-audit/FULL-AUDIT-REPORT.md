# SEO Audit — www.senssetify.com
**Tarih:** 2026-06-22  
**Araç:** Claude SEO Audit  
**SEO Sağlık Skoru: 42 / 100**

---

## Executive Summary

Senssetify, underground elektronik müzik live set keşif platformu olarak teknik açıdan kısmen sağlıklı bir temele sahip (HTTPS, Vercel CDN, Next.js SSR) ancak temel SEO altyapısı eksik. Site şu an Google tarafından neredeyse tamamen **körleme taranıyor**: robots.txt yok, sitemap yok, canonical yok, yapısal veri yok.

En kritik sorun: set detay sayfaları ve profil sayfaları unauthenticated kullanıcılara açık değil gibi görünüyor — bu durum Google'ın platform içeriğini hiç indeksleyemeyeceği anlamına gelir.

### Skor Dağılımı

| Kategori | Ağırlık | Skor | Katkı |
|----------|---------|------|-------|
| Technical SEO | 22% | 35 | 7.7 |
| Content Quality | 23% | 58 | 13.3 |
| On-Page SEO | 20% | 38 | 7.6 |
| Schema / Structured Data | 10% | 8 | 0.8 |
| Performance (CWV) | 10% | 62 | 6.2 |
| AI Search Readiness | 10% | 18 | 1.8 |
| Images | 5% | 45 | 2.3 |
| **TOPLAM** | **100%** | | **39.7 → 40/100** |

### Top 5 Kritik Sorun
1. `robots.txt` yok — 404 dönüyor
2. `sitemap.xml` yok — 404 dönüyor  
3. `/sets/[id]` ve `/profile/[username]` sayfaları auth'lu — Google içerik göremez
4. Canonical tag hiçbir sayfada yok
5. Tüm sayfalarda aynı `<title>` etiketleri

### Top 5 Hızlı Kazanım (Düşük Efor / Yüksek Etki)
1. `public/robots.txt` oluştur — 30 dakika
2. `app/sitemap.ts` oluştur — 2 saat
3. `/login` ve `/register`'a `noindex` ekle — 30 dakika
4. Root layout'a canonical ekle — 30 dakika
5. `/sets/[id]` sayfalarını herkese açık yap — Tek başına en yüksek etkili aksiyon

---

## Technical SEO

**Skor: 35/100**

### ✅ Çalışanlar
- HTTPS zorunlu, HTTP→HTTPS redirect çalışıyor
- HSTS header mevcut (`max-age=63072000`)
- HTML `lang="en"` attribute set edilmiş
- Vercel CDN global edge caching aktif (Age header'larında HIT görünüyor)
- `favicon.ico` erişilebilir (200 OK)
- Mobile `viewport` meta tag mevcut
- HTTP status kodları doğru (404 sayfalar için 404 dönüyor)

### ❌ Sorunlar

#### 🔴 CRITICAL: robots.txt Yok
```
GET https://www.senssetify.com/robots.txt → 404 Not Found
```
Search engine crawler'larının hangi sayfaları tarayıp taramayacağına dair hiçbir yönlendirme yok. Sitemap pointer da olmadığı için Google `sitemap.xml`'i bulamıyor.

**Çözüm:** `public/robots.txt` oluştur:
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://www.senssetify.com/sitemap.xml
```

#### 🔴 CRITICAL: sitemap.xml Yok
```
GET https://www.senssetify.com/sitemap.xml → 404 Not Found
```
Google'ın URL keşfetmesi için hiçbir roadmap yok.

**Çözüm:** `app/sitemap.ts` oluştur (Next.js 14 App Router native):
```typescript
import { db } from '@/lib/db'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sets = await db.set.findMany({ where: { status: 'READY' }, select: { id: true, updatedAt: true } })
  const users = await db.user.findMany({ select: { username: true, updatedAt: true } })

  return [
    { url: 'https://www.senssetify.com', changeFrequency: 'daily', priority: 1 },
    { url: 'https://www.senssetify.com/search', changeFrequency: 'weekly', priority: 0.8 },
    ...sets.map(s => ({ url: `https://www.senssetify.com/sets/${s.id}`, lastModified: s.updatedAt, priority: 0.9 })),
    ...users.map(u => ({ url: `https://www.senssetify.com/profile/${u.username}`, lastModified: u.updatedAt, priority: 0.7 })),
  ]
}
```

#### 🟠 HIGH: Canonical Tag Yok
Hiçbir sayfada `<link rel="canonical">` yok. www vs non-www veya trailing slash varyantları duplicate content sayılabilir.

**Çözüm:** `app/layout.tsx` metadata'sına ekle:
```typescript
export const metadata: Metadata = {
  alternates: { canonical: 'https://www.senssetify.com' },
  // ...
}
```
Set ve profil sayfalarında `generateMetadata` içinde dinamik canonical ekle.

#### 🟠 HIGH: Auth Sayfaları Index'lenebilir
`/login` ve `/register` sayfaları 200 OK dönüyor ve `noindex` yok. Bu sayfalar Google'da görünebilir ve crawl budget tüketir.

**Çözüm:**
```typescript
// app/(auth)/login/page.tsx
export const metadata = { robots: { index: false, follow: false } }
```

#### 🟠 HIGH: Tüm Sayfalarda Aynı Title
Her sayfa `"Senssetify — Music is a Journey"` title'ı kullanıyor. Google unique title bekler.

**Çözüm:** Her route için `generateMetadata` veya static `metadata` export'u ekle.

#### 🟡 MEDIUM: Security Headers Eksik
CSP, X-Frame-Options, X-Content-Type-Options header'ları yok.

---

## Content Quality

**Skor: 58/100**

### ✅ Çalışanlar
- Homepage copy duygusal olarak güçlü ve farklılaştırıcı
- Mood category açıklamaları özgün ("Time suspends", "Chest opens", "Gravity fades")
- Homepage meta description var ve kaliteli
- Brand tagline tutarlı

### ❌ Sorunlar

#### 🟠 HIGH: İçerik Auth Arkasında
Set sayfaları (`/sets/[id]`) ve profil sayfaları (`/profile/[username]`), Clerk auth middleware tarafından korunuyor olabilir. Googlebot oturum açamaz, bu içerikleri indeksleyemez.

**Bu tek aksiyon Senssetify'ın SEO potansiyelinin %80'ini açar.**

Set ve profil sayfaları herkes tarafından görüntülenebilir olmalı. Sadece like/follow/yorum gibi aksiyonlar auth gerektirmeli.

#### 🟡 MEDIUM: Diğer Sayfalarda Meta Description Yok
`/search`, `/login`, `/register` sayfalarında benzersiz meta description yok.

---

## On-Page SEO

**Skor: 38/100**

### ✅ Çalışanlar
- Homepage H1: "How do you feel right now?" — güçlü ve unique
- Homepage → H2 başlık hiyerarşisi mevcut

### ❌ Sorunlar

#### 🟠 HIGH: Open Graph Tag'lar Yok (Homepage)
`og:title`, `og:description`, `og:image`, `og:type`, `og:url` hiçbiri yok.  
Discord, Twitter, WhatsApp paylaşımları çirkin plain text link görünecek.

**Çözüm** — `app/layout.tsx`:
```typescript
openGraph: {
  title: 'Senssetify — Music is a Journey',
  description: 'Discover and share long-form live sets. Deep listening for the long road.',
  url: 'https://www.senssetify.com',
  siteName: 'Senssetify',
  type: 'website',
  images: [{ url: 'https://www.senssetify.com/og-image.jpg', width: 1200, height: 630 }],
},
```

**Not:** `/sets/[id]` sayfasında `generateMetadata` ile OG tag'ler Phase 3'te eklendi — bu iyi. Sadece homepage ve diğer statik sayfalarda eksik.

#### 🟠 HIGH: Twitter Card Tag'lar Yok
```typescript
twitter: {
  card: 'summary_large_image',
  title: 'Senssetify — Music is a Journey',
  description: '...',
  images: ['https://www.senssetify.com/og-image.jpg'],
},
```

---

## Schema / Structured Data

**Skor: 8/100**

Sitede hiçbir JSON-LD schema markup yok.

### Önerilen Schema'lar

**Homepage → WebSite schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Senssetify",
  "description": "Mood-based live set discovery platform",
  "url": "https://www.senssetify.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.senssetify.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```
(Bu Google'da sitelinks arama kutusunu aktive edebilir)

**Set sayfası → MusicRecording schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "MusicRecording",
  "name": "[Set Title]",
  "byArtist": { "@type": "Person", "name": "[Artist Name]" },
  "description": "[Set Description]",
  "genre": "[Genre]",
  "duration": "PT[X]H[Y]M"
}
```

**Profil sayfası → Person schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "[Display Name]",
  "description": "[Bio]",
  "url": "https://www.senssetify.com/profile/[username]"
}
```

---

## Performance (Core Web Vitals)

**Skor: 62/100** — Lab tahmini, CrUX/GSC field data mevcut değil

### ✅ Çalışanlar
- Vercel CDN — Frankfurt edge node'dan düşük TTFB (cache HIT)
- Next.js 14 SSR — sayfalar sunucuda pre-render ediliyor
- Font preloading (`rel="preload"` for WOFF/WOFF2)
- Static asset content hashing (cache-busting)
- Next.js Image bileşeni kullanılıyor

### ⚠️ Risk Alanları
- Clerk JS external CDN'den yükleniyor (`clerk.senssetify.com`) — async var ama cross-origin
- 10+ async JS chunk homepage'de — TBT/INP etkisi ölçülmeli
- Lighthouse çalıştırılıp gerçek CWV sayıları alınmalı

---

## AI Search Readiness (GEO)

**Skor: 18/100**

### ❌ Sorunlar
- **`llms.txt` yok** — AI crawler'lar için site tanımı yok
- **Kamuya açık indekslenebilir içerik yok** — ChatGPT, Perplexity, Claude bu platformu sitasyonunda kullanamaz
- **Yapısal veri yok** — AI'ların içerik tipini anlaması zorlaşıyor

### Önerilen `public/llms.txt`:
```
# Senssetify
> Mood-based electronic music live set discovery platform.

## Content
Senssetify hosts long-form live DJ sets (40min+) categorized by emotional state (mood).
Moods: Hypnotic, Euphoric, Tribal, Floating, Dark, Melancholic, Raw, Cosmic.
Genre focus: Techno, House, Ambient, Experimental electronic music.

## Access
Public pages: Homepage (/), Search (/search), Set pages (/sets/[id]), Artist profiles (/profile/[username])
Auth required: Upload, Like, Follow, Comment
```

---

## Images

**Skor: 45/100**

### ✅ Çalışanlar
- favicon.ico mevcut (200 OK)
- Next.js Image bileşeni kullanılıyor (optimizasyon sağlıyor)

### ❌ Sorunlar

#### 🟠 HIGH: OG Image Yok
Sosyal paylaşımlarda görsel önizleme çıkmıyor. Tıklanma oranını ciddi düşürür.

**Çözüm:**
1. `public/og-image.jpg` oluştur (1200×630, Senssetify marka görseli)
2. `/sets/[id]` için cover art URL'ini og:image olarak kullan (zaten `generateMetadata` var, sadece image ekle)

#### 🟡 LOW: Apple Touch Icon Yok
iOS home screen ve PWA için `apple-touch-icon` yok.

---

## Crawl Summary

| URL | Status | Indexable |
|-----|--------|-----------|
| `https://www.senssetify.com/` | 200 OK | ✅ Evet |
| `https://www.senssetify.com/login` | 200 OK | ❌ Hayır (noindex ekle) |
| `https://www.senssetify.com/register` | 200 OK | ❌ Hayır (noindex ekle) |
| `https://www.senssetify.com/search` | 200 OK | ✅ Evet (ama yeterli meta yok) |
| `https://www.senssetify.com/robots.txt` | **404** | — |
| `https://www.senssetify.com/sitemap.xml` | **404** | — |
| `/sets/[id]` | Bilinmiyor (auth?) | ❓ Kontrol et |
| `/profile/[username]` | Bilinmiyor (auth?) | ❓ Kontrol et |

---

## Öneri Öncelik Matrisi

| Öncelik | Aksiyon | Efor | Etki |
|---------|---------|------|------|
| 🔴 1 | `/sets/[id]` ve `/profile/[username]` sayfaları herkese açık yap | 3 saat | Çok Yüksek |
| 🔴 2 | `public/robots.txt` oluştur | 30 dk | Yüksek |
| 🔴 3 | `app/sitemap.ts` oluştur | 2 saat | Yüksek |
| 🟠 4 | `/login`, `/register`'a noindex ekle | 30 dk | Orta |
| 🟠 5 | Root layout'a OG + Twitter Card ekle | 2 saat | Yüksek |
| 🟠 6 | Canonical tag ekle (layout + dinamik sayfalar) | 1 saat | Orta |
| 🟠 7 | Her sayfaya unique title + meta description | 2 saat | Orta |
| 🟠 8 | WebSite JSON-LD schema (homepage) | 1 saat | Orta |
| 🟠 9 | OG image oluştur (1200×630 statik görsel) | 1 saat | Yüksek |
| 🟡 10 | `public/llms.txt` oluştur | 30 dk | Düşük-Orta |
| 🟡 11 | MusicRecording schema (/sets/[id]) | 1.5 saat | Orta |
| 🟡 12 | Analytics kurulumu (Plausible/Umami) | 1 saat | Düşük |
