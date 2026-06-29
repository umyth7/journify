import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";

// Signed-URL redirect: browser streams directly from R2, Vercel only handles the redirect.
// Range requests (seek) work because browsers forward Range headers on 302 redirects.
export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } }
) {
  const key = params.key.join("/");

  if (!key.startsWith("audio/")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const signedUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );

    return Response.redirect(signedUrl, 302);
  } catch {
    return new Response("Audio not found", { status: 404 });
  }
}
