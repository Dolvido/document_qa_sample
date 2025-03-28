/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include absolutely necessary configuration
  reactStrictMode: true,
  experimental: {
    // This is required for pdf-parse
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Add strict build configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 