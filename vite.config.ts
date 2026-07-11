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
  
  // Dynamically switch presets:
  // If Vercel is building the app, compile for Vercel. 
  // Otherwise, leave it false so Lovable defaults to Cloudflare in its sandbox.
  nitro: process.env.VERCEL ? { preset: "vercel" } : false,

  // Force Vite to bundle Supabase and its sub-modules directly into the SSR chunk
  // This prevents the "Cannot find package 'tslib'" error on Vercel
  vite: {
    ssr: {
      noExternal: [
        "@supabase/supabase-js",
        "@supabase/functions-js",
        "tslib"
      ],
    },
  },
});
