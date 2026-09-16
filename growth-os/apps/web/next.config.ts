import type { NextConfig } from 'next';

const securityHeaders=[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  {key:'X-DNS-Prefetch-Control',value:'off'}
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers(){
    return [{source:'/:path*',headers:securityHeaders}];
  }
};

export default nextConfig;
