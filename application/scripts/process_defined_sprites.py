#!/usr/bin/env python3
"""
Procesa los strips generados (fondo magenta #FF00FF) del set de sprites con
DISEÑO DEFINIDO (corrección de arte): clave magenta -> alfa, segmentación de
poses por COMPONENTES CONEXAS del alfa (la proyección por columnas fusionaba
poses vecinas con las manos a la misma altura), bounding box por pose,
manifests y el archivo TS de bundles que consume el juego.

Entradas (por personaje, en src/assets/sprites/characters/defined/<id>/):
  raw/<anim>.webp|png   strips crudos: walk_front(4), walk_back(3),
                        walk_right(3), run_right(4), carried(2), action(2)
  idle_front.png        idle extraído del draft (extract_idle_from_drafts.py)
  ximena/raw/sleep.webp strip especial de Ximena durmiendo (3 poses)

Salidas:
  <id>/<anim>.png       strip con alfa (mismo lienzo que el crudo)
  <id>/manifest.json    {anim: {width, height, frames:[{x,y,width,height}]}}
  src/data/characters/definedSprites.generated.ts  (bundles tipados)

Derivaciones documentadas:
  run_front = walk_front (el estado run ya acelera frames y aumenta el bob)
  run_back  = walk_back  (idem)
  idle_back = frame 0 de walk_back; idle_right = frame 0 de walk_right
  izquierda = espejo de derecha en tiempo de render (flipH), como en Fase 1.

Si falta un strip o la segmentación no encuentra las poses esperadas, se
reporta y ese personaje queda con lo que haya (integridad la verifican los
tests de bundles); las poses de un strip con conteo distinto se aceptan tal
cual segmentadas.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

EXPECTED = {
    "walk_front": 4, "walk_back": 3, "walk_right": 3,
    "run_right": 4, "carried": 2, "action": 2,
}
ROOMIES = ["natalia", "saulo", "itzel", "fatima", "samantha", "majo", "alan"]
MIN_GAP = 6  # columnas vacías mínimas que separan dos poses


def magenta_alpha(img: np.ndarray) -> np.ndarray:
    """RGBA con alfa según 'magentez'; despill básico en bordes."""
    rgb = img[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    # Magenta puro: R y B altos, G bajo. La fuerza define el alfa.
    strength = np.minimum(r, b) - g  # alto en magenta, ~0 o negativo en personaje
    alpha = np.clip(255.0 - (strength - 40.0) * 2.2, 0, 255)
    alpha[(r < 120) | (b < 120)] = 255.0  # píxeles oscuros nunca son fondo
    out = np.dstack([img[:, :, :3], alpha.astype(np.uint8)])
    # Despill: donde el alfa es parcial, reduce el tinte magenta.
    partial = (alpha > 0) & (alpha < 255)
    if partial.any():
        px = out[:, :, :3].astype(np.float32)
        a = (alpha / 255.0)[:, :, None]
        bg = np.array([255.0, 0.0, 255.0])
        px[partial] = np.clip(
            (px[partial] - (1 - a[partial]) * bg) / np.maximum(a[partial], 0.05), 0, 255
        )
        out[:, :, :3] = px.astype(np.uint8)
    return out


def segment(alpha: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Bboxes (x, y, w, h) de cada pose por componentes conexas del alfa.

    Cada pose es una componente (nunca se tocan: siempre hay magenta entre
    ellas). Se descartan componentes con área < 8% de la mayor (ruido de
    clave) y se ordena por centro-x.
    """
    from scipy import ndimage

    solid = alpha > 60
    labeled, n = ndimage.label(solid)
    if n == 0:
        return []
    areas = ndimage.sum(solid, labeled, range(1, n + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= 0.08 * float(areas.max())]
    found = []
    for lab in keep:
        ys, xs = np.where(labeled == lab)
        found.append((float(xs.mean()), int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    found.sort(key=lambda t: t[0])
    boxes = []
    for _, x0, y0, x1, y1 in found:
        pad = 2
        fx0, fy0 = max(0, x0 - pad), max(0, y0 - pad)
        fx1 = min(alpha.shape[1], x1 + pad + 1)
        fy1 = min(alpha.shape[0], y1 + pad + 1)
        if fx1 - fx0 >= 12:
            boxes.append((fx0, fy0, fx1 - fx0, fy1 - fy0))
    return boxes


MAX_STRIP_HEIGHT = 640  # los crudos vienen a ~1120px; el juego muestra <=400px
MAX_IDLE_HEIGHT = 720


def process_strip(raw_path: Path, out_png: Path) -> dict:
    img = np.asarray(Image.open(raw_path).convert("RGBA"))
    rgba = magenta_alpha(img)
    boxes = segment(rgba[:, :, 3])
    # Reescalado a tamaño de runtime (los frames se escalan en proporción).
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


def shrink_idle(idle_png: Path) -> None:
    """El idle extraído del draft viene a ~1650px de alto: se reduce al
    tamaño de runtime y se guarda optimizado (sobreescribe el PNG)."""
    with Image.open(idle_png) as im:
        if im.height <= MAX_IDLE_HEIGHT:
            return
        scale = MAX_IDLE_HEIGHT / im.height
        im = im.resize((round(im.width * scale), MAX_IDLE_HEIGHT), Image.LANCZOS)
        im.save(idle_png, optimize=True)


def single_frame_entry(png_path: Path) -> dict:
    with Image.open(png_path) as im:
        w, h = im.size
    return {"width": w, "height": h, "frames": [{"x": 0, "y": 0, "width": w, "height": h}]}


def derive_frame(entry: dict, idx: int = 0) -> dict:
    return {"width": entry["width"], "height": entry["height"], "frames": [entry["frames"][idx]]}


def main() -> None:
    app = Path(__file__).resolve().parents[1]
    base = app / "src" / "assets" / "sprites" / "characters" / "defined"
    report: dict[str, dict] = {}

    for rid in ROOMIES + ["ximena"]:
        cdir = base / rid
        raw_dir = cdir / "raw"
        manifest: dict[str, dict] = {}
        anims = ["sleep"] if rid == "ximena" else list(EXPECTED.keys())
        for anim in anims:
            raw = None
            for ext in ("webp", "png", "jpg"):
                cand = raw_dir / f"{anim}.{ext}"
                if cand.exists():
                    raw = cand
                    break
            if raw is None:
                report.setdefault(rid, {})[anim] = "FALTA strip crudo"
                continue
            entry = process_strip(raw, cdir / f"{anim}.png")
            manifest[anim] = entry
            expected = 3 if anim == "sleep" else EXPECTED[anim]
            got = len(entry["frames"])
            status = "ok" if got == expected else f"SEGMENTADAS {got} poses (esperadas {expected})"
            report.setdefault(rid, {})[anim] = status
        if rid != "ximena":
            # Idle frontal extraído del draft
            idle_png = cdir / "idle_front.png"
            if idle_png.exists():
                shrink_idle(idle_png)
                manifest["idle_front"] = single_frame_entry(idle_png)
            elif "walk_front" in manifest:
                manifest["idle_front"] = derive_frame(manifest["walk_front"], 0)
                report[rid]["idle_front"] = "derivado de walk_front[0] (sin extracción)"
            # Derivaciones documentadas
            if "walk_back" in manifest:
                manifest["idle_back"] = derive_frame(manifest["walk_back"], 0)
                manifest["run_back"] = manifest["walk_back"]
            if "walk_right" in manifest:
                manifest["idle_right"] = derive_frame(manifest["walk_right"], 0)
            if "walk_front" in manifest:
                manifest["run_front"] = manifest["walk_front"]
        (cdir / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
        report.setdefault(rid, {})["_manifest"] = f"{len(manifest)} animaciones"

    generate_ts(base, app)
    print(json.dumps(report, indent=1, ensure_ascii=False))


ANIM_KEYS = [
    "idle_front", "idle_back", "idle_right", "walk_front", "walk_back",
    "walk_right", "run_front", "run_back", "run_right", "carried", "action",
]


def generate_ts(base: Path, app: Path) -> None:
    """Genera definedSprites.generated.ts con imports de PNG + manifests."""
    lines: list[str] = []
    lines.append("/**")
    lines.append(" * GENERADO por scripts/process_defined_sprites.py — no editar a mano.")
    lines.append(" * Bundles de sprites con DISEÑO DEFINIDO (corrección de arte): una")
    lines.append(" * imagen por animación (como el set histórico de Ximena) + manifest")
    lines.append(" * de frames irregulares segmentados del strip.")
    lines.append(" */")
    lines.append("import type { DefinedSpriteBundle } from './definedSprites.data';")
    lines.append("")
    manifests: dict[str, dict] = {}
    for rid in ROOMIES + ["ximena"]:
        mj = base / rid / "manifest.json"
        if mj.exists():
            manifests[rid] = json.loads(mj.read_text(encoding="utf-8"))
    for rid, manifest in manifests.items():
        for anim in manifest:
            if (base / rid / f"{anim}.png").exists():
                var = f"img_{rid}_{anim}"
                lines.append(
                    f"import {var} from '@/assets/sprites/characters/defined/{rid}/{anim}.png';"
                )
    lines.append("")
    lines.append("export const DEFINED_BUNDLES: Record<string, DefinedSpriteBundle> = {")
    for rid, manifest in manifests.items():
        if rid == "ximena":
            continue
        lines.append(f"  {rid}: {{")
        # Las animaciones derivadas comparten la imagen de su animación origen.
        ALIAS = {
            "idle_front": "walk_front", "idle_back": "walk_back",
            "idle_right": "walk_right", "run_front": "walk_front",
            "run_back": "walk_back",
        }
        for anim in ANIM_KEYS:
            if anim not in manifest:
                continue
            if (base / rid / f"{anim}.png").exists():
                img_var = f"img_{rid}_{anim}"
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
