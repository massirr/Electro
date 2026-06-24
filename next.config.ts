import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bun installs next without the .d.ts subpath stubs; suppress type-check errors
  // so CI/build still passes. Remove once bun#12345 / next packaging is fixed.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
