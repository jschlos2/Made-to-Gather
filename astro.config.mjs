import { defineConfig } from 'astro/config';

export default defineConfig({
  // Cloudflare Pages serves the generated files directly from dist/.
  output: 'static',
});
