import { defineConfig } from 'vite';
import { resolve } from 'node:path';
const r = (p) => resolve(import.meta.dirname, p);
// Juego runtime en application/src. En DEV, Vite sirve assets/ desde la raíz.
// En BUILD, `npm run build` copia assets/{icons,audio,date,img} a dist/ con
// tools/copy-runtime-assets.cjs (el arte fuente sprites/new-sprites queda fuera).
export default defineConfig({
  root: r('application/src'),
  publicDir: false,
  base: '/',
  resolve: { alias: { '@': r('application/src') } },
  build: { outDir: r('dist'), emptyOutDir: true, target: 'es2020' },
  server: { host: true, port: 5173 },
});
