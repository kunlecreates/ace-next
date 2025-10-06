/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence workspace root inference warning when multiple lockfiles exist
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig