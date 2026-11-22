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

2. POSES DE LA ESCENA DEL FINAL (2026-11-21): la cinemática del
   final de Leyendas (revelación del set y cierre con créditos) le
   pedía al Alebrije las poses 'director' y 'feliz' DIBUJADAS POR
   CÓDIGO (albCv). Se extraen de su hoja de poses aprobada
   (diseno-alebrije/alebrije-sprites-poses-v2.webp, mapa de
   sprites: alb_claqueta y alb_aceptado) con la misma extracción de
   mkteodora.py (fondo crema → flood-fill → componente mayor → alfa
   real, alto normalizado a 440 px):

     alebrije-director ← alb_claqueta (con la claqueta en las manos)
     alebrije-feliz    ← alb_aceptado (saltando feliz, brazos arriba)

   Identidad intacta: ojos negros enormes, lengua roja rizada
   fuera, mancha roja visible en el flanco frontal.

3. INCRUSTADO: los PNG (base + 6 zonas + 2 poses) se incrustan como
   data URIs en G.ALEBRIJE_DATA, en el mismo estilo que
   rocket-sheets.js (mkrockets.py) y belt-sheets.js (mkbelt.py).

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
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "application" / "src" / "assets" / "img"
OUT = ROOT / "application" / "src" / "js" / "alebrije-sheets.js"
BASE = "alebrije-frente"
DESIGN_DIR_ALB = pathlib.Path.home() / "workspace" / "goals" / "1-minuto-para-la-fiesta" / "files" / "diseno-alebrije"
BG_TOL = 30  # tolerancia de color para considerar un píxel «fondo»

# Poses para la escena del final. En la hoja de poses v2 las figuras
# del centro (claqueta, duelo y aceptado) se TOCAN entre sí (los
# brazos extendidos del duelo rozan a sus vecinas y forman un solo
# componente opaco de x 487 a 2034), así que no basta recortar
# celdas: se inunda el fondo de la hoja entera, se siegan dos tiras
# verticales por los puentes (x = 905 y x = 1420, medidos cortando y
# etiquetando hasta que cada figura queda como su propia pieza) y
# cada pose es el componente cuyo centro cae en su tramo de x:
# director (claqueta) ≈ 487–901 · aceptado (feliz) ≈ 1424–2034.
# La tercera siega (x = 1550) parte el contacto REAL entre las
# crines del duelo y las de «feliz»: en la hoja los abanicos rojos
# de ambos se tocan en un tramo de ~44 px (verificado trazando el
# camino más ancho entre las dos masas: cuello de botella EDT 22,
# todo píxeles rojos de crines), así que ningún criterio de color
# los separa; la siega solo afeita una astilla del lóbulo exterior
# de cada abanico.
POSE_SHEET = "alebrije-sprites-poses-v2.webp"
POSE_CUTS_X = (905, 1420, 1550)
POSE_SPANS = [
    ("director", 480, 910),
    ("feliz", 1420, 2050),
]

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


def build_poses() -> None:
    src = DESIGN_DIR_ALB / POSE_SHEET
    if not src.exists():
        print(f"AVISO: no está la hoja {src}; se conservan los PNG existentes de las poses")
        return
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.int32)
    corners = np.concatenate([
        arr[:12, :12].reshape(-1, 3), arr[:12, -12:].reshape(-1, 3),
        arr[-12:, :12].reshape(-1, 3), arr[-12:, -12:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    dist = np.abs(arr - bg).max(axis=-1)
    candidate = dist < BG_TOL
    # Las siegas cuentan como fondo YA en la inundación: entre las
    # figuras que se tocan quedan bolsas de fondo atrapadas (el hueco
    # entre las crines y el brazo del duelo, junto a la mano de
    # «feliz») que, si la inundación no las alcanza, quedan como una
    # masa «opaca» de color fondo que pega los trozos de la vecina a
    # la figura elegida. Con la tira abierta, la inundación entra en
    # la bolsa y todo se separa solo.
    for cx in POSE_CUTS_X:
        candidate[:, cx - 4:cx + 4] = True
    lab, _n = ndimage.label(candidate)
    border_labels = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    is_bg = np.isin(lab, list(border_labels))
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    for cx in POSE_CUTS_X:
        alpha[:, cx - 4:cx + 4] = 0
    rgb = arr.astype(np.uint8)
    # Segunda barrera: el resplandor amarillo pálido impreso
    # alrededor de las chispas que hay ENTRE figuras también cuenta
    # como «opaco» para la inundación (su canal azul dista del fondo
    # más que BG_TOL) y forma puentes anchos que pegan a la vecina —
    # la chispa entre el duelo y «feliz» tocaba las crines de ambos.
    # Se etiqueta el alfa SIN ese resplandor (la figura elegida es el
    # componente permitido mayor de su tramo) y al final se dilata 3
    # px sobre el alfa original para recuperar su borde íntegro; el
    # borde blanco NO es resplandor (su azul es ≥ 235) y las caras
    # amarillas tampoco (su max−min es ≫ 90).
    rr, gg, bb = (rgb[..., i].astype(np.int32) for i in range(3))
    spread = np.maximum(np.maximum(rr, gg), bb) - np.minimum(np.minimum(rr, gg), bb)
    glow = (alpha > 0) & (rr >= 240) & (gg >= 215) & (bb < 235) & (spread >= 25) & (spread <= 90)
    allowed = (alpha > 0) & ~glow
    lab2, n = ndimage.label(allowed)
    objs = ndimage.find_objects(lab2)
    sizes = ndimage.sum(allowed, lab2, range(1, n + 1)) if n else []
    for pose, x0, x1 in POSE_SPANS:
        best, best_size = None, 0
        for i, sl in enumerate(objs, 1):
            cx = (sl[1].start + sl[1].stop) / 2
            if x0 <= cx <= x1 and sizes[i - 1] > best_size:
                best, best_size = i, sizes[i - 1]
        if best is None:
            raise SystemExit(f"ERROR: no se encontró la pose {pose} en {src}")
        mask = ndimage.binary_dilation(lab2 == best, iterations=3)
        a2 = np.where(mask, alpha, 0).astype(np.uint8)
        img = Image.fromarray(np.dstack([rgb, a2]), "RGBA")
        img = img.crop(img.getchannel("A").getbbox())
        w, h = img.size
        img = img.resize((round(w * 440 / h), 440), Image.LANCZOS)
        dest = IMG_DIR / f"alebrije-{pose}.png"
        img.save(dest)
        print(f"alebrije-{pose:9s} ← {POSE_SHEET} tramo x {x0}–{x1}: {img.size[0]}×{img.size[1]}, {int((a2 > 8).sum())} px opacos")


NAMES = [BASE] + [f"alebrije-zona-{z}" for z in ZONE_COLORS] + [f"alebrije-{p}" for p, _x0, _x1 in POSE_SPANS]


def main() -> None:
    build_zones()
    build_poses()
    entries = []
    for name in NAMES:
        data = (IMG_DIR / f"{name}.png").read_bytes()
        _sd = ROOT / "application" / "src" / "assets" / "sheets" / "alebrije"
        _sd.mkdir(parents=True, exist_ok=True)
        (_sd / f"{name}.png").write_bytes(data)
        entries.append(f'    "{name}": "assets/sheets/alebrije/{name}.png"')
    body = ",\n".join(entries)
    text = (
        "/* GENERADO por tools/mkalebrije.py — NO editar a mano.\n"
        "   El Alebrije de «El patrón del Alebrije» (final Leyendas)\n"
        "   como data URIs (G.ALEBRIJE_DATA): base + 6 zonas de\n"
        "   resplandor de COLOR VIVO por zona, derivadas del master\n"
        "   de Jose procesando la imagen (fuera de cada máscara, ni\n"
        "   un píxel opaco cambia; el halo solo toca transparencia),\n"
        "   + las poses director/feliz de la escena del final,\n"
        "   recortadas de su hoja de poses aprobada.\n"
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
