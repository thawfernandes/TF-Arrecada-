import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Para GitHub Pages: VITE_BASE_PATH=/TF-Arrecada-/ (configurado no workflow)
// Para produção própria: sem base (usa '/')
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
