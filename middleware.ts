export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/knowledge/:path*',
    '/api/knowledge/:path*',
    '/api/organizations/:path*',
  ],
};
