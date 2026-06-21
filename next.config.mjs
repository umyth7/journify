/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public CDN — cover images and avatars
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      // Custom R2 domain (senssetify.com or any custom domain configured on R2)
      {
        protocol: "https",
        hostname: "senssetify.com",
      },
      {
        protocol: "https",
        hostname: "www.senssetify.com",
      },
      // Clerk avatar CDN
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default nextConfig;
