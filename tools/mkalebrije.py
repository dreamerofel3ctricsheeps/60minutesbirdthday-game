#!/usr/bin/env python3
"""Genera las variantes de resplandor del Alebrije y las incrusta como
data URIs en application/src/js/alebrije-sheets.js (G.ALEBRIJE_DATA).

Dos etapas:

1. VARIANTES POR ZONA (corrección de Jose, 2026-11-21, 2ª ronda): el
   brillo blanco-dorado de la 1ª ronda era casi invisible sobre los
   colores ya brillantes del sprite (cabeza amarilla, crines naranjas)
   y las zonas pequeñas (aleta, antenas) ni se leían. Ahora cada zona
   se alumbra con un COLOR VIVO complementario de su color base, para
   que el contraste sea inmediato:

     cabeza  #ff4fd8 magenta     (base: amarillo/naranja)
     crines  #22d3ee cyan        (base: rojo/naranja)
     antenas #ff5252 rojo vivo   (base: verde)
     aleta   #4f8dff azul        (base: amarillo)
     panza   #7dff57 verde lima  (base: magenta)
     cola    #ffb020 ámbar       (base: morado a bandas)

   Método (desde alebrije-frente.png, derivada del master de Jose
   alebrije_frente_jose.png SIN repintar: solo reescalada):
   · máscara de la zona = forma (elipse/región según ALB_ZONES de
     scenes.js) ∩ puerta de color HSV ∩ píxel opaco;
   · dentro de la máscara, se SUSTITUYEN el tono y la saturación del
     píxel por los del color de la zona, conservando su valor con un
     empujón de brillo: el sombreado del dibujo se sigue leyendo,
     pero en el color nuevo y vivo. (Mezclar en RGB hacia el color
     complementario dejaba marrones sucios — p. ej. antenas verdes +
     rojo —; por eso se trabaja en HSV.);
   · HALO del mismo color SOLO sobre píxeles transparentes del base
     alrededor de la zona (máscara dilatada y difuminada), para que
     las zonas pequeñas se lean de lejos.
   Verificación automática: los píxeles OPACOS fuera de la máscara
   cambian en exactamente 0 (el script aborta si no).

2. INCRUSTADO: los 7 PNG (base + 6 zonas) se incrustan como data URIs
   en G.ALEBRIJE_DATA, en el mismo estilo que rocket-sheets.js
   (mkrockets.py) y belt-sheets.js (mkbelt.py).

POR QUÉ data URIs y NO rutas de archivo: el juego se corre también
desde file:// (la copia local de Jose) y Chrome marca toda imagen de
origen file:// como cross-origin al subirla a WebGL: texImage2D lanza
SecurityError (bug del "contador 4", 2026-11-21). Las data URIs no
tienen origen: son seguras en WebGL desde cualquier esquema.

Uso:  python3 tools/mkalebrije.py
"""
import base64
import colorsys
import pathlib

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "alebrije-sheets.js"
BASE = "alebrije-frente"

# Color vivo de resplandor por zona (ver justificación arriba). El
# duelo usa la MISMA paleta para el nombre de la zona en pantalla
# (ALB_ZONE_COLORS en scenes.js): mantener ambas en sincronía.
ZONE_COLORS = {
    "cabeza": (0xFF, 0x4F, 0xD8),
    "crines": (0x22, 0xD3, 0xEE),
    "antenas": (0xFF, 0x52, 0x52),
    "aleta": (0x4F, 0x8D, 0xFF),
    "panza": (0x7D, 0xFF, 0x57),
    "cola": (0xFF, 0xB0, 0x20),
}
VALUE_BOOST = 1.12  # empujón de brillo (valor HSV) dentro de la máscara
HALO_ALPHA = 0.50   # fuerza del halo sobre la transparencia


def zone_masks(rgb: np.ndarray, hsv: np.ndarray, alpha: np.ndarray) -> dict:
    """Máscara por zona = forma ∩ color HSV ∩ opaco.

    Las formas salen de la anatomía real del sprite (centros de
    ALB_ZONES en scenes.js, fracciones del rectángulo 324×440) y las
    puertas de color, de muestrear el propio PNG: cabeza/hocico
    amarillo-naranja (tono ~35–55), crines rojo/naranja, antenas
    verdes, aleta amarilla tras el cuerpo, panza magenta (~312),
    cola morada/magenta a bandas, cuerpo azul-violeta (~239, el que
    hay que EXCLUIR de panza y cola).
    """
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    fx, fy = xx / w, yy / h
    hh = hsv[..., 0].astype(np.float32) * (360.0 / 255.0)
    ss = hsv[..., 1].astype(np.float32) / 255.0
    vv = hsv[..., 2].astype(np.float32) / 255.0
    opaque = alpha >= 128

    def ellipse(cx, cy, rx, ry):
        return ((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2 <= 1.0

    return {
        # Verde de las antenas, solo en la franja alta (las patas y los
        # brazos también son verdes, pero quedan fuera por la forma).
        "antenas": (fy < 0.17) & (hh >= 85) & (hh <= 175) & (ss > 0.30) & (vv > 0.18) & opaque,
        # Amarillo/naranja de la cabeza y el hocico dentro de su
        # elipse; los ojos (blanco sin saturación / negro sin valor) y
        # la lengua (roja, tono < 24) quedan fuera por la puerta.
        "cabeza": ellipse(0.47, 0.30, 0.27, 0.22) & (hh >= 24) & (hh <= 72) & (ss > 0.32) & (vv > 0.42) & opaque,
        # Abanicos rojo/naranja a AMBOS lados de la cabeza.
        "crines": ((fx < 0.215) | (fx > 0.695)) & (fy >= 0.10) & (fy <= 0.48)
                  & ((hh <= 40) | (hh >= 332)) & (ss > 0.33) & (vv > 0.28) & opaque,
        # Aleta dorsal amarilla tras el cuerpo (su flanco izquierdo);
        # la mancha roja vecina queda fuera por la puerta de color.
        "aleta": (fx >= 0.55) & (fx <= 0.75) & (fy >= 0.42) & (fy <= 0.72)
                 & (hh >= 36) & (hh <= 70) & (ss > 0.30) & (vv > 0.40) & opaque,
        # Óvalo magenta de la panza; el cuerpo azul-violeta (~239) no
        # pasa la puerta aunque la elipse lo roce.
        "panza": ellipse(0.42, 0.75, 0.155, 0.145) & (hh >= 282) & (hh <= 342) & (ss > 0.28) & opaque,
        # Cola a bandas moradas/magenta a su derecha, abajo.
        "cola": (fx > 0.655) & (fy >= 0.60) & (fy <= 0.90) & (hh >= 238) & (hh <= 348) & (ss > 0.22) & (vv > 0.12) & opaque,
    }


def build_variant(base_img: Image.Image, mask: np.ndarray, color: tuple) -> tuple:
    """Devuelve (imagen variante, nº píxeles de máscara, nº de halo).

    Aborta si algún píxel OPACO fuera de la máscara cambia.
    """
    arr = np.asarray(base_img).astype(np.int32)
    out = arr.copy()
    # Sustitución en HSV: tono y saturación del color de la zona,
    # valor (sombreado) del píxel original con empujón de brillo.
    hsv = np.asarray(base_img.convert("HSV")).astype(np.int32)
    zh, zs, _zv = colorsys.rgb_to_hsv(color[0] / 255, color[1] / 255, color[2] / 255)
    new_hsv = hsv.copy()
    new_hsv[..., 0] = int(round(zh * 255))
    new_hsv[..., 1] = np.maximum(hsv[..., 1], int(round(zs * 255 * 0.92)))
    new_hsv[..., 2] = np.clip(hsv[..., 2] * VALUE_BOOST + 8, 0, 255)
    new_rgb = np.asarray(
        Image.fromarray(new_hsv.astype(np.uint8), "HSV").convert("RGB")
    ).astype(np.int32)
    out[..., :3] = np.where(mask[..., None], new_rgb, arr[..., :3])

    # Halo: máscara dilatada + difuminada, SOLO donde el base es
    # transparente del todo (alfa 0); nunca toca píxeles del personaje.
    mask_img = Image.fromarray((mask * 255).astype(np.uint8))
    dil = mask_img.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MaxFilter(15))
    halo = np.asarray(dil.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    halo_a = halo * HALO_ALPHA
    sel = (arr[..., 3] == 0) & (halo_a > 0.02)
    out[sel, 0], out[sel, 1], out[sel, 2] = color
    out[sel, 3] = (halo_a[sel] * 255).astype(np.int32)

    # Verificación: fuera de la máscara, ningún píxel opaco cambia.
    diff = np.any(out != arr, axis=-1)
    bad = int((diff & (arr[..., 3] >= 128) & ~mask).sum())
    if bad:
        raise SystemExit(f"ERROR: {bad} píxeles opacos fuera de la máscara cambiaron")
    return Image.fromarray(out.astype(np.uint8), "RGBA"), int(mask.sum()), int(sel.sum())


def build_zones() -> None:
    base_img = Image.open(IMG_DIR / f"{BASE}.png").convert("RGBA")
    arr = np.asarray(base_img)
    hsv = np.asarray(base_img.convert("HSV"))
    masks = zone_masks(arr, hsv, arr[..., 3])
    for zid, color in ZONE_COLORS.items():
        variant, n_mask, n_halo = build_variant(base_img, masks[zid], color)
        variant.save(IMG_DIR / f"alebrije-zona-{zid}.png")
        print(f"zona {zid:8s} #{color[0]:02x}{color[1]:02x}{color[2]:02x}: "
              f"máscara {n_mask} px · halo {n_halo} px · opacos fuera de máscara modificados: 0")


NAMES = [BASE] + [f"alebrije-zona-{z}" for z in ZONE_COLORS]


def main() -> None:
    build_zones()
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
        "   resplandor de COLOR VIVO por zona, derivadas del master\n"
        "   de Jose procesando la imagen (fuera de cada máscara, ni\n"
        "   un píxel opaco cambia; el halo solo toca transparencia).\n"
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
