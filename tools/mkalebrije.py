#!/usr/bin/env python3
"""Genera application/src/js/alebrije-sheets.js desde los PNG del Alebrije.

Los 7 PNG con alfa viven en application/src/assets/img/: la base
(alebrije-frente.png, derivada del master de Jose
alebrije_frente_jose.png SIN repintar: solo reescalada) y las 6
variantes de resplandor por zona de «El patrón del Alebrije»
(alebrije-zona-<zona>.png), procesadas con PIL desde ese master:
dentro de la máscara de cada zona, brillo + tinte blanco-dorado con
halo en el borde; fuera de la máscara, ni un píxel cambia
(verificado por diff en el script de procesado). Este script los
incrusta como data URIs en G.ALEBRIJE_DATA, en el mismo estilo que
rocket-sheets.js (mkrockets.py) y belt-sheets.js (mkbelt.py).

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen de
origen file:// como cross-origin al subirla a WebGL: texImage2D lanza
SecurityError (bug del "contador 4", 2026-11-21). Las data URIs no
tienen origen: son seguras en WebGL desde cualquier esquema.

Uso:  python3 tools/mkalebrije.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "alebrije-sheets.js"

NAMES = [
    "alebrije-frente",
    "alebrije-zona-cabeza",
    "alebrije-zona-crines",
    "alebrije-zona-antenas",
    "alebrije-zona-aleta",
    "alebrije-zona-panza",
    "alebrije-zona-cola",
]

def main() -> None:
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        entries.append(f'    "{name}": "data:image/png;base64,{b64}"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkalebrije.py — NO editar a mano.\n"
        "   El Alebrije de «El patrón del Alebrije» (final Leyendas)\n"
        "   como data URIs (G.ALEBRIJE_DATA): base + 6 zonas de\n"
        "   resplandor derivadas del master de Jose procesando la\n"
        "   imagen (fuera de cada máscara, ni un píxel cambia).\n"
        "   Fuente de diseño: application/src/assets/img/alebrije-*.png\n"
        "   (regenerar con: python3 tools/mkalebrije.py).\n"
        "   Data URIs a propósito: una imagen cargada desde file:// es\n"
        "   cross-origin para WebGL y texImage2D revienta con ella\n"
        "   (bug del contador 4 en «Anillos de J1407b», 2026-11-21);\n"
        "   las data URIs no tienen origen y son seguras siempre. */\n"
        "(function (root) {\n"
        '  "use strict";\n'
        "  const G = (root.G = root.G || {});\n"
        "  G.ALEBRIJE_DATA = {\n"
        f"{body}\n"
        "  };\n"
        '})(typeof window !== "undefined" ? window : globalThis);\n'
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes, {len(NAMES)} imágenes)")

if __name__ == "__main__":
    main()
