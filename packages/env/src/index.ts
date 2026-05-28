import { z } from 'zod';

/**
 * ServerEnvSchema defines environment variables that MUST NEVER
 * be exposed to the Electron Renderer or Next.js Client.
 *
 * Examples: Database URLs, Secret Keys, Third-Party API Tokens.
 */
export const ServerEnvSchema = z.object({
  // Add server-only environment variables here
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // DATABASE_URL: z.string().url().optional(),
});

/**
 * ClientEnvSchema defines configuration safe for exposure to the
 * Renderer process or the Browser.
 *
 * Examples: Public API endpoints, Analytics keys.
 */
export const ClientEnvSchema = z.object({
  // Add client-safe environment variables here
  // NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;

/**
 * Note: Actual runtime parsing (e.g. `ServerEnvSchema.parse(process.env)`)
 * should be done at the entry point of the respective process (Main/Renderer)
 * to prevent accidental process.env leakage during bundling.
 */
