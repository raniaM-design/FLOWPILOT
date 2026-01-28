import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "chart.js",
    "chartjs-node-canvas",
    "canvas",
    "jspdf",
    "pptxgenjs",
    "mammoth",
    "sharp",
    "pg",
    "@prisma/client",
  ],
};

export default nextConfig;
