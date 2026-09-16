/** @type {import('next').NextConfig} */

// next-pwa 5.x is incompatible with Next.js 16 / Turbopack.
// PWA manifest is wired manually via public/manifest.json + _app.tsx <Head>.
// Service worker can be added in a later milestone with a compatible package.

const nextConfig = {
  reactStrictMode: false, // Babylon.js engine must not mount twice
  turbopack: {},
  transpilePackages: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials'],
};

module.exports = nextConfig;
