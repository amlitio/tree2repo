/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This ensures the app works correctly when deployed to Vercel's edge network
  swcMinify: true,
}

module.exports = nextConfig
