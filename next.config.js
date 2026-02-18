/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "ui-avatars.com" }
    ]
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/sign-in',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/sign-in',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/auth/sign-in',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/sign-up',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/sign-up',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ]
  },
};

module.exports = nextConfig;
