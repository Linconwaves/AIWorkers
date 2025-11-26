/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.linconwaves.com',
      },
      {
        protocol: 'https',
        hostname: 'fonts.linconwaves.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.worker.linconwaves.com',
      },
    ],
  },
};

module.exports = nextConfig;
