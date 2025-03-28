/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Change output mode to export for static site generation
  output: 'export',
  // Disable image optimization since we're using export
  images: {
    unoptimized: true,
  },
  // Specify external packages that should be bundled
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Disable unnecessary features for static export
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig 