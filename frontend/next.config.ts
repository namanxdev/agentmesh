import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// In this monorepo, .env lives at the project root (one level up).
// loadEnvConfig is the same function Next.js uses internally — we just
// point it at the parent directory so NEXTAUTH_SECRET, DATABASE_CONN, etc.
// are available to the dev server and edge runtime.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
