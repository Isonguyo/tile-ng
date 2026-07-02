// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force Nitro on with the Vercel preset so `npm run build` (outside the
  // Lovable sandbox, e.g. on Vercel CI) produces a Vercel-compatible
  // SSR bundle: static assets and an SSR function under `.vercel/output/`.
  // Without this override the package defaults to Cloudflare and Vercel gets
  // a `dist/server/server.js` it doesn't know how to serve, producing 404s.
  nitro: {
    preset: "vercel",
  },
});
