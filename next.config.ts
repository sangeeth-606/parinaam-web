import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/heavy libs used only in server route handlers — keep them external
  // to the server bundle (exceljs ships CJS; @react-pdf/renderer has its own
  // bundler quirks under Turbopack).
  serverExternalPackages: ["@react-pdf/renderer", "exceljs", "docx"],
};

export default nextConfig;

