# Technical SEO Findings
**Score: 35/100**

## Evidence

### HTTP Headers (Homepage)
```
HTTP/1.1 200 OK
Server: Vercel
Strict-Transport-Security: max-age=63072000
X-Clerk-Auth-Status: signed-out
X-Vercel-Cache: HIT
Content-Type: text/html; charset=utf-8
```

### robots.txt
```
GET /robots.txt → 404 Not Found
X-Clerk-Auth-Reason: protect-rewrite, session-token-and-uat-missing
```

### sitemap.xml
```
GET /sitemap.xml → 404 Not Found
```

### Canonical
Not found in homepage `<head>` section.

### Noindex directives
- Homepage: none (correct)
- /login: none (MISSING — should have noindex)
- /register: none (MISSING — should have noindex)
- 404 pages: `<meta name="robots" content="noindex">` ✅

## Findings

| Finding | Severity | Status |
|---------|----------|--------|
| robots.txt missing | Critical | ❌ |
| sitemap.xml missing | Critical | ❌ |
| Canonical tags missing | High | ❌ |
| Auth pages indexable | High | ❌ |
| Duplicate title tags | High | ❌ |
| HTTPS enforced | - | ✅ |
| HSTS present | - | ✅ |
| lang="en" set | - | ✅ |
| Vercel CDN caching | - | ✅ |
| favicon present | - | ✅ |
| Mobile viewport | - | ✅ |
| Security headers (CSP etc.) | Medium | ❌ |
