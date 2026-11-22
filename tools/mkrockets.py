#!/usr/bin/env python3
"""Genera application/src/js/rocket-sheets.js desde los PNG de cohetes.

Los 6 PNG con alfa viven en application/src/assets/img/ (la fuente de
diseño aprobada por Jose). Este script los incrusta como data URIs en
G.ROCKET_DATA, en el mismo estilo que defined-sheets.js (mkdefined.py).

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen de
origen file:// como cross-origin al subirla a WebGL: texImage2D lanza
SecurityError. Como el bucle frame() de game.js llamaba a draw() antes
de agendar el siguiente requestAnimationFrame, esa excepción mataba el
bucle y «Anillos de J1407b» quedaba congelado en el contador inicial
(el bug del "contador 4", 2026-11-21). Las data URIs no tienen origen:
son seguras en WebGL desde cualquier esquema. Por eso TODO el arte del
juego (hojas definidas incluidas) viaja como data URI.

Uso:  python3 tools/mkrockets.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "rocket-sheets.js"

NAMES = [
    "cohete-party-back",
    "cohete-rival-back",
    "cohete-party-side",
    "cohete-party-side-averiado",
    "cohete-rival-side",
    "cohete-rival-side-averiado",
]

def main() -> None:
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        entries.append(f'    "{name}": "data:image/png;base64,{b64}"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkrockets.py — NO editar a mano.\n"
        "   Cohetes del final J1407b como data URIs (G.ROCKET_DATA).\n"
        "   Fuente de diseño: application/src/assets/img/cohete-*.png\n"
        "   (regenerar con: python3 tools/mkrockets.py).\n"
        "   Data URIs a propósito: una imagen cargada desde file:// es\n"
        "   cross-origin para WebGL y texImage2D revienta con ella\n"
        "   (bug del contador 4 en «Anillos de J1407b», 2026-11-21);\n"
        "   las data URIs no tienen origen y son seguras siempre. */\n"
        "(function (root) {\n"
        '  "use strict";\n'
        "  const G = (root.G = root.G || {});\n"
        "  G.ROCKET_DATA = {\n"
        f"{body}\n"
        "  };\n"
        '})(typeof window !== "undefined" ? window : globalThis);\n'
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes, {len(NAMES)} cohetes)")

if __name__ == "__main__":
    main()
