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
  },
  // Disable all pattern matching and file watching
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Add specific build configuration
  distDir: 'build',
  poweredByHeader: false,
  generateEtags: false,
  // Disable file watching during build
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0
  },
  // Restrict webpack from scanning too many files
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.next', '**/out']
    };
    return config;
  }
}

module.exports = nextConfig 