import { defineConfig } from 'vite'

// Pinned to 5177 to match the Supabase project's Site URL configuration.
// If you change this, also update Authentication → URL Configuration → Site URL
// in the Supabase Dashboard, otherwise password-reset and auth redirects will fail.
export default defineConfig({
  server: {
    port: 5177,
    strictPort: true,
  },
})
