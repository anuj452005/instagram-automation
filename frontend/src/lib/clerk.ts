const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key (VITE_CLERK_PUBLISHABLE_KEY) in environment variables.');
}

export const CLERK_PUBLISHABLE_KEY = publishableKey;
