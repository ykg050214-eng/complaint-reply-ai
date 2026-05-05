import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent bundling native-module packages that must run in Node.js
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;
