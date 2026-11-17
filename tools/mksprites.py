"""Genera las hojas de sprites a partir de los borradores (assets/drafts/v1.2).
Recorta cada personaje del damero, baja los brazos de la pose en T, crea la caminata,
la vista de espalda y los metadatos de ojos para las expresiones."""
import numpy as np, json, base64, io, sys, os
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from seg import cutout, NAMES
FW, FH, BASE = 144, 244, 236      # tamaño de cuadro y línea de los pies
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sp/out'
os.makedirs(OUT, exist_ok=True)

def runs(row):
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))

def rotate_part(img, pivot, deg):
    """rota una pieza RGBA alrededor del pivote (vecino más cercano a 4x para conservar el pixel art)"""
    H, W = img.shape[:2]; k = 4
    big = np.repeat(np.repeat(img, k, 0), k, 1)
    th = np.deg2rad(deg); c, s_ = np.cos(th), np.sin(th)
    yy, xx = np.mgrid[0:H * k, 0:W * k]
    px, py = pivot[0] * k, pivot[1] * k
    dx, dy = xx - px, yy - py
    sx = np.round(px + dx * c + dy * s_).astype(int); sy = np.round(py - dx * s_ + dy * c).astype(int)
    ok = (sx >= 0) & (sx < W * k) & (sy >= 0) & (sy < H * k)
    out = np.zeros_like(big); out[ok] = big[sy[ok], sx[ok]]
    return out[k // 2::k, k // 2::k]

def over(base, top):
    m = top[..., 3] > 0; r = base.copy(); r[m] = top[m]; return r

def analyze(o, name):
    ys, xs = np.where(o[..., 3] > 0)
    pad = 40
    A = np.zeros((ys.max() - ys.min() + 1 + pad * 2, xs.max() - xs.min() + 1 + pad * 2, 4), np.uint8)
    A[pad:-pad, pad:-pad] = o[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    m = A[..., 3] > 0; H, W = m.shape
    for _ in range(CFG[name].get('peel', 0)):           # motas negras del damero pegadas por fuera del contorno
        rgbp = A[..., :3].astype(int); dk = (rgbp.max(-1) < 30) | ((rgbp.max(-1) - rgbp.min(-1) < 12) & (rgbp.max(-1) < 175))
        col = m & ~dk; edge = m & ~ndi.binary_erosion(m)
        kill = edge & dk & ~ndi.binary_dilation(col, structure=np.ones((3, 3)))
        A[kill] = 0; m = A[..., 3] > 0
    wid = m.sum(1); full = wid.max()
    band = np.where(wid >= 0.8 * full)[0]; a0, a1 = band.min(), band.max()
    bot = np.where(m.any(1))[0].max(); top = np.where(m.any(1))[0].min()
    low = range(a1 + 4, a1 + 4 + max(6, int((bot - a1) * 0.3)))
    xs_all = np.where(m.any(0))[0]; mid = (xs_all.min() + xs_all.max()) // 2
    ext = []
    for y in low:
        rr = [r for r in runs(m[y]) if r[0] <= mid + 12 and r[1] >= mid - 12]
        if rr: ext.append((min(r[0] for r in rr), max(r[1] for r in rr) - 1))
    cx = float(np.median([(a + b) / 2 for a, b in ext])); tw = float(np.percentile([(b - a) / 2 for a, b in ext], 85))
    # grosor y altura de cada brazo, medidos cerca de la mano (lejos del pelo)
    arms = {}
    for side in (-1, 1):
        tip = xs_all.min() if side < 0 else xs_all.max(); edge = cx + side * tw
        cols = [x for x in range(int(min(tip, edge)), int(max(tip, edge)) + 1) if abs(x - tip) > 5 and abs(x - tip) < 0.5 * abs(edge - tip)]
        seg = []
        for x in cols:
            rr = [r for r in runs(m[a0 - 20:a1 + 21, x]) if r[1] - r[0] > 3]
            if rr: r = max(rr, key=lambda r: r[1] - r[0]); seg.append((r[0] + a0 - 20, r[1] + a0 - 21))
        y0 = float(np.median([a for a, b in seg])); y1 = float(np.median([b for a, b in seg]))
        arms[side] = dict(yA=(y0 + y1) / 2, th=y1 - y0 + 1)
    # piernas: filas con dos tramos contando desde abajo
    yc = bot
    for y in range(bot - 2, a1, -1):
        if len([r for r in runs(m[y]) if r[1] - r[0] > 2]) >= 2: yc = y
        elif y < bot - 8: break
    return dict(A=A, cx=cx, tw=tw, a0=a0, a1=a1, arms=arms, yc=yc, bot=bot, top=top)

def pose(an, ang_l, ang_r, lift, cfg):
    A = an['A'].copy(); H, W = A.shape[:2]; cx, tw = an['cx'], cfg.get('tw', an['tw'])
    inset = cfg.get('inset', 3); hair = an['hair']
    rgb0 = A[..., :3].astype(int); m0 = A[..., 3] > 0
    hairlike = (np.abs(rgb0 - hair).sum(-1) < cfg.get('hairtol', 70)) & m0
    dark = (rgb0.max(-1) < cfg.get('darkv', 30)) & m0
    parts = []
    for side, ang in ((-1, ang_l), (1, ang_r)):
        ar = an['arms'][side]; xe = int(round(cx + side * (tw - inset)))
        y0 = int(np.floor(ar['yA'] - ar['th'] / 2 - cfg.get('up', 4))); y1 = int(np.ceil(ar['yA'] + ar['th'] / 2 + cfg.get('down', 4)))
        reg = np.zeros((H, W), bool)
        if side < 0: reg[y0:y1 + 1, :xe] = True
        else: reg[y0:y1 + 1, xe:] = True
        if cfg.get('junk') == side: reg[y0:, xe:] = True                      # objeto en la mano (libreta): se descarta
        core = reg & m0 & ~hairlike & ~dark
        arm = reg & m0 & (core | (dark & ndi.binary_dilation(core, iterations=3)))
        arm = ndi.binary_closing(arm, iterations=1) & reg & m0
        if cfg.get('allarm'): arm = reg & m0
        lab, n = ndi.label(arm)
        if n > 1: sz = ndi.sum(arm, lab, range(1, n + 1)); arm = lab == (1 + int(np.argmax(sz)))
        part = np.zeros_like(A); part[arm] = A[arm]
        gone = arm | (reg & m0 if cfg.get('junk') == side else False)
        A[gone] = 0
        # restos de contorno sin relleno alrededor del corte
        ext = np.zeros((H, W), bool)
        if side < 0: ext[y0 - 6:y1 + 7, :xe] = True
        else: ext[y0 - 6:y1 + 7, xe:] = True
        mm = A[..., 3] > 0; fillpx = mm & ~dark
        A[ext & mm & dark & ~ndi.binary_dilation(fillpx, iterations=2)] = 0
        # el hueco que deja el brazo sobre el pelo se rellena con color de pelo
        hole = ndi.binary_closing(A[..., 3] > 0, iterations=4) & gone & ndi.binary_dilation(hairlike & (A[..., 3] > 0), iterations=5)
        A[hole, :3] = np.clip(hair * 0.92, 0, 255); A[hole, 3] = 255
        piv = (cx + side * (tw - inset - 1), ar['yA'] + cfg.get('pivy', 0))
        parts.append((side, ang, piv, part))
    if cfg.get('mirror'):                                                    # usa el brazo limpio también del otro lado
        src = [p for p in parts if p[0] == -cfg['mirror']][0]
        c2 = int(round(2 * cx)); fl = np.zeros_like(src[3]); xsrc = np.arange(W); xdst = c2 - xsrc; ok = (xdst >= 0) & (xdst < W)
        fl[:, xdst[ok]] = src[3][:, xsrc[ok]]
        parts = [p if p[0] != cfg['mirror'] else (p[0], p[1], (2 * cx - src[2][0], src[2][1]), fl) for p in parts]
    parts = [rotate_part(p[3], p[2], p[0] * p[1]) for p in parts]
    # piernas
    if lift:
        yc, bot, d = an['yc'] + 2, an['bot'], 4
        gap = int(round(cx))
        sl = (slice(None), slice(0, gap)) if lift < 0 else (slice(None), slice(gap, W))
        leg = A[sl].copy(); leg[yc:bot + 1 - d] = leg[yc + d:bot + 1]; leg[bot + 1 - d:bot + 1] = 0; A[sl] = leg
    for p in parts: A = over(A, p)
    return A

def face_info(an):
    A = an['A']; m = A[..., 3] > 0; cx = an['cx']
    wid = m.sum(1); head_rows = range(an['top'], an['a0'])
    rgb = A[..., :3].astype(int)
    white = (rgb.min(-1) > 222) & m; white[an['a0']:] = False
    lab, n = ndi.label(ndi.binary_fill_holes(white)); eyes = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i); area = len(ys); h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        if 120 < area < 1600 and 0.6 < w / h < 1.6:
            eyes.append(dict(x=float(xs.mean()), y=float(ys.mean()), r=float((w + h) / 4), area=area))
    eyes = sorted(eyes, key=lambda e: -e['area'])[:2]; eyes.sort(key=lambda e: e['x'])
    if len(eyes) == 2: fy = (eyes[0]['y'] + eyes[1]['y']) / 2; sx = int((eyes[0]['x'] + eyes[1]['x']) / 2); sy = int(fy + eyes[0]['r'] * 0.9)
    else: sx = int(cx); sy = int(an['top'] + (an['a0'] - an['top']) * 0.88)
    skin = np.median(rgb[sy - 1:sy + 2, sx - 2:sx + 3].reshape(-1, 3), 0)
    return eyes, skin

def face_mask(P, an, eyes, skin, cfg):
    from PIL import ImageDraw
    from scipy.spatial import ConvexHull
    m = P[..., 3] > 0; rgb = P[..., :3].astype(int); neck = an['a0'] - cfg.get('neck', 2)
    face = (np.abs(rgb - skin).sum(-1) < 60) & m; face[neck:] = False
    lab, n = ndi.label(face)
    if n > 1: sz = ndi.sum(face, lab, range(1, n + 1)); face = np.isin(lab, 1 + np.where(sz > 25)[0])
    ys, xs = np.where(face)
    if len(ys) < 10: return face
    pts = np.c_[xs, ys]; hull = ConvexHull(pts); poly = [tuple(pts[i]) for i in hull.vertices]
    im = Image.new('L', (P.shape[1], P.shape[0]), 0); ImageDraw.Draw(im).polygon(poly, fill=1)
    face = (np.asarray(im) > 0)
    for e in eyes:
        yy, xx = np.ogrid[:P.shape[0], :P.shape[1]]; face |= ((xx - e['x']) ** 2 + (yy - e['y']) ** 2 <= (e['r'] + 3) ** 2)
    face = ndi.binary_dilation(face, iterations=2) & m; face[neck + 2:] = False
    return face

def hair_color(an, eyes, skin, cfg):
    if cfg.get('hair'): return np.array(cfg['hair'], float)
    A = an['A']; m = A[..., 3] > 0; rgb = A[..., :3].astype(int); neck = an['a0'] - 2
    face = face_mask(A, an, eyes, skin, cfg); head = m.copy(); head[neck:] = False
    hp = rgb[head & ~face & (rgb.max(-1) > 45) & (rgb.min(-1) < 215)]
    q = (hp // 12); keys, cnt = np.unique(q, axis=0, return_counts=True)
    return hp[(q == keys[np.argmax(cnt)]).all(1)].mean(0)

def back_view(F, an, eyes, skin, cfg):
    B = F.copy(); hair = an['hair']
    face = face_mask(B, an, eyes, skin, cfg)
    ys, xs = np.where(face)
    if len(ys):
        y0, y1 = ys.min(), ys.max()
        for y, x in zip(ys, xs):
            t = (y - y0) / max(1, y1 - y0); k = 1.05 - 0.2 * t
            if (x + (y // 9) * 3) % 11 == 0 and t > 0.12: k *= 0.82
            B[y, x, :3] = np.clip(hair * k, 0, 255)
        low = face & ~ndi.binary_erosion(face, iterations=2) & (np.arange(B.shape[0])[:, None] > y1 - 4); B[low, :3] = np.clip(hair * 0.45, 0, 255).astype(np.uint8)
    return B[:, ::-1].copy()

def to_frame(P, an, flip=False):
    cx = int(np.floor(an['cx'])) if not flip else P.shape[1] - 1 - int(np.floor(an['cx']))
    fr = np.zeros((FH, FW, 4), np.uint8)
    ys, xs = np.where(P[..., 3] > 0)
    for y, x in zip(ys, xs):
        fx = x - cx + FW // 2; fy = y - an['bot'] + BASE
        if 0 <= fx < FW and 0 <= fy < FH: fr[fy, fx] = P[y, x]
    m = fr[..., 3] > 0
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    if n > 1: sz = ndi.sum(m, lab, range(1, n + 1)); keep = np.isin(lab, 1 + np.where(sz > 60)[0]); fr[~keep] = 0; m = keep
    ring = ndi.binary_dilation(m, iterations=2, structure=np.ones((3, 3))) & ~m     # borde blanco característico
    fr[ring] = (255, 255, 255, 255)
    return fr

CFG = {
    'Majo': dict(junk=1, mirror=1), 'Jose': dict(hair=[34, 30, 36], allarm=True), 'Alan': dict(tw=27), 'Itzel': dict(), 'Natalia': dict(peel=4), 'Ximena': dict(), 'Fatima': dict(), 'Samantha': dict(), 'Saulo': dict(),
}
POSES = [('idle', 72, 72, 0), ('walkA', 58, 84, -1), ('walkB', 84, 58, 1), ('act', -42, -42, 0)]
meta = {}; sheets = {}
for name in NAMES:
    cfg = CFG[name]; an = analyze(cutout(name), name); eyes, skin = face_info(an); an['hair'] = hair_color(an, eyes, skin, cfg)
    frames = []; fronts = []
    for pn, al, ar, lift in POSES:
        P = pose(an, al, ar, lift, cfg); fronts.append(P); frames.append(to_frame(P, an))
    for i in range(3): frames.append(to_frame(back_view(fronts[i], an, eyes, skin, cfg), an, True))
    sheet = np.concatenate(frames, 1); im = Image.fromarray(sheet, 'RGBA')
    im.save(f'{OUT}/{name.lower()}.png')
    ex = lambda e: dict(x=round(e['x'] - int(np.floor(an['cx'])) + FW // 2, 1), y=round(e['y'] - an['bot'] + BASE, 1), r=round(e['r'], 1))
    headTop = int(an['top'] - an['bot'] + BASE)
    meta[name.lower()] = dict(eyes=[ex(e) for e in eyes], skin=[int(v) for v in skin], top=headTop, neck=int(an['a0'] - an['bot'] + BASE))
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); sheets[name.lower()] = base64.b64encode(buf.getvalue()).decode()
    print(name, 'eyes', len(eyes), 'tw', round(an['tw'], 1), 'arm', {k: (round(v['yA']), round(v['th'])) for k, v in an['arms'].items()}, 'hair', an['hair'].astype(int).tolist(), 'yc', an['yc'], 'bot', an['bot'], 'top', an['top'], 'png', len(buf.getvalue()))
json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1)
js = '/* Hojas de sprites generadas por tools/mksprites.py a partir de assets/drafts/v1.2 (no editar a mano). */\n(function(){var G=window.G=window.G||{};\nG.SHEET_META=' + json.dumps(dict(fw=FW, fh=FH, base=BASE, frames=['idle', 'walkA', 'walkB', 'act', 'backIdle', 'backA', 'backB'], chars=meta)) + ';\nG.SHEET_DATA={' + ','.join(f'\n{k}:"data:image/png;base64,{v}"' for k, v in sheets.items()) + '};\n})();\n'
open(f'{OUT}/sheets.js', 'w').write(js); print('sheets.js', len(js))
# hoja de contacto
names = [n.lower() for n in NAMES]; con = Image.new('RGBA', (FW * 7, FH * len(names)), (88, 104, 128, 255))
for i, n in enumerate(names): con.alpha_composite(Image.open(f'{OUT}/{n}.png'), (0, i * FH))
con.save(f'{OUT}/contact.png')
