/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Optimize static asset handling
  images: {
    unoptimized: true,
  },
  // Optimize static generation
  staticPageGenerationTimeout: 120,
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['pdf-parse']
  }
}

module.exports = nextConfig 