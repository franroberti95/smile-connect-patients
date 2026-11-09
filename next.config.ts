import type { NextConfig } from "next";

function previewFrameAncestors() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SMILE_CONNECT_API_URL ?? "").origin
  } catch {
    return "'none'"
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/clinica/preview",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${previewFrameAncestors()}` },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
