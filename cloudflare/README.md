# Relay del mando móvil en Cloudflare (modo online)

El mando tiene DOS modos y el cliente no distingue: usa rutas relativas al
mismo origen (`/events`, `/send`, `/control`, `/qr`, `/lan`).

- **LAN (el de siempre):** `tools/relay.cjs` sirve el juego y el bus en la
  misma Wi-Fi. No se toca.
- **Online (este directorio):** el mismo protocolo servido por el proyecto de
  Cloudflare Pages `1minutoparalafiesta`, con un Durable Object por sala.

## Piezas

- `_worker.js` — el relay: worker de Pages en modo avanzado. Enruta el bus
  al Durable Object `RelayRoom` y deja pasar todo lo demás a los assets
  estáticos del juego (`env.ASSETS`).
- `qrcode.js` — generador de QR de Kazuhiko Arase (licencia MIT, cabecera
  incluida en el archivo). Al desplegar se concatena ANTES de `_worker.js`.
- La página del mando es `tools/control.html`: al desplegar se copia como
  `control.html` en la raíz del build.

## Requisitos en el proyecto de Pages

- La cuenta de Cloudflare debe tener creado su subdominio `workers.dev`
  (paso único: abrir el menú Workers en el panel lo crea automáticamente).
  Sin él, todo despliegue con worker falla al publicar la función.
- Binding de Durable Object `RELAY_ROOM` → clase `RelayRoom`, configurado en
  `deployment_configs` (producción y preview) del proyecto. Sin el binding,
  `/events` y `/send` responden 503 y el resto del sitio funciona igual.
- Ajuste del cliente ya aplicado en esta rama (`remote-pad.js`): en https la
  URL del mando se arma con `location.origin` (en LAN se sigue usando la IP
  de `/lan`) y el código de sala pasó de 4 a 8 caracteres, porque en
  internet la sala es la única llave del mando.

## Cómo se despliega (subida directa por API)

1. `npm run build`
2. Armar la carpeta de despliegue: el contenido de `dist/`, más
   `control.html` (copia de `tools/control.html`) y `_worker.js`
   (concatenación de `cloudflare/qrcode.js` + `cloudflare/_worker.js`).
3. Subir con el helper del conector custom.cloudflare (`cf.py deploy`).

⚠️ Todo redespliegue del sitio debe repetir el paso 2: si se sube solo
`dist/`, el relay online desaparece en silencio (el juego sigue andando).
Si esta rama se fusiona a la v4.1, el ajuste de `remote-pad.js` viaja con
ella; el worker sigue viviendo en este directorio.
