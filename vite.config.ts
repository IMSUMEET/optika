import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When deploying to GitHub Pages at /optika/ the base needs to match the repo name.
// Set VITE_BASE env var to override (e.g. '/' for Vercel/Netlify root deploys).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? '/optika/',
})
