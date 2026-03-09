module.exports = {
  trailingSlash: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}',
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_HOST_BACKEND ||
      process.env.BACKEND_API_INTERNAL ||
      'http://localhost:9002';
    return [
      {
        source: '/api/:path*/',
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },
};
