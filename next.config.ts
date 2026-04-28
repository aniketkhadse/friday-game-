import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  allowedDevOrigins: ["10.10.7.244"],
};

export default nextConfig;
