/* Copia los assets de runtime a dist/ tras `vite build`.
   Vite no empaqueta los assets referenciados por string (no importados);
   el arte fuente (sprites, new-sprites) se excluye a propósito. */
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'application', 'src', 'assets');
const DST = path.join(__dirname, '..', 'dist', 'assets');
for (const d of ['icons', 'audio', 'date', 'img']) {
  fs.cpSync(path.join(SRC, d), path.join(DST, d), { recursive: true });
  console.log('copiado assets/' + d);
}
