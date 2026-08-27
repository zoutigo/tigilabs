/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tigilabs/ui",
    "@tigilabs/types",
    "@tigilabs/schemas",
    "@tigilabs/config",
  ],
};

export default nextConfig;
