#!/usr/bin/env python3
"""mkcutout.py — Recortes de FOTO REAL para las capas del easter egg «La Cita».

Hermana de mkdefined.py: toma una fotografía (p. ej. un hito de una plaza),
le quita el fondo y le hornea el MISMO acabado que llevan los sprites
definidos de la v3.1, para que la foto se lea como un sticker del mismo
mundo y no como una foto pegada:

  1. Recorte opcional (fracciones) para aislar el sujeto de la foto.
  2. Fondo fuera: rembg (u2net) si está instalado; si no, flood-fill
     desde los bordes por color de cielo (scipy) como respaldo.
  3. Limpieza: se conserva el componente mayor, se rellenan huecos y se
     erosiona 1 px el borde para quitar el halo del fondo original.
  4. Borde blanco Paper Mario: dilatación de la máscara (como en
     mkdefined.py: anillo blanco opaco alrededor de la silueta), con
     grosor proporcional al ancho del recorte.
  5. Sombra suave común: copia oscura desplazada y difuminada BAJO el
     recorte, para que «apoye» sobre la capa de piso.
  6. Recorte al contenido y reescalado a un ancho máximo.

Uso:
  python3 tools/mkcutout.py ENTRADA.jpg SALIDA.png [--crop x0,y0,x1,y1]
                            [--maxw 1200] [--border 0.006]

Para el mejor recorte, correr con un Python que tenga rembg instalado
(p. ej. un venv con `pip install rembg onnxruntime`); sin rembg cae al
flood-fill, que sirve para fotos con cielo limpio y sujeto contrastado.
"""
import argparse, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def alpha_rembg(img):
    from rembg import remove, new_session
    out = remove(img, session=new_session('u2net'))
    return np.asarray(out.split()[3]).copy()


def alpha_floodfill(img, tol=26):
    """Respaldo sin rembg: el fondo es el componente conectado a los
    bordes cuyos píxeles se parecen (distancia de color) al cielo
    muestreado en las esquinas superiores."""
    a = np.asarray(img.convert('RGB')).astype(int)
    h, w, _ = a.shape
    sky = np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3)]).mean(axis=0)
    d = np.sqrt(((a - sky) ** 2).sum(axis=2))
    cand = d < tol * 2.2  # candidatos a fondo (cielo y nubes claras)
    lab, _ = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # el flood «de verdad»: crecer desde los bordes por vecinos parecidos
    # entre sí (no solo al cielo medio), para seguir el degradado.
    grow = np.zeros((h, w), bool); grow[0, :] = grow[-1, :] = grow[:, 0] = grow[:, -1] = True
    prev = -1
    cur = grow.copy()
    for _ in range(64):
        dil = ndimage.binary_dilation(cur)
        step = np.sqrt(((a - np.roll(a, 1, 0)) ** 2).sum(axis=2)) < tol
        nxt = dil & (bg | ndimage.binary_dilation(bg))
        if (nxt == cur).all():
            cur = nxt; break
        cur = nxt
    bg = cur & (bg | cand)
    return np.where(bg, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--crop', default=None, help='x0,y0,x1,y1 en fracciones 0..1')
    ap.add_argument('--maxw', type=int, default=1200)
    ap.add_argument('--border', type=float, default=0.006, help='grosor del borde blanco (fracción del ancho)')
    args = ap.parse_args()

    img = Image.open(args.src).convert('RGB')
    if args.crop:
        x0, y0, x1, y1 = (float(v) for v in args.crop.split(','))
        img = img.crop((int(x0 * img.width), int(y0 * img.height), int(x1 * img.width), int(y1 * img.height)))
    try:
        alpha = alpha_rembg(img)
        method = 'rembg'
    except Exception as e:
        print(f'[mkcutout] rembg no disponible ({e}); uso flood-fill', file=sys.stderr)
        alpha = alpha_floodfill(img)
        method = 'floodfill'
    mask = alpha > 127
    # limpieza: componente mayor + rellenar huecos + quitar halo (erosión 1)
    lab, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        mask = lab == (1 + int(np.argmax(sizes)))
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_erosion(mask, iterations=1)
    mask = ndimage.binary_fill_holes(mask)

    rgba = img.convert('RGBA')
    rgba.putalpha(Image.fromarray((mask * 255).astype(np.uint8)))

    # sombra suave común (bajo el recorte, desplazada hacia abajo)
    pad = int(img.width * 0.03) + 8
    W, H = img.width + pad * 2, img.height + pad * 2
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sil = Image.new('RGBA', img.size, (24, 16, 34, 255))
    sil.putalpha(Image.fromarray((mask * 110).astype(np.uint8)))
    shadow.paste(sil, (pad, pad + int(img.height * 0.012)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(img.width * 0.006 + 2))

    # borde blanco por dilatación de la máscara (igual que mkdefined.py)
    bw = max(3, int(img.width * args.border))
    ring = ndimage.binary_dilation(mask, iterations=bw) & ~mask
    white = Image.new('RGBA', img.size, (255, 255, 255, 255))
    white.putalpha(Image.fromarray((ring * 255).astype(np.uint8)))

    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(shadow)
    body = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    body.alpha_composite(white, (pad, pad))
    body.alpha_composite(rgba, (pad, pad))
    canvas.alpha_composite(body)

    bbox = canvas.split()[3].getbbox()
    canvas = canvas.crop(bbox)
    if canvas.width > args.maxw:
        canvas = canvas.resize((args.maxw, int(canvas.height * args.maxw / canvas.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(args.dst)), exist_ok=True)
    canvas.save(args.dst, optimize=True)
    print(f'[mkcutout] {args.dst}: {canvas.width}x{canvas.height}, método={method}, {os.path.getsize(args.dst)//1024} KB')


if __name__ == '__main__':
    main()
