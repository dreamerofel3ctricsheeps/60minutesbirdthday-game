#!/usr/bin/env python3
"""mkdefined.py — Adaptador de sprites DEFINIDOS para la base v3.1.

Lee los bundles rescatados en application/src/assets/new-sprites/ (strips PNG +
manifest.json con rects irregulares), y por personaje:

  1. Recorta cada frame de las animaciones que usa el motor.
  2. Normaliza todos los frames del personaje con UNA sola escala (la altura de
     contenido pasa a TARGET_H) y los alinea por la línea de piso (BASE).
  3. Hornea el borde blanco estilo Paper Mario de la v3.1 (dilatación de la
     silueta 2 px -> anillo blanco opaco), igual que hacía mksprites.py.
  4. Empaqueta una hoja de celdas uniformes (fw x fh por personaje).
  5. Detecta los OJOS POR FRAME en los frames frontales (blobs blancos con
     pupila; para Jose, que lleva lentes oscuros, detecta los cristales como
     blobs oscuros y marca lenses=True para NO repintar sobre ellos).
     Si un frame frontal no se detecta, cae al promedio del personaje
     (ojosSrc='avg' en la metadata).
  6. Emite application/src/js/defined-sheets.js (G.DEFINED_META + G.DEFINED_DATA
     en dataURL, consumible por file:// sin servidor) y deja los PNG de hoja en
     application/src/assets/sprites/defined/<id>.png para inspección.

Animaciones empaquetadas (nombre de motor): idle, idle_up, idle_right,
walk_down, walk_up, walk_right, run_down, run_up, run_right, act
(+ sneak/celebrate en Jose; el gato usa idle/walk/pounce y, para la
escalada de repisas donde trepa DE ESPALDAS, back_idle/back_jump: su
vista trasera generada a propósito, porque el bundle solo traía
frontal/perfil/pounce).
Los 7 roomies empaquetan ADEMÁS carried y carrywalk_down/up/right: desde el
rediseño de flujo de 2026-11-14 la recolección permite cargar partners al
hombro (el portador camina con carrywalk_*, el pasajero va en su pose
carried). NO se empaquetan: idle_3_4 y sleep de Ximena (sleep es una
ilustración con su propia cama, no encaja en la cama 3D del departamento;
su cabeza se recorta del idle como hacía la v3.1).

Uso:  python3 tools/mkdefined.py
"""
import base64, io, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
NS = os.path.join(ROOT, 'application/src/assets/new-sprites')
OUT_JS = os.path.join(ROOT, 'application/src/js/defined-sheets.js')
OUT_PNG = os.path.join(ROOT, 'application/src/assets/sprites/defined')

HUMAN = dict(fh=244, base=236, target_h=198, scale=0.33)
# Gato: la escala se calibró contra el Pollito ORIGINAL de la v3.1 (dibujado
# por código en sprites.js): su 'sit' medía ≈33 u de mundo sobre el piso y su
# caminata ≈27 u (su head() anclaba en 34 u; el humano mide ≈65 u). Con
# target_h=118 px (el contenido más alto = idle sentado): 118 × 0.25 = 29.5 u,
# ×1.15 de sy del actor en world.js ≈ 34 u sentado y ≈28 u en prowl (96 px),
# es decir prowl ≈43% de la altura humana — la proporción original. Con el
# 0.42 anterior el gato medía ≈50 u (≈76% de un humano): se veía enorme.
CATG = dict(fh=150, base=140, target_h=118, scale=0.25)

# nombre de motor -> clave en el bundle
ANIM_MAP = {
    'idle': 'idle', 'walk_down': 'walk_front', 'walk_up': 'walk_back',
    'walk_right': 'walk_right', 'run_down': 'run_front', 'run_up': 'run_back',
    'run_right': 'run_right', 'act': 'action', 'sneak': 'sneak',
    'celebrate': 'celebrate', 'carrywalk_down': 'carrywalk_front',
    'carrywalk_up': 'carrywalk_back', 'carrywalk_right': 'carrywalk_right',
    'carried': 'carried',
}
FRONTAL = {'idle', 'walk_down', 'run_down', 'act'}
PACK_HUMAN = ['idle', 'walk_down', 'walk_up', 'walk_right', 'run_down',
              'run_up', 'run_right', 'act']
# Solo los 7 roomies: son los únicos que pueden ser protagonistas/portadores
# y pasajeros. carried NO entra en FRONTAL (la pose va acostada, de medio
# lado: sin ojos útiles para repintar expresiones) y carrywalk_* tampoco
# (la cara queda parcialmente tapada por los brazos en alto): en esas
# animaciones el motor simplemente no repinta expresiones.
PACK_CARRY = ['carrywalk_down', 'carrywalk_up', 'carrywalk_right', 'carried']


def load_bundle(d):
    """Devuelve {clave_bundle: [Image frame RGBA, ...]} resolviendo el strip
    por dimensiones cuando <anim>.png no existe o no coincide (idle_back /
    idle_right viven dentro de los strips de walk_*)."""
    man = json.load(open(os.path.join(d, 'manifest.json')))
    strips = {}
    for f in os.listdir(d):
        if f.endswith('.png'):
            im = Image.open(os.path.join(d, f)).convert('RGBA')
            strips[f[:-4]] = im
    out = {}
    for anim, info in man.items():
        cands = [strips[anim]] if anim in strips and strips[anim].size == (info['width'], info['height']) else \
            [im for im in strips.values() if im.size == (info['width'], info['height'])]
        if not cands:
            print(f'  !! {anim}: sin strip {info["width"]}x{info["height"]} en {d}')
            continue
        strip = cands[0]
        out[anim] = [strip.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height']))
                     for f in info['frames']]
    return out


def load_ximena():
    man = json.load(open(os.path.join(NS, 'characters/sprites_manifest.json')))
    fmap = {'idle_front': 'idle/ximena.png', 'idle_3_4': 'idle/ximena-3-4.png',
            'walk_front': 'walk/ximena-front.png', 'walk_right': 'walk/ximena-right.png',
            'walk_back': 'walk/ximane-back.png', 'run_right': 'run/ximena-right.png',
            'run_back': 'run/ximena-back.png'}
    out = {}
    for anim, rel in fmap.items():
        strip = Image.open(os.path.join(NS, 'characters', rel)).convert('RGBA')
        info = man[anim]
        assert strip.size == (info['width'], info['height']), (anim, strip.size)
        out[anim] = [strip.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height']))
                     for f in info['frames']]
    extra = load_bundle(os.path.join(NS, 'characters/defined/ximena'))
    for k in ('action', 'run_front'):
        if k in extra: out[k] = extra[k]
    out['idle'] = out.pop('idle_front')
    return out


def content_bbox(im):
    a = np.asarray(im)[..., 3] > 40
    if not a.any(): return None
    ys, xs = np.where(a.any(axis=1))[0], np.where(a.any(axis=0))[0]
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def white_outline(cell):
    """Anillo blanco de 2px alrededor de la silueta (Paper Mario, como mksprites)."""
    arr = np.asarray(cell).copy()
    mask = arr[..., 3] > 127
    ring = ndimage.binary_dilation(mask, iterations=2) & ~mask
    arr[ring] = (255, 255, 255, 255)
    return Image.fromarray(arr, 'RGBA')


def find_eyes(cell_img, dark=False):
    """Ojos en coords de celda. Blancos grandes con pupila (o cristales oscuros
    si dark=True). Devuelve lista de {x,y,r} (0, 1 o 2 ojos)."""
    a = np.asarray(cell_img)
    rgb, al = a[..., :3].astype(np.int32), a[..., 3]
    if dark:
        m = (rgb.max(axis=2) < 72) & (al > 200)
        amin, amax = 260, 5200
    else:
        m = (rgb.min(axis=2) > 222) & (al > 200)
        amin, amax = 45, 3400
    lab, n = ndimage.label(m)
    if n == 0: return []
    objs = ndimage.find_objects(lab)
    cands = []
    H = a.shape[0]
    for i, sl in enumerate(objs, 1):
        if sl is None: continue
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((lab[sl] == i).sum())
        if not (amin <= area <= amax) or not (0.5 <= w / max(1, h) <= 1.9): continue
        cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        if cy > H * 0.62: continue
        cands.append({'x': round(cx, 1), 'y': round(cy, 1), 'r': round((w + h) / 4, 1), 'area': area})
    if not cands: return []
    cands.sort(key=lambda e: -e['area'])
    if len(cands) >= 2:
        # mejor pareja: áreas parecidas y misma altura
        best = None
        for i in range(len(cands)):
            for j in range(i + 1, len(cands)):
                p, q = cands[i], cands[j]
                if abs(p['y'] - q['y']) < max(p['r'], q['r']) * 0.9 and 0.45 < p['area'] / q['area'] < 2.2:
                    score = p['area'] + q['area']
                    if best is None or score > best[0]: best = (score, sorted([p, q], key=lambda e: e['x']))
        if best: return [{k: e[k] for k in ('x', 'y', 'r')} for e in best[1]]
    e = cands[0]
    return [{k: e[k] for k in ('x', 'y', 'r')}]


def detect_hands(cell_img, base, anim):
    """Punto de apoyo de las MANOS LEVANTADAS en un frame carrywalk_*:
    altura en px sobre la línea de piso (base) a la que quedan las puntas
    de los puños/palmas. Es el ancla donde descansa el pasajero (carried):
    la escena cuelga al pasajero de este apoyo (ver Actor.carrySupportY en
    world.js). Sin esta medida la carga usaba un elev fijo (46) que caía a
    la altura de la CARA del portador: el pasajero se veía "detrás de la
    cabeza" en vez de sobre las manos.
    - frontal/espaldas: promedio de la punta de cada mano (zonas laterales
      fuera del tercio central, que es donde está la cabeza).
    - perfil (carrywalk_right): la mano delantera levantada (zona frontal;
      la trasera queda tapada por el cuerpo en la mayoría de los frames)."""
    a = np.asarray(cell_img)[..., 3] > 40
    if not a.any(): return None
    ys, xs = np.where(a.any(axis=1))[0], np.where(a.any(axis=0))[0]
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    cx, w = (x0 + x1) / 2, x1 - x0
    def topmost(sl):
        rows = np.where(a[:, sl].any(axis=1))[0]
        return int(rows.min()) if len(rows) else None
    if anim == 'carrywalk_right':
        t = topmost(slice(int(cx + w * 0.12), x1))
        return round(base - t, 1) if t is not None else None
    tops = [t for t in (topmost(slice(x0, int(cx - w * 0.16))),
                        topmost(slice(int(cx + w * 0.16), x1))) if t is not None]
    if not tops: return None
    return round(base - sum(tops) / len(tops), 1)


def detect_carried_rest(cell_img, base):
    """Línea de apoyo del torso en un frame carried, en px sobre la base.
    Las poses carried son "voladoras" (cabeza al frente, piernas atrás):
    el píxel más bajo de la celda suele ser una pierna o un brazo colgando,
    no el torso que el portador sujeta. La línea útil es el fondo de la
    MASA del torso: la fila ancha (>= 50% del ancho máximo de la mitad
    inferior de la silueta) más baja. Devuelve cuánto hay que HUNDIR el
    frame (base - esa fila) para que el torso descanse sobre las manos
    del portador y las extremidades cuelguen a los lados."""
    a = np.asarray(cell_img)[..., 3] > 40
    if not a.any(): return None
    ys = np.where(a.any(axis=1))[0]
    y0, y1 = int(ys.min()), int(ys.max())
    widths = a.sum(axis=1)
    lo = int(y0 + (y1 - y0) * 0.45)
    seg = widths[lo:y1 + 1]
    if not len(seg) or seg.max() == 0: return None
    rows = np.where(seg >= 0.5 * seg.max())[0]
    if not len(rows): return None
    return round(base - 1 - (lo + int(rows.max())), 1)


def skin_color(cell_img, eyes):
    a = np.asarray(cell_img)
    xs = [e['x'] for e in eyes]; ys = [e['y'] for e in eyes]; rs = [e['r'] for e in eyes]
    x0, x1 = int(min(xs) - max(rs) * 0.4), int(max(xs) + max(rs) * 0.4)
    y0, y1 = int(max(ys) + max(rs) * 0.85), int(max(ys) + max(rs) * 2.1)
    sub = a[max(0, y0):y1, max(0, x0):x1]
    ok = sub[sub[..., 3] > 200]
    if len(ok) < 12: return [232, 183, 154]
    return [int(np.median(ok[:, c])) for c in range(3)]


def build_char(cid, bundle, geom, anim_names, report):
    frames = {}   # anim motor -> [Image]
    for eng in anim_names:
        key = ANIM_MAP.get(eng, eng)
        if key in bundle: frames[eng] = bundle[key]
        else: report.append(f'{cid}: falta {eng} (bundle sin {key})')
    if cid != 'pollito':
        # idle_up / idle_right = frame 0 de walk_up / walk_right (así vienen en los bundles)
        if 'walk_up' in frames: frames['idle_up'] = [frames['walk_up'][0]]
        if 'walk_right' in frames: frames['idle_right'] = [frames['walk_right'][0]]
    # Escala POR ANIMACIÓN (referencia = frame más bajo de la animación, que en
    # poses de pie es la altura real del cuerpo): los bundles mezclan strips de
    # pipelines/resoluciones distintas (p. ej. el run_front generado de Ximena
    # trae el personaje ~25% más chico que sus strips originales), y una escala
    # global por personaje lo encogía al cambiar de animación. sneak/celebrate
    # usan la escala del idle para conservar su altura relativa (agazapado /
    # festejo se leen contra el cuerpo de pie). El gato usa escala global:
    # sus proporciones entre idle/prowl/pounce sí deben conservarse.
    boxes = {}
    for eng, fl in frames.items():
        for i, fr in enumerate(fl):
            boxes[(eng, i)] = content_bbox(fr)
    def minh(eng):
        hs = [boxes[(eng, i)][3] - boxes[(eng, i)][1] for i in range(len(frames[eng])) if boxes[(eng, i)]]
        return min(hs) if hs else 1
    def maxh(eng):
        hs = [boxes[(eng, i)][3] - boxes[(eng, i)][1] for i in range(len(frames[eng])) if boxes[(eng, i)]]
        return max(hs) if hs else 1
    if cid == 'pollito':
        # La escala global sale de las vistas de siempre (idle/walk/pounce):
        # las vistas TRASERAS nuevas (back_idle/back_jump, para la escalada
        # de repisas) NO deben re-escalar al gato en todo el juego. Usan la
        # misma escala, con guarda de celda si un frame estirado no cupiera
        # sobre la línea de piso.
        s_all = geom['target_h'] / max(maxh(e) for e in frames if not e.startswith('back_'))
        scale_of = {eng: s_all for eng in frames}
        for eng in frames:
            if eng.startswith('back_'):
                scale_of[eng] = min(s_all, (geom['base'] - 6) / maxh(eng))
    else:
        s_idle = geom['target_h'] / minh('idle')
        scale_of = {}
        if 'carried' in frames:
            # carried va ACOSTADO (pose diagonal volando sobre el hombro):
            # ni su alto (grosor del cuerpo tumbado) ni la escala del idle
            # sirven — algunos bundles lo dibujan mucho más ancho que la
            # estatura del personaje (Samantha salía 1.8× su alto). Se
            # normaliza por ANCHO: el largo del cuerpo tumbado ≈ estatura
            # de pie × 1.08 (la diagonal de la pose).
            maxw_c = max(boxes[('carried', i)][2] - boxes[('carried', i)][0]
                         for i in range(len(frames['carried'])) if boxes[('carried', i)])
            scale_of['carried'] = geom['target_h'] * 1.08 / maxw_c
        for eng in frames:
            if eng in ('sneak', 'celebrate'):
                scale_of[eng] = s_idle
            elif eng == 'carried':
                continue
            else:
                s = geom['target_h'] / minh(eng)
                # guarda de celda: el frame más alto de la animación debe caber
                s = min(s, (geom['base'] - 8) / maxh(eng))
                scale_of[eng] = s
    cells, anims, maxw = [], {}, 1
    scaled = {}
    for eng, fl in frames.items():
        anims[eng] = []
        s = scale_of[eng]
        for i, fr in enumerate(fl):
            nw, nh = max(1, round(fr.width * s)), max(1, round(fr.height * s))
            rf = fr.resize((nw, nh), Image.LANCZOS)
            b = boxes[(eng, i)]
            sb = (b[0] * s, b[1] * s, b[2] * s, b[3] * s) if b else (0, 0, nw, nh)
            scaled[(eng, i)] = (rf, sb)
            maxw = max(maxw, nw)
            anims[eng].append(len(cells)); cells.append((eng, i))
    fw = maxw + 4
    fh, base = geom['fh'], geom['base']
    cell_imgs = []
    for (eng, i) in cells:
        rf, sb = scaled[(eng, i)]
        cell = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        cell.alpha_composite(rf, (round((fw - rf.width) / 2), round(base - sb[3])))
        cell_imgs.append(white_outline(cell))
    cols = 7
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (fw * cols, fh * rows), (0, 0, 0, 0))
    for idx, ci in enumerate(cell_imgs):
        sheet.alpha_composite(ci, ((idx % cols) * fw, (idx // cols) * fh))
    # ojos por frame frontal + promedios
    eyes, eyes_src, det = {}, {}, []
    for idx, (eng, i) in enumerate(cells):
        if eng not in FRONTAL: continue
        e = find_eyes(cell_imgs[idx], dark=(cid == 'jose'))
        if cid == 'jose' and not e: e = find_eyes(cell_imgs[idx], dark=False)
        if e: eyes[idx] = e; eyes_src[idx] = 'lens' if cid == 'jose' else 'det'; det.extend(e)
    frontal_n = sum(1 for (eng, _) in cells if eng in FRONTAL)
    if det and cid != 'pollito':
        avg = [{'x': round(float(np.mean([e['x'] for e in det])), 1),
                'y': round(float(np.mean([e['y'] for e in det])), 1),
                'r': round(float(np.mean([e['r'] for e in det])), 1)}]
        # promedio como pareja si hay detecciones de 2 ojos
        pairs = [eyes[k] for k in eyes if len(eyes[k]) == 2]
        if pairs:
            avg = [{'x': round(float(np.mean([p[0]['x'] for p in pairs])), 1),
                    'y': round(float(np.mean([p[0]['y'] for p in pairs])), 1),
                    'r': round(float(np.mean([p[0]['r'] for p in pairs])), 1)},
                   {'x': round(float(np.mean([p[1]['x'] for p in pairs])), 1),
                    'y': round(float(np.mean([p[1]['y'] for p in pairs])), 1),
                    'r': round(float(np.mean([p[1]['r'] for p in pairs])), 1)}]
        for idx, (eng, _) in enumerate(cells):
            if eng in FRONTAL and idx not in eyes:
                eyes[idx] = avg; eyes_src[idx] = 'avg'
    cov = (sum(1 for k, v in eyes_src.items() if v in ('det', 'lens')) / frontal_n * 100) if frontal_n else 0
    # ancla de manos de la carga (solo roomies: los únicos con carrywalk_*)
    hands = {}
    for eng in ('carrywalk_down', 'carrywalk_up', 'carrywalk_right'):
        if eng in anims:
            vals = [detect_hands(cell_imgs[ci], base, eng) for ci in anims[eng]]
            if all(v is not None for v in vals): hands[eng] = vals
    # hundimiento del pasajero: promedio del apoyo del torso entre los
    # frames carried (un solo valor por personaje: el ciclo carried alterna
    # frames y un valor por frame haría saltar el objetivo del resorte
    # cada medio segundo; el promedio deja el torso asentado y las
    # extremidades colgando, que es como se lee la pose).
    carried_rest = None
    if 'carried' in anims:
        vals = [detect_carried_rest(cell_imgs[ci], base) for ci in anims['carried']]
        if all(v is not None for v in vals): carried_rest = round(sum(vals) / len(vals), 1)
    idle0 = cell_imgs[anims['idle'][0]] if 'idle' in anims else cell_imgs[0]
    ib = content_bbox(idle0)
    top = ib[1] if ib else 0
    e0 = eyes.get(anims['idle'][0]) if 'idle' in anims else None
    skin = skin_color(idle0, e0) if e0 else [232, 183, 154]
    neck = int((e0[0]['y'] + e0[0]['r'] * 2.7)) if e0 else int(top + geom['target_h'] * 0.52)
    meta = {'fw': fw, 'fh': fh, 'base': base, 'scale': geom['scale'], 'cols': cols,
            'sw': sheet.width, 'sh': sheet.height, 'top': int(top), 'neck': neck,
            'skin': skin, 'lenses': cid == 'jose',
            'anims': {k: v for k, v in anims.items()},
            **({'hands': hands} if hands else {}),
            **({'carriedRest': carried_rest} if carried_rest is not None else {}),
            'eyes': {str(k): v for k, v in eyes.items()},
            'eyesSrc': {str(k): v for k, v in eyes_src.items()}}
    report.append(f"{cid}: {len(cells)} celdas fw={fw} fh={fh} hoja {sheet.width}x{sheet.height} "
                  f"ojos frontales detectados {cov:.0f}% ({frontal_n} frames)")
    return meta, sheet


def main():
    report = []
    os.makedirs(OUT_PNG, exist_ok=True)
    jobs = []
    for cid in ['alan', 'fatima', 'itzel', 'majo', 'natalia', 'samantha', 'saulo']:
        jobs.append((cid, load_bundle(os.path.join(NS, 'characters/defined', cid)), HUMAN, PACK_HUMAN + PACK_CARRY))
    jobs.append(('ximena', load_ximena(), HUMAN, PACK_HUMAN))
    jobs.append(('jose', load_bundle(os.path.join(NS, 'characters/villains/jose')), HUMAN,
                 PACK_HUMAN + ['sneak', 'celebrate']))
    gato = load_bundle(os.path.join(NS, 'characters/villains/gato'))
    back = gato.get('back', [])  # vista trasera: [0] sentado, [1..] saltando/trepando
    jobs.append(('pollito', {'idle': gato.get('idle', []), 'walk': gato.get('prowl', []),
                             'pounce': gato.get('pounce', []),
                             'back_idle': back[:1], 'back_jump': back[1:]}, CATG,
                 ['idle', 'walk', 'pounce', 'back_idle', 'back_jump']))
    meta_all, data_all = {}, {}
    for cid, bundle, geom, anims in jobs:
        meta, sheet = build_char(cid, bundle, geom, anims, report)
        meta_all[cid] = meta
        raw = io.BytesIO(); sheet.save(raw, 'PNG', optimize=True)
        png = raw.getvalue()
        if len(png) > 900_000:
            # Paleta de 256 colores: el pixel art la tolera sin pérdida visible
            # y defined-sheets.js pasa de ~10 MB a ~5.5 MB.
            q = sheet.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE)
            qb = io.BytesIO(); q.save(qb, 'PNG', optimize=True)
            if len(qb.getvalue()) < len(png): png = qb.getvalue()
        open(os.path.join(OUT_PNG, cid + '.png'), 'wb').write(png)
        _sd = os.path.join(ROOT, 'application/src/assets/sheets/defined')
        os.makedirs(_sd, exist_ok=True)
        open(os.path.join(_sd, cid + '.png'), 'wb').write(png)
        data_all[cid] = 'assets/sheets/defined/' + cid + '.png'
        report.append(f'  hoja {cid}.png: {len(png) / 1024:.0f} KB')
    js = ('/* GENERADO por tools/mkdefined.py — NO editar a mano.\n'
          '   Hojas de los sprites DEFINIDOS (bundles de new-sprites) normalizadas\n'
          '   a celdas uniformes, con borde blanco Paper Mario y ojos por frame. */\n'
          '(function (root) {\n  "use strict";\n  const G = (root.G = root.G || {});\n'
          '  G.DEFINED_META = ' + json.dumps({'chars': meta_all}) + ';\n'
          '  G.DEFINED_DATA = ' + json.dumps(data_all) + ';\n'
          '})(typeof window !== "undefined" ? window : globalThis);\n')
    open(OUT_JS, 'w').write(js)
    report.append(f'defined-sheets.js: {len(js) / 1024 / 1024:.2f} MB')
    print('\n'.join(report))


if __name__ == '__main__':
    main()
