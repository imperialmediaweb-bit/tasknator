/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Lowers peak memory during compilation (helps avoid V8 OOM on constrained Windows setups).
      config.parallelism = 1;
    }
    return config;
  },
};

export default nextConfig;
