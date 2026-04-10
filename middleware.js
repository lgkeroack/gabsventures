import { rewrite, next } from '@vercel/functions';

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname === 'apps.gabs.ventures') {
    return rewrite(new URL('/apps' + url.pathname + url.search, request.url));
  }

  return next();
}

export const config = {
  matcher: '/(.*)',
};
