/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include absolutely necessary configuration
  reactStrictMode: true,
  experimental: {
    // This is required for pdf-parse
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Disable all pattern matching and file watching
  pageExtensions: ['js', 'jsx', 'ts', 'tsx']
}

module.exports = nextConfig 