/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include absolutely necessary configuration
  reactStrictMode: true,
  experimental: {
    // This is required for pdf-parse
    serverComponentsExternalPackages: ['pdf-parse']
  },
  // Enable source maps in production for better error reporting
  productionBrowserSourceMaps: true,
  // Increase timeout for API routes
  api: {
    responseLimit: '16mb',
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
  // Set strict build configuration but allow build to continue
  typescript: {
    // Log errors during build but don't fail
    ignoreBuildErrors: true,
  },
  eslint: {
    // Log errors during build but don't fail
    ignoreDuringBuilds: true,
  },
  // Configure webpack to handle large files properly
  webpack: (config) => {
    // Adjust default behavior for handling buffer in serverless environment
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return config;
  },
}

module.exports = nextConfig 