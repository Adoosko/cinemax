import { auth } from '@/lib/auth';

// Better Auth returns a single handler function for all HTTP methods
const handler = auth.handler;

export { handler as GET, handler as POST };
