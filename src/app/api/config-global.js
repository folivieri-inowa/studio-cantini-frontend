import { paths } from 'src/routes/paths';

// API
// ----------------------------------------------------------------------

export const HOST_API = process.env.NEXT_PUBLIC_HOST_API;
// BACKEND_API_INTERNAL is used server-side (API Routes) to call backend within cluster
// BACKEND_API is used client-side (browser) to call backend
const backendApiFromEnv = process.env.BACKEND_API_INTERNAL || process.env.NEXT_PUBLIC_HOST_BACKEND;

export const BACKEND_API_INTERNAL = (backendApiFromEnv || 'http://localhost:9000').replace(/\/$/, '');
export const BACKEND_API = (process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000').replace(/\/$/, '');
export const ASSETS_API = process.env.NEXT_PUBLIC_ASSETS_API;

export const AMPLIFY_API = {
  userPoolId: process.env.NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_ID,
  userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID,
  region: process.env.NEXT_PUBLIC_AWS_AMPLIFY_REGION,
};

export const AUTH0_API = {
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  callbackUrl: process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL,
};

export const MAPBOX_API = process.env.NEXT_PUBLIC_MAPBOX_API;

// ROOT PATH AFTER LOGIN SUCCESSFUL
export const PATH_AFTER_LOGIN = paths.dashboard.root; // as '/dashboard'
