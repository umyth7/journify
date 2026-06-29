/**
 * Email notification helpers — powered by Resend.
 *
 * Required env var:  RESEND_API_KEY
 * Optional env var:  EMAIL_FROM  (defaults to "SensSetify <noreply@senssetify.com>")
 *
 * If RESEND_API_KEY is not set, all send calls are silently no-ops so the
 * app works without email configuration during development.
 *
 * TASK-022: Brand name pulled from APP_NAME constant.
 * TASK-039: All user-sourced strings are HTML-escaped before template interpolation.
 */

import { BASE_URL, APP_NAME } from "@/lib/constants";

const FROM = process.env.EMAIL_FROM ?? `${APP_NAME} <noreply@senssetify.com>`;

type SendResult = { ok: true } | { ok: false; error: string };

// ── HTML escaping ──────────────────────────────────────────────────────────────

/**
 * Escape user-controlled strings before interpolating them into HTML templates.
 * Prevents XSS in email clients that render HTML emails.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Transport ──────────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No-op in development / when unconfigured
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] Would send to ${to}: ${subject}`);
    }
    return { ok: true };
  }

  // Send via Resend REST API directly (no SDK needed — avoids install dependency)
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    console.error("[email] Resend API error:", err);
    return { ok: false, error: err };
  }
  return { ok: true };
}

// ── Templates ─────────────────────────────────────────────────────────────────

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;max-width:100%;">
      <!-- Header -->
      <tr>
        <td style="padding:24px 32px;border-bottom:1px solid #27272a;">
          <a href="${BASE_URL}" style="text-decoration:none;color:#a78bfa;font-weight:600;font-size:16px;">
            &#9675; ${APP_NAME}
          </a>
        </td>
      </tr>
      <!-- Body -->
      <tr><td style="padding:32px;">${bodyHtml}</td></tr>
      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #27272a;text-align:center;">
          <p style="margin:0;font-size:12px;color:#52525b;">
            <a href="${BASE_URL}" style="color:#71717a;text-decoration:none;">senssetify.com</a>
            &nbsp;·&nbsp;
            Music is a Journey
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Exported send helpers ─────────────────────────────────────────────────────

/**
 * Notify a user that someone followed them.
 */
export async function sendFollowNotification({
  toEmail,
  toName,
  followerName,
  followerUsername,
}: {
  toEmail: string;
  toName: string;
  followerName: string;
  followerUsername: string;
}): Promise<SendResult> {
  const subject = `${followerName} seni takip etmeye başladı`;
  const profileUrl = `${BASE_URL}/profile/${followerUsername}`;

  const body = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f4f4f5;">
      Yeni takipçi 👋
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
      <strong style="color:#e4e4e7;">${escapeHtml(followerName)}</strong> seni takip etmeye başladı.
    </p>
    <a href="${escapeHtml(profileUrl)}"
       style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
      Profili gör
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#52525b;">
      Merhaba ${escapeHtml(toName)}, bu bildirimi senssetify.com'dan alıyorsunuz.
    </p>
  `;

  return send(toEmail, subject, baseTemplate(subject, body));
}

/**
 * Notify a follower that an artist they follow uploaded a new set.
 */
export async function sendNewSetNotification({
  toEmail,
  toName,
  artistName,
  artistUsername,
  setTitle,
  setId,
  coverUrl,
}: {
  toEmail: string;
  toName: string;
  artistName: string;
  artistUsername: string;
  setTitle: string;
  setId: string;
  coverUrl?: string | null;
}): Promise<SendResult> {
  const subject = `${artistName} yeni bir set yükledi`;
  const setUrl = `${BASE_URL}/sets/${setId}`;
  const profileUrl = `${BASE_URL}/profile/${artistUsername}`;

  const coverImg = coverUrl
    ? `<img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(setTitle)}" width="96" height="96"
         style="border-radius:10px;display:block;margin:0 0 20px;object-fit:cover;" />`
    : "";

  const body = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f4f4f5;">
      Yeni set 🎧
    </h2>
    ${coverImg}
    <p style="margin:0 0 6px;font-size:13px;color:#71717a;">
      <a href="${escapeHtml(profileUrl)}" style="color:#a78bfa;text-decoration:none;">${escapeHtml(artistName)}</a>
    </p>
    <p style="margin:0 0 20px;font-size:17px;font-weight:600;color:#e4e4e7;">
      ${escapeHtml(setTitle)}
    </p>
    <a href="${escapeHtml(setUrl)}"
       style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
      Dinle
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#52525b;">
      Merhaba ${escapeHtml(toName)}, takip ettiğin bir sanatçı yeni set yükledi.
    </p>
  `;

  return send(toEmail, subject, baseTemplate(subject, body));
}
