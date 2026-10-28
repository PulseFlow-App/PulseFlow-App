import type { NextConfig } from "next";

/** Changes on every Vercel deploy; footer semver stays manual in app-version.ts. */
const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
  "dev";

const nextConfig: NextConfig = {
  // Dev: allow both localhost and 127.0.0.1 so client chunks hydrate
  // (otherwise header buttons look live but never receive React handlers).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
  ],
};

export default nextConfig;
