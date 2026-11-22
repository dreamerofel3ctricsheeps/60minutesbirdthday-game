#!/usr/bin/env python3
"""Genera application/src/js/belt-sheets.js desde los PNG del cinturón.

Los 10 PNG con alfa viven en application/src/assets/img/ (la fuente de
diseño aprobada por Jose): los 9 sprites flotantes con traje espacial
integrado de «Cinturón de asteroides» (espacio-<id>.png) y la meta
diseñada (meta-cinturon.png). Este script los incrusta como data URIs
en G.BELT_DATA, en el mismo estilo que rocket-sheets.js (mkrockets.py).

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen de
origen file:// como cross-origin al subirla a WebGL: texImage2D lanza
SecurityError (bug del "contador 4", 2026-11-21). Las data URIs no
tienen origen: son seguras en WebGL desde cualquier esquema.

Uso:  python3 tools/mkbelt.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "belt-sheets.js"

NAMES = [
    "espacio-natalia",
    "espacio-saulo",
    "espacio-itzel",
    "espacio-fatima",
    "espacio-samantha",
    "espacio-majo",
    "espacio-alan",
    "espacio-jose",
    "espacio-pollito",
    "meta-cinturon",
]

def main() -> None:
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        entries.append(f'    "{name}": "data:image/png;base64,{b64}"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkbelt.py — NO editar a mano.\n"
        "   Sprites con traje espacial y meta de «Cinturón de\n"
        "   asteroides» (final J1407b, 1B) como data URIs (G.BELT_DATA).\n"
        "   Fuente de diseño: application/src/assets/img/espacio-*.png\n"
        "   y meta-cinturon.png (regenerar con: python3 tools/mkbelt.py).\n"
        "   Data URIs a propósito: una imagen cargada desde file:// es\n"
        "   cross-origin para WebGL y texImage2D revienta con ella\n"
        "   (bug del contador 4 en «Anillos de J1407b», 2026-11-21);\n"
        "   las data URIs no tienen origen y son seguras siempre. */\n"
        "(function (root) {\n"
        '  "use strict";\n'
        "  const G = (root.G = root.G || {});\n"
        "  G.BELT_DATA = {\n"
        f"{body}\n"
        "  };\n"
        '})(typeof window !== "undefined" ? window : globalThis);\n'
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes, {len(NAMES)} imágenes)")

if __name__ == "__main__":
    main()
