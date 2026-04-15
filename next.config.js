const path = require('path');

module.exports = {
  trailingSlash: true,
  output: 'standalone',
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}',
    },
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      'fflate/lib/node.cjs': './node_modules/fflate/esm/browser.js',
      'jspdf': './node_modules/jspdf/dist/jspdf.umd.min.js',
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      jspdf: require.resolve('jspdf/dist/jspdf.umd.min.js'),
    };
    return config;
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_API_INTERNAL ||
      process.env.NEXT_PUBLIC_HOST_BACKEND ||
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
