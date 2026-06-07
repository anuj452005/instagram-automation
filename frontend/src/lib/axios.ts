import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ClerkWindow {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>;
    };
  };
}

api.interceptors.request.use(async (config) => {
  const clerkWindow = window as unknown as ClerkWindow;
  if (typeof window !== 'undefined' && clerkWindow.Clerk) {
    try {
      const token = await clerkWindow.Clerk.session?.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching Clerk auth token for request interceptor:', error);
    }
  }
  return config;
});

