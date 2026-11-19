import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  // Toutes les requêtes /api/* sont relayées vers l'API Express :
  // le navigateur reste sur la même origine, le cookie de session httpOnly suit naturellement.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
