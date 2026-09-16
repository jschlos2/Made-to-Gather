import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://made-to-gather.pages.dev',
  // Cloudflare Pages serves the generated files directly from dist/.
  output: 'static',
});
