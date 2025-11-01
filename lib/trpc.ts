/**
 * tRPC Client Setup
 *
 * This creates the tRPC client for use in React components
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../routers';

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();
