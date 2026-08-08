import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 開発環境で別ホストから HMR 等へアクセスする場合、許可するオリジンを指定します
  // 例: allowedDevOrigins: ['10.1.35.247']
  allowedDevOrigins: ['10.1.35.247', '127.0.0.1'],
  async rewrites() {
    const apiInternalUrl =
      process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
