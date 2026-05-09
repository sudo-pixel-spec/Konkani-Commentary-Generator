/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Allows the app to be accessed via local network IP during development
  allowedDevOrigins: ['192.168.100.14', 'localhost'],
};

module.exports = nextConfig;
