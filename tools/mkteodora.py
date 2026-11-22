#!/usr/bin/env python3
"""Extrae los sprites de Teodora de sus hojas de diseño y los incrusta
como data URIs en application/src/js/teodora-sheets.js (G.TEODORA_DATA).

Dos etapas:

1. EXTRACCIÓN (solo si las hojas están en su sitio de diseño): las
   poses que «El set se hunde / Traza la leyenda» necesita se recortan
   de las hojas aprobadas del personaje (ver el mapa de sprites,
   files/diseno-leyendas/mapa-sprites-teodora-alebrije-v1.md):

     teodora-idle       ← teo_float_idle  (expresiones-flotación v1)
     teodora-trazo      ← teo_trazo       (poses boss v1)
     teodora-selfie     ← teo_selfie      (poses boss v1)
     teodora-dash       ← teo_dash        (sprites faltantes v1)
     teodora-sorprendida← teo_sorprendida (sprites faltantes v1)
     teodora-derrotada  ← teo_derrotada   (sprites faltantes v1)

   Las hojas vienen sobre fondo crema uniforme: se inunda el fondo
   desde los bordes (flood-fill por tolerancia de color), se conserva
   solo el componente opaco mayor (fuera sombras del suelo, manchas
   de movimiento y brillos sueltos) y se recorta al alfa real.
   Identidad que NO se negocia: pelo cobrizo, sombrero rosa con
   banda a cuadros y moño lila en SU lado izquierdo — NUNCA se espeja
   ningún recorte —, pecas, vestido en capas morado/rosa, medias a
   rayas moradas y botas magenta. Las expresiones con el defecto ya
   marcado en el mapa (sarcástica y enojada, con el moño espejado)
   NO se extraen.
   Los PNG resultantes (alto normalizado a 440 px) quedan en
   application/src/assets/img/teodora-<pose>.png.

2. INCRUSTADO: los PNG se incrustan como data URIs en
   G.TEODORA_DATA, en el mismo estilo que alebrije-sheets.js.

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen de
origen file:// como cross-origin al subirla a WebGL: texImage2D lanza
SecurityError (bug del "contador 4", 2026-11-21). Las data URIs no
tienen origen: son seguras en WebGL desde cualquier esquema.

Uso:  python3 tools/mkteodora.py
"""
import base64
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "teodora-sheets.js"
DESIGN_DIR = pathlib.Path.home() / "workspace" / "goals" / "1-minuto-para-la-fiesta" / "files" / "diseno-teodora"

# (pose, hoja, celda x0,y0,x1,y1 en píxeles de la hoja, ¿sombra de
# contacto pegada bajo los pies? — la hoja de expresiones dibuja una
# elipse de sombra bajo cada figura y en el idle frontal queda
# CONECTADA a las puntas de las botas: hay que seccionarla, porque
# Teodora flota y su sombra la pone el motor, no el sprite)
CUTS = [
    ("idle", "teodora-expresiones-flotacion-v1.webp", (4, 4, 476, 636), True),
    ("selfie", "teodora-poses-boss-v1.webp", (1330, 0, 2090, 912), False),
    ("trazo", "teodora-poses-boss-v1.webp", (2010, 0, 2736, 912), False),
    ("dash", "teodora-sprites-faltantes-v1.webp", (998, 0, 1482, 992), False),
    ("sorprendida", "teodora-sprites-faltantes-v1.webp", (1990, 0, 2474, 992), False),
    ("derrotada", "teodora-sprites-faltantes-v1.webp", (6, 0, 490, 992), False),
]
NAMES = [f"teodora-{pose}" for pose, _sheet, _cell, _sh in CUTS]
TARGET_H = 440
BG_TOL = 30  # tolerancia de color para considerar un píxel «fondo»


def cut_contact_shadow(img: Image.Image) -> Image.Image:
    """Secciona la elipse de sombra de contacto pegada bajo las botas:
    es el tramo final de filas ANCHAS (la elipse mide ~0,69 del ancho
    total; las dos botas juntas, ~0,35) que empieza pasados el 85% del
    alto. Medido sobre el recorte real antes de fijar la regla."""
    a = np.asarray(img)[..., 3] > 8
    h, w = a.shape
    widths = np.array([(lambda xs: (xs.max() - xs.min() + 1) if len(xs) else 0)(np.where(a[y])[0]) for y in range(h)])
    start = None
    for y in range(h - 1, int(h * 0.85), -1):
        if widths[y] > 0.38 * w:
            start = y
        else:
            break
    if start is not None and start < h - 4:
        img = img.crop((0, 0, w, start))
    return img


def extract(sheet_path: pathlib.Path, cell: tuple, shadow: bool = False) -> Image.Image:
    """Recorta una figura de su hoja y la deja con alfa real."""
    im = Image.open(sheet_path).convert("RGB").crop(cell)
    arr = np.asarray(im).astype(np.int32)
    # Color de fondo: mediana de las esquinas de la celda.
    corners = np.concatenate([
        arr[:12, :12].reshape(-1, 3), arr[:12, -12:].reshape(-1, 3),
        arr[-12:, :12].reshape(-1, 3), arr[-12:, -12:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    dist = np.abs(arr - bg).max(axis=-1)
    candidate = dist < BG_TOL
    # Fondo REAL = candidato conectado con el borde de la celda.
    lab, _n = ndimage.label(candidate)
    border_labels = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    is_bg = np.isin(lab, list(border_labels))
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    # Solo el componente opaco mayor (la figura): fuera la sombra del
    # suelo, las manchas de movimiento del dash y brillos sueltos.
    lab2, _n2 = ndimage.label(alpha > 0)
    if lab2.max() > 0:
        sizes = ndimage.sum(alpha > 0, lab2, range(1, lab2.max() + 1))
        keep = 1 + int(np.argmax(sizes))
        alpha = np.where(lab2 == keep, alpha, 0).astype(np.uint8)
    out = np.dstack([arr.astype(np.uint8), alpha])
    img = Image.fromarray(out, "RGBA")
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit(f"ERROR: recorte vacío en {sheet_path} {cell}")
    img = img.crop(bbox)
    # Alto normalizado, como el resto de sprites diseñados del proyecto.
    w, h = img.size
    img = img.resize((round(w * TARGET_H / h), TARGET_H), Image.LANCZOS)
    if shadow:
        img = cut_contact_shadow(img)
    return img


def build_pngs() -> None:
    for pose, sheet, cell, shadow in CUTS:
        src = DESIGN_DIR / sheet
        if not src.exists():
            print(f"AVISO: no está la hoja {src}; se conserva el PNG existente de {pose}")
            continue
        img = extract(src, cell, shadow)
        dest = IMG_DIR / f"teodora-{pose}.png"
        img.save(dest)
        opaque = int((np.asarray(img)[..., 3] > 8).sum())
        print(f"teodora-{pose:12s} ← {sheet} {cell}: {img.size[0]}×{img.size[1]}, {opaque} px opacos")


def main() -> None:
    build_pngs()
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        entries.append(f'    "{name}": "data:image/png;base64,{b64}"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkteodora.py — NO editar a mano.\n"
        "   Teodora en «El set se hunde / Traza la leyenda» (final\n"
        "   Leyendas) como data URIs (G.TEODORA_DATA): sus sprites\n"
        "   diseñados (idle flotando, trazo, selfie, dash, sorprendida,\n"
        "   derrotada) recortados de las hojas aprobadas del personaje.\n"
        "   Fuente de diseño: application/src/assets/img/teodora-*.png\n"
        "   (regenerar con: python3 tools/mkteodora.py).\n"
        "   Data URIs a propósito: una imagen cargada desde file:// es\n"
        "   cross-origin para WebGL y texImage2D revienta con ella\n"
        "   (bug del contador 4 en «Anillos de J1407b», 2026-11-21);\n"
        "   las data URIs no tienen origen y son seguras siempre. */\n"
        "(function (root) {\n"
        '  "use strict";\n'
        "  const G = (root.G = root.G || {});\n"
        "  G.TEODORA_DATA = {\n"
        f"{body}\n"
        "  };\n"
        '})(typeof window !== "undefined" ? window : globalThis);\n'
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes, {len(NAMES)} imágenes)")


if __name__ == "__main__":
    main()
