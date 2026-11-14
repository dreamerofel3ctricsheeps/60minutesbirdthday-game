#!/usr/bin/env python3
"""keystrip.py — Procesa un strip generado (fondo magenta sólido) a PNG con alfa + manifest.

Uso:
  python3 tools/keystrip.py ENTRADA.png SALIDA.png FRAMES.json [--expect N]

- Muestrea el color de fondo de las 4 esquinas (mediana) en vez de asumir un magenta exacto.
- Recorta el fondo por flood-fill desde los bordes a través de píxeles "parecidos al fondo"
  (nunca toca el interior del personaje, aunque lleve morados/magentas en la ropa).
- Despill ligero SOLO en píxeles del borde de la silueta.
- Segmenta los frames por proyección de columnas de alfa (huecos >= 10 px separan frames).
- Compone el strip final: frames en fila, alineados por abajo, 6 px de separación.
- FRAMES.json: {"width": W, "height": H, "frames": [{"x","y","width","height"}, ...]}
- Imprime QC por frame: % de píxeles semitransparentes (10 < alfa < 245) dentro del bbox.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    src, dst, jpath = sys.argv[1], sys.argv[2], sys.argv[3]
    expect = None
    if '--expect' in sys.argv:
        expect = int(sys.argv[sys.argv.index('--expect') + 1])
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.int32)
    h, w = a.shape[:2]

    # color de fondo: mediana de parches de esquina 12x12
    patches = np.concatenate([
        a[:12, :12].reshape(-1, 3), a[:12, -12:].reshape(-1, 3),
        a[-12:, :12].reshape(-1, 3), a[-12:, -12:].reshape(-1, 3)])
    bg = np.median(patches, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    like_bg = dist < 115

    # flood-fill desde los bordes a través de píxeles tipo-fondo
    lab, _ = ndimage.label(like_bg)
    border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    alpha = np.where(bgmask, 0, 255).astype(np.uint8)
    # rampa suave solo en el anillo fronterizo (distancia intermedia y pegado al fondo recortado)
    soft = (~bgmask) & (dist < 150)
    alpha[soft] = np.clip((dist[soft] - 115) / 35 * 255, 60, 255).astype(np.uint8)
    # purga de bolsillos: restos casi puros del color de fondo encerrados por el
    # personaje (p. ej. entre el cable de los audífonos y el cuello) que el
    # flood-fill no alcanza. Umbral conservador: ningún color de diseño válido
    # de estos personajes cae a < 100 del magenta de fondo.
    alpha[(~bgmask) & (dist < 100)] = 0

    out = np.dstack([np.asarray(im), alpha])
    # despill: píxeles opacos vecinos del fondo con tinte del fondo -> neutralizar exceso
    near_bg = ndimage.binary_dilation(bgmask) & ~bgmask
    r, g, b = out[..., 0].astype(np.int32), out[..., 1].astype(np.int32), out[..., 2].astype(np.int32)
    excess = (np.minimum(r, b) - g)
    fix = near_bg & (excess > 40) & (bg[0] > 120) & (bg[2] > 120) & (bg[1] < 110)
    out[..., 0] = np.where(fix, r - excess * 0.45, r).astype(np.uint8)
    out[..., 2] = np.where(fix, b - excess * 0.45, b).astype(np.uint8)

    rgba = Image.fromarray(out.astype(np.uint8), 'RGBA')
    arr = np.asarray(rgba)
    colhas = (arr[..., 3] > 40).any(axis=0)
    runs, s = [], None
    gap = 0
    for x in range(w):
        if colhas[x]:
            if s is None: s = x
            gap = 0
        elif s is not None:
            gap += 1
            if gap >= 10:
                runs.append((s, x - gap)); s = None; gap = 0
    if s is not None: runs.append((s, w - 1))
    boxes = []
    for x0, x1 in runs:
        sub = arr[:, x0:x1 + 1, 3] > 40
        ys, xs = np.where(sub.any(axis=1))[0], np.where(sub.any(axis=0))[0]
        if len(ys) == 0: continue
        boxes.append((x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1))
    if expect and len(boxes) != expect:
        print(f'WARN: se esperaban {expect} frames, se segmentaron {len(boxes)}')
    H = max(y1 - y0 for _, y0, _, y1 in boxes)
    W = sum(x1 - x0 for x0, _, x1, _ in boxes) + 6 * (len(boxes) - 1)
    strip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    frames, cx = [], 0
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        fr = rgba.crop((int(x0), int(y0), int(x1), int(y1)))
        strip.alpha_composite(fr, (int(cx), int(H - (y1 - y0))))
        frames.append({'x': int(cx), 'y': int(H - (y1 - y0)), 'width': int(x1 - x0), 'height': int(y1 - y0)})
        fa = np.asarray(fr)[..., 3]
        semi = float(((fa > 10) & (fa < 245)).sum()) / max(1, (fa > 10).sum()) * 100
        print(f'  frame {i}: {x1 - x0}x{y1 - y0} semitransparente {semi:.2f}%')
        cx += (x1 - x0) + 6
    strip.save(dst)
    json.dump({'width': int(W), 'height': int(H), 'frames': frames}, open(jpath, 'w'), indent=1)
    print(f'OK {dst}: {len(frames)} frames, strip {W}x{H}, fondo muestreado {bg.tolist()}')


if __name__ == '__main__':
    main()
