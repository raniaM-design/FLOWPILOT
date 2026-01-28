import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/config.ts");

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

export default withNextIntl(nextConfig);
