# Relay del mando móvil en Cloudflare (modo online)

El mando tiene DOS modos con el MISMO protocolo (`/events`, `/send`,
`/control`, `/qr`, `/lan`):

- **LAN (el de siempre):** `tools/relay.cjs` sirve el juego y el bus en la
  misma Wi-Fi, mismo origen. No se toca.
- **Online (este directorio):** un **Worker independiente** de Cloudflare
  con un Durable Object por sala, en su propio origen:
  `https://1mtp-relay.dreamerofel3ctricsheeps.workers.dev`.
  El juego (servido por Pages) lo consume con CORS; la página del mando
  vive en el origen del Worker, así que para el teléfono todo es local.

Por qué un Worker aparte y no una función del proyecto de Pages: la API de
subida directa de Pages ignora las migraciones de Durable Objects del
bundle (la clase nunca se registra y publicar la función falla siempre
con el mismo error). En la subida de Workers la clase y su migración van
en la metadata de la misma llamada y se registran sin problema.

## Piezas

- `relay-worker.js` — el Worker vigente: enruta `/events` y `/send` al
  Durable Object `RelayRoom`, sirve `/control`, `/qr` y `/lan`, y abre
  CORS para que el juego lo consuma desde su origen.
- `qrcode.js` — generador de QR de Kazuhiko Arase (licencia MIT, cabecera
  incluida en el archivo). Al desplegar se concatena ANTES de
  `relay-worker.js` (la librería define el global `qrcode`).
- `_worker.js` — primera versión, pensada como worker avanzado de Pages.
  QUEDÓ DESCARTADA por el límite de arriba; se conserva como referencia.
- La página del mando es `tools/control.html`: al desplegar el Worker se
  sube como módulo de texto `control.html` (lo importa `relay-worker.js`).
- Cliente (`application/src/js/remote-pad.js`): en https usa como base el
  origen del Worker (`RELAY`); en http usa rutas relativas (LAN). El
  código de sala es de 8 caracteres: en internet la sala es la única llave
  del mando.

## Cómo se despliega el Worker (subida por API)

Con el helper del conector custom.cloudflare (el token necesita el
permiso Workers Scripts Edit, además de los de Pages):

```
cat cloudflare/qrcode.js cloudflare/relay-worker.js > /tmp/relay-bundle.mjs
cf.py worker-deploy --account <ACCOUNT_ID> --script 1mtp-relay \
  --main /tmp/relay-bundle.mjs \
  --module control.html=tools/control.html \
  --do-binding RELAY_ROOM=RelayRoom --do-new-class RelayRoom
```

`--do-new-class` solo hace falta la primera vez que se crea la clase; en
redespliegues se puede omitir. El comando también activa la ruta
`*.workers.dev` del script.

## El juego en Pages queda estático

El proyecto de Pages `1minutoparalafiesta` se despliega como sitio
estático puro (`cf.py deploy` sobre `dist/`), sin `_worker.js`: el relay
ya no viaja con el sitio y un redespliegue del juego no lo puede romper.
En el proyecto quedó configurado un binding `RELAY_ROOM` en
`deployment_configs` de la época de las pruebas con funciones; es inerte
mientras ningún despliegue lleve worker, y conviene quitarlo si algún
día se vuelve a experimentar con funciones de Pages.
