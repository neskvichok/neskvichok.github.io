/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/neskvichok.github.io' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/neskvichok.github.io/' : '',
  distDir: 'out'
};
export default nextConfig;
