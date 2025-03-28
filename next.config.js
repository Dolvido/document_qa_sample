/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static exports and use server-side rendering
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    // Disable features that might cause pattern matching issues
    optimizeCss: false,
    optimizePackageImports: false,
    serverActions: false
  },
  // Disable webpack optimizations that might trigger pattern matching
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['node_modules/**']
    }
    return config
  }
}

module.exports = nextConfig 