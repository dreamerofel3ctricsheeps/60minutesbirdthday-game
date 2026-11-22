#!/usr/bin/env python3
"""Genera los sprites de «La soga de fuego» y application/src/js/jump-sheets.js.

Contenido (todo GENERADO con la herramienta de imágenes el
2026-11-21, a pedido expreso de Jose, porque las hojas definidas no
traen pose de salto ni calaveritas de utilería):

- salto-<id>.png de los 7 roomies: pose de salto de soga en el aire
  (rodillas flexionadas, brazos en guardia, estilo sticker del
  juego), generada desde el idle frontal definido de cada roomie
  como referencia de identidad y verificada en persona contra su
  diseño (pelo, ropa, rasgos).
- calaverita-clasica.png y calaverita-morada.png: las calaveritas
  utileras que coronan los postes de la soga (en el código eran la
  figura dibujada por código calCv: calavera de azúcar con cuerpito
  y brazos en alto sobre una base). Dos variantes de color.

Las fuentes crudas generadas (sobre fondo magenta liso) viven en
~/workspace/goals/1-minuto-para-la-fiesta/files/diseno-leyendas/
generados-soga/*-generada-v1.png. Este script las pasa a alfa real
(flood-fill del fondo desde los bordes + componente mayor, el mismo
proceso que tools/mkteodora.py), normaliza el alto a 440 px, guarda
los PNG en application/src/assets/img/ y los incrusta como data
URIs en G.JUMP_DATA.

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen
de origen file:// como cross-origin al subirla a WebGL: texImage2D
lanza SecurityError (bug del "contador 4", 2026-11-21). Las data
URIs no tienen origen: son seguras en WebGL desde cualquier esquema.

Uso:  python3 tools/mkjumps.py
"""
import base64
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "jump-sheets.js"
SRC_DIR = (ROOT.parent.parent / "goals" / "1-minuto-para-la-fiesta" / "files"
           / "diseno-leyendas" / "generados-soga")

BG_TOL = 46  # el magenta generado no es perfectamente uniforme

# (nombre destino, archivo fuente generado)
CUTS = [
    ("salto-natalia", "salto-natalia-generada-v1.png"),
    ("salto-saulo", "salto-saulo-generada-v1.png"),
    ("salto-itzel", "salto-itzel-generada-v1.png"),
    ("salto-fatima", "salto-fatima-generada-v1.png"),
    ("salto-samantha", "salto-samantha-generada-v1.png"),
    ("salto-majo", "salto-majo-generada-v1.png"),
    ("salto-alan", "salto-alan-generada-v1.png"),
    ("calaverita-clasica", "calaverita-clasica-generada-v1.png"),
    ("calaverita-morada", "calaverita-morada-generada-v1.png"),
]
NAMES = [n for n, _s in CUTS]


def extract(src: pathlib.Path) -> Image.Image:
    """De la generación sobre magenta a la figura con alfa real:
    flood-fill del fondo desde los bordes y solo el componente
    opaco mayor (los colores magenta DENTRO de la figura — la
    sudadera de Samantha, las zapatillas de Natalia — quedan a
    salvo tras su borde blanco de sticker)."""
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.int32)
    corners = np.concatenate([
        arr[:12, :12].reshape(-1, 3), arr[:12, -12:].reshape(-1, 3),
        arr[-12:, :12].reshape(-1, 3), arr[-12:, -12:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    dist = np.abs(arr - bg).max(axis=-1)
    candidate = dist < BG_TOL
    lab, _n = ndimage.label(candidate)
    border_labels = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    is_bg = np.isin(lab, list(border_labels))
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    lab2, _n2 = ndimage.label(alpha > 0)
    if lab2.max() > 0:
        sizes = ndimage.sum(alpha > 0, lab2, range(1, lab2.max() + 1))
        keep = 1 + int(np.argmax(sizes))
        alpha = np.where(lab2 == keep, alpha, 0).astype(np.uint8)
    out = np.dstack([arr.astype(np.uint8), alpha])
    img = Image.fromarray(out, "RGBA")
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit(f"ERROR: recorte vacío en {src}")
    img = img.crop(bbox)
    w, h = img.size
    img = img.resize((round(w * 440 / h), 440), Image.LANCZOS)
    return img


def main() -> None:
    for name, src_name in CUTS:
        src = SRC_DIR / src_name
        if not src.exists():
            raise SystemExit(f"ERROR: no está la fuente generada {src}")
        img = extract(src)
        dest = IMG_DIR / f"{name}.png"
        img.save(dest)
        opaque = int((np.asarray(img)[..., 3] > 8).sum())
        print(f"{name:20s} ← {src_name}: {img.size[0]}×{img.size[1]}, {opaque} px opacos")
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        entries.append(f'    "{name}": "data:image/png;base64,{b64}"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkjumps.py — NO editar a mano.\n"
        "   Sprites de «La soga de fuego» (final de Leyendas, 2B): los\n"
        "   7 saltos de soga de los roomies y las 2 calaveritas\n"
        "   utileras de los postes, como data URIs (G.JUMP_DATA).\n"
        "   Todos GENERADOS desde las referencias de diseño (los\n"
        "   saltos, desde el idle definido de cada roomie) y con sus\n"
        "   fuentes archivadas en files/diseno-leyendas/\n"
        "   generados-soga/ (regenerar: python3 tools/mkjumps.py).\n"
        "   Data URIs a propósito: una imagen cargada desde file://\n"
        "   es cross-origin para WebGL y texImage2D revienta con\n"
        "   ella (bug del contador 4 en «Anillos de J1407b»,\n"
        "   2026-11-21); las data URIs no tienen origen y son\n"
        "   seguras siempre. */\n"
        "(function (root) {\n"
        '  "use strict";\n'
        "  const G = (root.G = root.G || {});\n"
        "  G.JUMP_DATA = {\n"
        f"{body}\n"
        "  };\n"
        '})(typeof window !== "undefined" ? window : globalThis);\n'
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes, {len(NAMES)} imágenes)")


if __name__ == "__main__":
    main()
