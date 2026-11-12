#!/usr/bin/env python3
"""
Segunda corrección de arte (playtest de Jose): procesa los strips NUEVOS
generados desde los drafts v1.2 y los fusiona en los manifests/bundles
existentes, sin tocar los strips de la primera corrección.

Strips nuevos por roomie (en raw/<anim>.webp):
  idle             2 frames — de pie RELAJADO con gesto propio (NO pose T);
                   reemplaza al idle_front extraído del draft (pose T).
  run_front        4 frames — carrera frontal con alternancia de piernas.
  run_back         4 frames — carrera de espaldas con alternancia.
  run_right        4 frames — REGENERADO: el anterior no alternaba piernas.
  carrywalk_front  4 frames — camina cargando a alguien al hombro
                   (ambos brazos arriba sujetando; sin segundo personaje).
  carrywalk_back   3 frames — idem de espaldas.
  carrywalk_right  3 frames — idem de perfil.

Clave por personaje (lección Samantha: la clave NUNCA coincide con un
color firma del diseño):
  magenta #FF00FF -> natalia, saulo, fatima, majo, alan
  azul    #0000FF -> samantha (hoodie magenta), itzel (suéter rosa)

QC integrado: por cada frame procesado mide el % de píxeles
semitransparentes (alfa 10-120) dentro de su bbox; el objetivo es <1.5%
(el resto del elenco histórico mide 0.67-0.93%). El reporte se imprime
en JSON al final; cualquier strip fuera de objetivo queda marcado.

Salidas: <id>/<anim>.png actualizados, <id>/manifest.json fusionado y
src/data/characters/definedSprites.generated.ts regenerado (14 claves:
las 11 de la primera corrección + carrywalk_front/back/right).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from process_defined_sprites import (  # noqa: E402
    MAX_STRIP_HEIGHT,
    derive_frame,
    magenta_alpha,
    segment,
)
from process_samantha_blue import blue_alpha, repack_if_intrusions  # noqa: E402

ROOMIES = ["natalia", "saulo", "itzel", "fatima", "samantha", "majo", "alan"]
NEW_ANIMS = {
    "idle": 2,
    "run_front": 4,
    "run_back": 4,
    "run_right": 4,
    "carrywalk_front": 4,
    "carrywalk_back": 3,
    "carrywalk_right": 3,
}
BLUE_KEY = {"samantha", "itzel"}  # el resto usa magenta


def semi_transparent_pct(rgba: np.ndarray, box: tuple[int, int, int, int]) -> float:
    x, y, w, h = box
    a = rgba[y:y + h, x:x + w, 3]
    if a.size == 0:
        return 100.0
    return float(100.0 * ((a > 10) & (a < 120)).sum() / a.size)


def compute_masks(alpha: np.ndarray, expected: int) -> tuple[list[np.ndarray], bool]:
    """Máscaras por pose, partiendo puentes si las poses se TOQUEN.

    La segmentación por componentes conexas fusiona poses que se rozan
    (la coleta de Samantha toca la pose vecina en run_front/run_right:
    salían 2 y 1 poses de 4). Si faltan componentes, se parte el
    componente más ancho por su columna más angosta (el puente entre
    poses tiene pocos píxeles sólidos) hasta llegar al conteo esperado
    o quedarnos sin puentes válidos. Devuelve (máscaras, hubo_corte).
    """
    from scipy import ndimage

    solid = alpha > 60
    labeled, n = ndimage.label(solid)
    if n == 0:
        return [], False
    areas = ndimage.sum(solid, labeled, range(1, n + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= 0.08 * float(areas.max())]
    masks = [labeled == lab for lab in keep]
    masks.sort(key=lambda m: float(np.where(m)[1].mean()))
    split = False
    guard = 0
    while len(masks) < expected and guard < expected * 2:
        guard += 1
        widths = []
        for m in masks:
            xs = np.where(m.any(axis=0))[0]
            widths.append(xs.max() - xs.min() if len(xs) else 0)
        idx = int(np.argmax(widths))
        m = masks[idx]
        ys, xs = np.where(m)
        x0, x1 = int(xs.min()), int(xs.max())
        w = x1 - x0
        if w < 40:
            break
        profile = m.sum(axis=0).astype(np.float32)
        lo = x0 + int(w * 0.2)
        hi = x1 - int(w * 0.2)
        if hi <= lo:
            break
        cut = lo + int(np.argmin(profile[lo:hi + 1]))
        # Puente válido: la columna de corte es angosta respecto a la pose.
        if profile[cut] > 0.35 * m.shape[0]:
            break
        left = m.copy()
        left[:, cut:] = False
        right = m.copy()
        right[:, :cut] = False
        if left.sum() < 200 or right.sum() < 200:
            break
        masks[idx:idx + 1] = [left, right]
        split = True
    # Limpieza post-corte: el puente puede dejar un fragmento de la pose
    # vecina (un puño, una punta de pelo) pegado a la máscara equivocada.
    # Cada pose es una sola masa: nos quedamos con su componente mayor.
    cleaned = []
    for m in masks:
        lab, cnt = ndimage.label(m)
        if cnt <= 1:
            cleaned.append(m)
            continue
        sizes = ndimage.sum(m, lab, range(1, cnt + 1))
        cleaned.append(lab == (int(np.argmax(sizes)) + 1))
    return cleaned, split


def boxes_from_masks(masks: list[np.ndarray], shape: tuple[int, int]) -> list[tuple[int, int, int, int]]:
    out = []
    for m in masks:
        ys, xs = np.where(m)
        if len(xs) == 0:
            continue
        pad = 2
        fx0, fy0 = max(0, int(xs.min()) - pad), max(0, int(ys.min()) - pad)
        fx1 = min(shape[1], int(xs.max()) + pad + 1)
        fy1 = min(shape[0], int(ys.max()) + pad + 1)
        if fx1 - fx0 >= 12:
            out.append((fx0, fy0, fx1 - fx0, fy1 - fy0))
    return out


def boxes_intrude(boxes: list[tuple[int, int, int, int]]) -> bool:
    for i, (x, y, w, h) in enumerate(boxes):
        for (ox, oy, ow, oh) in boxes[i + 1:]:
            if x < ox + ow and ox < x + w and y < oy + oh and oy < y + h:
                return True
    return False


def repack_masks(rgba: np.ndarray, masks: list[np.ndarray]) -> tuple[np.ndarray, list[tuple[int, int, int, int]]]:
    """Reempaqueta las poses con huecos garantizados: cada frame queda
    con SOLO los píxeles de su pose (sin fragmentos de la vecina dentro
    del bbox ni poses recortadas por el corte del puente). Cada pose
    conserva exactamente sus píxeles y su desplazamiento vertical."""
    gap = 10
    placed = []
    total_w = gap
    for m in masks:
        ys, xs = np.where(m)
        placed.append((m, int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
        total_w += int(xs.max()) - int(xs.min()) + 1 + gap
    canvas = np.zeros((rgba.shape[0], total_w, 4), dtype=np.uint8)
    boxes = []
    x = gap
    for m, x0, x1, y0, y1 in placed:
        w = x1 - x0 + 1
        region = rgba[y0:y1 + 1, x0:x1 + 1].copy()
        region[~m[y0:y1 + 1, x0:x1 + 1]] = 0
        canvas[y0:y1 + 1, x:x + w] = region
        boxes.append((x, y0, w, y1 - y0 + 1))
        x += w + gap
    return canvas, boxes


def process_strip(raw_path: Path, out_png: Path, key: str, expected: int) -> tuple[dict, list[float]]:
    img = np.asarray(Image.open(raw_path).convert("RGBA"))
    rgba = blue_alpha(img) if key == "blue" else magenta_alpha(img)
    masks, split = compute_masks(rgba[:, :, 3], expected)
    boxes = boxes_from_masks(masks, rgba.shape[:2])
    if split or len(boxes) != expected or boxes_intrude(boxes):
        if len(masks) == expected:
            # Hubo corte de puente o invasión: reempaquetar limpio.
            rgba, boxes = repack_masks(rgba, masks)
        else:
            # Respaldo histórico: reempaquetar si los bboxes se invaden.
            rgba = repack_if_intrusions(rgba)
            boxes = segment(rgba[:, :, 3])
    scale = min(1.0, MAX_STRIP_HEIGHT / rgba.shape[0])
    if scale < 1.0:
        new_size = (round(rgba.shape[1] * scale), round(rgba.shape[0] * scale))
        rgba = np.asarray(Image.fromarray(rgba, "RGBA").resize(new_size, Image.LANCZOS))
        boxes = [
            (round(x * scale), round(y * scale), round(w * scale), round(h * scale))
            for (x, y, w, h) in boxes
        ]
    Image.fromarray(rgba, "RGBA").save(out_png, optimize=True)
    pcts = [semi_transparent_pct(rgba, b) for b in boxes]
    entry = {
        "width": int(rgba.shape[1]),
        "height": int(rgba.shape[0]),
        "frames": [
            {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
            for (x, y, w, h) in boxes
        ],
    }
    return entry, pcts


def main() -> None:
    app = Path(__file__).resolve().parents[1]
    base = app / "src" / "assets" / "sprites" / "characters" / "defined"
    report: dict[str, dict] = {}
    # Filtro opcional por CLI: process_correccion2.py samantha
    only = [a for a in sys.argv[1:] if a in ROOMIES]
    targets = only if only else ROOMIES

    for rid in targets:
        cdir = base / rid
        raw_dir = cdir / "raw"
        key = "blue" if rid in BLUE_KEY else "magenta"
        manifest_path = cdir / "manifest.json"
        manifest: dict[str, dict] = {}
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        for anim, expected in NEW_ANIMS.items():
            raw = None
            for ext in ("webp", "png", "jpg"):
                cand = raw_dir / f"{anim}.{ext}"
                if cand.exists():
                    raw = cand
                    break
            if raw is None:
                report.setdefault(rid, {})[anim] = "FALTA strip crudo"
                continue
            entry, pcts = process_strip(raw, cdir / f"{anim}.png", key, expected)
            manifest[anim] = entry
            got = len(entry["frames"])
            worst = max(pcts) if pcts else 100.0
            status = "ok" if got == expected else f"SEGMENTADAS {got} (esperadas {expected})"
            if worst >= 1.5:
                status += f" | QC ALFA FALLO: peor frame {worst:.2f}% semitransparente"
            report.setdefault(rid, {})[anim] = (
                f"{status} | alfa semitransp. por frame: "
                + ", ".join(f"{p:.2f}%" for p in pcts)
            )

        # El idle nuevo (relajado, 2 frames) reemplaza al idle_front en T.
        if "idle" in manifest:
            manifest["idle_front"] = manifest["idle"]
        # Derivaciones que se mantienen de la primera corrección.
        if "walk_back" in manifest:
            manifest["idle_back"] = derive_frame(manifest["walk_back"], 0)
        if "walk_right" in manifest:
            manifest["idle_right"] = derive_frame(manifest["walk_right"], 0)

        manifest_path.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
        report.setdefault(rid, {})["_manifest"] = f"{len(manifest)} animaciones"

    generate_ts(base, app)
    print(json.dumps(report, indent=1, ensure_ascii=False))


ANIM_KEYS = [
    "idle_front", "idle_back", "idle_right", "walk_front", "walk_back",
    "walk_right", "run_front", "run_back", "run_right", "carried", "action",
    "carrywalk_front", "carrywalk_back", "carrywalk_right",
]
# Animación -> archivo PNG propio (si falta, se usa la imagen del alias).
FILE_FOR = {
    "idle_front": "idle",
    "idle_back": None,   # alias walk_back
    "idle_right": None,  # alias walk_right
    "run_front": "run_front",
    "run_back": "run_back",
}
ALIAS = {
    "idle_front": "walk_front",
    "idle_back": "walk_back",
    "idle_right": "walk_right",
    "run_front": "walk_front",
    "run_back": "walk_back",
}


def generate_ts(base: Path, app: Path) -> None:
    lines: list[str] = []
    lines.append("/**")
    lines.append(" * GENERADO por scripts/process_correccion2.py — no editar a mano.")
    lines.append(" * Bundles de sprites con DISEÑO DEFINIDO (correcciones de arte 1 y 2):")
    lines.append(" * una imagen por animación + manifest de frames irregulares.")
    lines.append(" */")
    lines.append("import type { DefinedSpriteBundle } from './definedSprites.data';")
    lines.append("")
    manifests: dict[str, dict] = {}
    for rid in ROOMIES + ["ximena"]:
        mj = base / rid / "manifest.json"
        if mj.exists():
            manifests[rid] = json.loads(mj.read_text(encoding="utf-8"))
    for rid, manifest in manifests.items():
        files = set()
        for anim in manifest:
            fname = FILE_FOR.get(anim, anim)
            if fname and (base / rid / f"{fname}.png").exists():
                files.add(fname)
        for fname in sorted(files):
            lines.append(
                f"import img_{rid}_{fname} from "
                f"'@/assets/sprites/characters/defined/{rid}/{fname}.png';"
            )
    lines.append("")
    lines.append("export const DEFINED_BUNDLES: Record<string, DefinedSpriteBundle> = {")
    for rid, manifest in manifests.items():
        if rid == "ximena":
            continue
        lines.append(f"  {rid}: {{")
        for anim in ANIM_KEYS:
            if anim not in manifest:
                continue
            fname = FILE_FOR.get(anim, anim)
            if fname and (base / rid / f"{fname}.png").exists():
                img_var = f"img_{rid}_{fname}"
            elif anim in ALIAS and (base / rid / f"{ALIAS[anim]}.png").exists():
                img_var = f"img_{rid}_{ALIAS[anim]}"
            else:
                continue
            entry = json.dumps(manifest[anim])
            lines.append(f"    {anim}: {{ image: {img_var}, entry: {entry} }},")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    xm = manifests.get("ximena", {})
    if "sleep" in xm and (base / "ximena" / "sleep.png").exists():
        lines.append(
            "export const XIMENA_SLEEP = { image: img_ximena_sleep, entry: "
            + json.dumps(xm["sleep"]) + " };"
        )
    out = app / "src" / "data" / "characters" / "definedSprites.generated.ts"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"TS generado: {out} ({len(manifests)} personajes)")


if __name__ == "__main__":
    main()
