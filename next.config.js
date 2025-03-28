/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Add webpack configuration to handle potential circular dependencies
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here if needed
    return config
  }
}

module.exports = nextConfig 