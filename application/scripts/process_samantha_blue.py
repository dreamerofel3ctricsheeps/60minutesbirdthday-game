#!/usr/bin/env python3
"""
Reprocesa SOLO a Samantha con clave AZUL (#0000FF) en vez de magenta.

Motivo: su hoodie es magenta/fucsia (diseño definido en drafts v1.2), así que
la clave magenta de process_defined_sprites.py se comía el hoodie y lo dejaba
semitransparente (~6.9% de píxeles con alfa 10-120 en walk_front frame 0,
contra <0.9% en el resto del elenco). Sus strips crudos se regeneraron sobre
fondo azul puro —color ausente en su diseño— y este script aplica la misma
segmentación por componentes conexas, las mismas derivaciones de animaciones
y regenera definedSprites.generated.ts igual que el pipeline general.

Entradas:  src/assets/sprites/characters/defined/samantha/raw/<anim>.webp
           (walk_front 4, walk_back 3, walk_right 3, run_right 4,
            carried 2, action 2) sobre fondo azul.
Salidas:   samantha/<anim>.png + samantha/manifest.json
           src/data/characters/definedSprites.generated.ts (regenerado)
El idle_front.png de Samantha NO se toca: viene extraído del draft.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from process_defined_sprites import (  # noqa: E402
    EXPECTED,
    MAX_STRIP_HEIGHT,
    derive_frame,
    generate_ts,
    segment,
    single_frame_entry,
)


def blue_alpha(img: np.ndarray) -> np.ndarray:
    """RGBA con alfa según 'azulez'; despill básico en bordes.

    Espejo de magenta_alpha del pipeline general, con el azul como clave:
    el fondo generado mide ~(2, 88, 244), es decir B domina por >150.
    """
    rgb = img[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    strength = b - np.maximum(r, g)  # alto en el fondo azul, ~0 en el personaje
    # Pendiente más dura que la del magenta (2.2/40): el azul generado trae
    # G≈88, así que los bordes antialiaseados dejan una banda semitransparente
    # ancha (1.64% en walk_front contra 0.67-0.93% del resto del elenco).
    # Con 3.6/32 la banda cae a ~1% sin tocar interiores (el hoodie queda
    # con alfa medio 255 y 0% de píxeles comidos).
    alpha = np.clip(255.0 - (strength - 32.0) * 3.6, 0, 255)
    alpha[b < 120] = 255.0  # píxeles oscuros nunca son fondo
    out = np.dstack([img[:, :, :3], alpha.astype(np.uint8)])
    # Despill: donde el alfa es parcial, reduce el tinte azul.
    partial = (alpha > 0) & (alpha < 255)
    if partial.any():
        px = out[:, :, :3].astype(np.float32)
        a = (alpha / 255.0)[:, :, None]
        bg = np.array([0.0, 0.0, 255.0])
        px[partial] = np.clip(
            (px[partial] - (1 - a[partial]) * bg) / np.maximum(a[partial], 0.05), 0, 255
        )
        out[:, :, :3] = px.astype(np.uint8)
    return out


def repack_if_intrusions(rgba: np.ndarray) -> np.ndarray:
    """Si los bboxes de las poses se invaden entre sí (poses anchas y juntas:
    en run_right la coleta/zancada de una pose entra en el rectángulo de la
    vecina y se vería un trozo flotante en el juego), reempaqueta el strip:
    pega cada pose —solo sus píxeles— en un lienzo nuevo con huecos
    garantizados, misma Y (misma línea base). Sin píxeles nuevos ni borrados
    del personaje: cada pose conserva exactamente sus píxeles.
    """
    from scipy import ndimage

    alpha = rgba[:, :, 3]
    labeled, n = ndimage.label(alpha > 10)
    if n == 0:
        return rgba
    areas = ndimage.sum(alpha > 10, labeled, range(1, n + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= 0.08 * float(areas.max())]
    comps = []
    for lab in keep:
        ys, xs = np.where(labeled == lab)
        comps.append({
            "lab": lab, "cx": float(xs.mean()),
            "x0": int(xs.min()), "x1": int(xs.max()),
            "y0": int(ys.min()), "y1": int(ys.max()),
        })
    comps.sort(key=lambda c: c["cx"])
    invaded = False
    for c in comps:
        for other in comps:
            if other is c:
                continue
            sub = labeled[c["y0"]:c["y1"] + 1, c["x0"]:c["x1"] + 1]
            if (sub == other["lab"]).any():
                invaded = True
    if not invaded:
        return rgba
    gap = 10
    width = sum(c["x1"] - c["x0"] + 1 for c in comps) + gap * (len(comps) + 1)
    canvas = np.zeros((rgba.shape[0], width, 4), dtype=np.uint8)
    x = gap
    for c in comps:
        w = c["x1"] - c["x0"] + 1
        region = rgba[c["y0"]:c["y1"] + 1, c["x0"]:c["x1"] + 1].copy()
        region[labeled[c["y0"]:c["y1"] + 1, c["x0"]:c["x1"] + 1] != c["lab"]] = 0
        canvas[c["y0"]:c["y1"] + 1, x:x + w] = region
        x += w + gap
    return canvas


def process_strip_blue(raw_path: Path, out_png: Path) -> dict:
    img = np.asarray(Image.open(raw_path).convert("RGBA"))
    rgba = blue_alpha(img)
    rgba = repack_if_intrusions(rgba)
    boxes = segment(rgba[:, :, 3])
    scale = min(1.0, MAX_STRIP_HEIGHT / rgba.shape[0])
    if scale < 1.0:
        new_size = (round(rgba.shape[1] * scale), round(rgba.shape[0] * scale))
        rgba = np.asarray(
            Image.fromarray(rgba, "RGBA").resize(new_size, Image.LANCZOS)
        )
        boxes = [
            (round(x * scale), round(y * scale), round(w * scale), round(h * scale))
            for (x, y, w, h) in boxes
        ]
    Image.fromarray(rgba, "RGBA").save(out_png, optimize=True)
    return {
        "width": int(rgba.shape[1]),
        "height": int(rgba.shape[0]),
        "frames": [
            {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
            for (x, y, w, h) in boxes
        ],
    }


def main() -> None:
    app = Path(__file__).resolve().parents[1]
    base = app / "src" / "assets" / "sprites" / "characters" / "defined"
    cdir = base / "samantha"
    raw_dir = cdir / "raw"
    manifest: dict[str, dict] = {}
    report: dict[str, str] = {}

    for anim, expected in EXPECTED.items():
        raw = None
        for ext in ("webp", "png", "jpg"):
            cand = raw_dir / f"{anim}.{ext}"
            if cand.exists():
                raw = cand
                break
        if raw is None:
            report[anim] = "FALTA strip crudo"
            continue
        entry = process_strip_blue(raw, cdir / f"{anim}.png")
        manifest[anim] = entry
        got = len(entry["frames"])
        report[anim] = "ok" if got == expected else f"SEGMENTADAS {got} poses (esperadas {expected})"

    # Idle frontal: NO se toca el PNG (extraído del draft); solo se registra.
    idle_png = cdir / "idle_front.png"
    if idle_png.exists():
        manifest["idle_front"] = single_frame_entry(idle_png)
    elif "walk_front" in manifest:
        manifest["idle_front"] = derive_frame(manifest["walk_front"], 0)
        report["idle_front"] = "derivado de walk_front[0] (sin extracción)"
    # Derivaciones documentadas (idénticas al pipeline general)
    if "walk_back" in manifest:
        manifest["idle_back"] = derive_frame(manifest["walk_back"], 0)
        manifest["run_back"] = manifest["walk_back"]
    if "walk_right" in manifest:
        manifest["idle_right"] = derive_frame(manifest["walk_right"], 0)
    if "walk_front" in manifest:
        manifest["run_front"] = manifest["walk_front"]

    (cdir / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    report["_manifest"] = f"{len(manifest)} animaciones"
    generate_ts(base, app)
    print(json.dumps(report, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
