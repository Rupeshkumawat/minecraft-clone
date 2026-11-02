import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Only use the subpath when building for GitHub Pages
  base: command === 'build' ? '/aaa-minecraft-clone/' : '/',
}));
