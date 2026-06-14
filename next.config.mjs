/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['recharts', 'es-toolkit'],
  experimental: { esmExternals: 'loose' }
};

export default nextConfig;
