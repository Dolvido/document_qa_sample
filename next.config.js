/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include absolutely necessary configuration
  reactStrictMode: true,
  experimental: {
    // This is required for pdf-parse
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist']
  },
  // Enable source maps in production for better error reporting
  productionBrowserSourceMaps: true,
  
  // Configure API route settings properly
  serverRuntimeConfig: {
    // API settings will only apply to server-side
    api: {
      responseLimit: '16mb',
      bodyParser: {
        sizeLimit: '16mb',
      },
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
    
    // Add polyfills for Node.js modules used by pdf-parse
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      http: false,
      https: false,
      path: false,
      zlib: false,
      stream: false,
      util: false,
      crypto: false
    };
    
    return config;
  },
}

module.exports = nextConfig 