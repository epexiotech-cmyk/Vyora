import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // DB path is only needed for drizzle-kit operations like studio or generate if doing introspect,
  // but generate doesn't strictly need a live DB. For push/studio, you'd configure a URL.
  // We'll leave it empty for generate, and rely on standard paths if using studio.
});
