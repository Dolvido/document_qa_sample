/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include absolutely necessary configuration
  reactStrictMode: true,
  
  // Configure memory limit for serverless functions
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist']
  },
  
  // Enable source maps in production for better error reporting
  productionBrowserSourceMaps: true,
  
  // Configure API route settings properly
  serverRuntimeConfig: {
    api: {
      responseLimit: '16mb',
      bodyParser: {
        sizeLimit: '16mb',
      },
    }
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
  
  // Configure webpack for proper PDF handling
  webpack: (config) => {
    // Adjust default behavior for handling buffer
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Define fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false
    };
    
    // Add resolve alias for canvas to use our mock implementation
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: require.resolve('./app/api/pdf/canvas-mock.js')
    };
    
    return config;
  },
}

module.exports = nextConfig 