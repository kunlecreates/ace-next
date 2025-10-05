/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence workspace root inference warning when multiple lockfiles exist
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig