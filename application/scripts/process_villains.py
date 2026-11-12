#!/usr/bin/env python3
"""
Fase 4 — procesa los strips de los VILLANOS (Jose y su gato calicó).

Claves (lección Samantha: la clave NUNCA coincide con un color firma):
  Jose -> magenta #FF00FF (magenta_alpha de process_defined_sprites.py)
  Gato -> azul    #0000FF (blue_alpha de process_samantha_blue.py; su pelaje
          es blanco/naranja/tabby, sin azul — su ojo es verde menta, no azul)

Reutiliza del pipeline de la corrección de arte 2 (process_correccion2.py):
  compute_masks (corte de puentes si dos poses se tocan), boxes_from_masks,
  boxes_intrude, repack_masks y semi_transparent_pct (QC de alfa).

Diferencia propia de los villanos — AGRUPACIÓN DE COMPONENTES SUELTAS:
  algunas poses traen piezas DESPEGADAS del cuerpo que la segmentación por
  componentes conexas contaría como poses extra: el GLOBO de `sneak` de Jose
  (cuelga de su cuerda, sin tocarlo) y la COLA separada del gato en `idle`.
  compute_pose_masks() junta las componentes ordenadas por centro-x en
  `expected` grupos contiguos cortando por los huecos horizontales MÁS
  GRANDES entre componentes vecinas (el hueco entre poses siempre es mayor
  que el hueco entre una pose y su pieza suelta). Las componentes con área
  < 2% de la mayor se descartan como ruido (p. ej. las gotitas de sudor
  despegadas de `pounce` del gato). Si faltan componentes (poses pegadas),
  se delega al corte de puentes de compute_masks.

Entradas:
  src/assets/sprites/characters/villains/jose/raw/<anim>.webp
    idle(2), walk_right(3), sneak(2), celebrate(2)   — fondo magenta
  src/assets/sprites/characters/villains/gato/raw/<anim>.webp
    idle(2), prowl(3), pounce(2)                     — fondo azul

Salidas:
  villains/<id>/<anim>.png + villains/<id>/manifest.json
  src/data/characters/villainSprites.data.ts
    (JOSE_SPRITES / CAT_SPRITES tipados; ver la decisión de espejo del
    gato documentada en el encabezado de ese archivo: el gato NO se
    espeja nunca — su mancha calicó debe quedar siempre en su cachete
    izquierdo — y Jose SÍ puede espejarse)

QC integrado: por cada frame procesado mide el % de píxeles
semitransparentes (alfa 10-120) dentro de su bbox; objetivo < 1.5%.
El reporte JSON se imprime al final.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from process_correccion2 import (  # noqa: E402
    boxes_from_masks,
    boxes_intrude,
    compute_masks,
    repack_masks,
    semi_transparent_pct,
)
from process_defined_sprites import MAX_STRIP_HEIGHT, magenta_alpha, segment  # noqa: E402
from process_samantha_blue import blue_alpha, repack_if_intrusions  # noqa: E402

VILLAINS = {
    "jose": {
        "key": "magenta",
        "anims": {"idle": 2, "walk_right": 3, "sneak": 2, "celebrate": 2},
    },
    "gato": {
        "key": "blue",
        "anims": {"idle": 2, "prowl": 3, "pounce": 2},
    },
}
MIN_COMPONENT_RATIO = 0.02  # componentes < 2% de la mayor = ruido/pieza ínfima


def compute_pose_masks(
    alpha: np.ndarray, expected: int
) -> tuple[list[np.ndarray], bool]:
    """Máscaras por pose agrupando componentes sueltas (globo, cola).

    Devuelve (máscaras, hubo_agrupación_o_corte). Si hay MENOS componentes
    que poses esperadas, las poses están pegadas: delega en el corte de
    puentes de process_correccion2.compute_masks.
    """
    from scipy import ndimage

    solid = alpha > 60
    labeled, n = ndimage.label(solid)
    if n == 0:
        return [], False
    areas = ndimage.sum(solid, labeled, range(1, n + 1))
    keep = [
        i + 1 for i, a in enumerate(areas) if a >= MIN_COMPONENT_RATIO * float(areas.max())
    ]
    comps = []
    for lab in keep:
        ys, xs = np.where(labeled == lab)
        comps.append({
            "mask": labeled == lab,
            "cx": float(xs.mean()),
            "x0": int(xs.min()), "x1": int(xs.max()),
        })
    comps.sort(key=lambda c: c["cx"])
    if len(comps) < expected:
        return compute_masks(alpha, expected)
    if len(comps) == expected:
        return [c["mask"] for c in comps], False
    # Sobran componentes: partir la lista ordenada en `expected` grupos
    # contiguos cortando por los (expected - 1) huecos horizontales mayores.
    gaps = [
        (comps[i + 1]["x0"] - comps[i]["x1"], i) for i in range(len(comps) - 1)
    ]
    cuts = sorted(i for _, i in sorted(gaps, reverse=True)[: expected - 1])
    groups: list[list[dict]] = []
    start = 0
    for cut in cuts:
        groups.append(comps[start:cut + 1])
        start = cut + 1
    groups.append(comps[start:])
    masks = []
    for group in groups:
        merged = np.zeros(alpha.shape, dtype=bool)
        for c in group:
            merged |= c["mask"]
        masks.append(merged)
    return masks, True


def process_strip(
    raw_path: Path, out_png: Path, key: str, expected: int
) -> tuple[dict, list[float]]:
    img = np.asarray(Image.open(raw_path).convert("RGBA"))
    rgba = blue_alpha(img) if key == "blue" else magenta_alpha(img)
    masks, regrouped = compute_pose_masks(rgba[:, :, 3], expected)
    boxes = boxes_from_masks(masks, rgba.shape[:2])
    if regrouped or len(boxes) != expected or boxes_intrude(boxes):
        if len(masks) == expected:
            rgba, boxes = repack_masks(rgba, masks)
        else:
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


def generate_ts(base: Path, app: Path, manifests: dict[str, dict]) -> None:
    """Genera villainSprites.data.ts con imports de PNG + manifests."""
    lines: list[str] = []
    lines.append("/**")
    lines.append(" * GENERADO por scripts/process_villains.py — no editar a mano.")
    lines.append(" * Sprites de los VILLANOS de la Fase 4: Jose y su gato calicó,")
    lines.append(" * cómplices cuyo plan rival es despertar a Ximena para llevarla")
    lines.append(" * ELLOS a darle el mejor cumpleaños. Mismo formato que los")
    lines.append(" * bundles definidos de los roomies: una imagen por animación")
    lines.append(" * + manifest de frames irregulares segmentados del strip.")
    lines.append(" *")
    lines.append(" * DECISIÓN DE ESPEJO (Fase 4, innegociable):")
    lines.append(" * - EL GATO NO SE ESPEJA NUNCA en runtime. Su rasgo de identidad")
    lines.append(" *   es la mancha naranja/crema en su CACHETE IZQUIERDO anatómico;")
    lines.append(" *   un flipH la pasaría al cachete derecho y dejaría de ser él.")
    lines.append(" *   Sus strips de perfil (prowl) miran a la DERECHA y se usan")
    lines.append(" *   tal cual en todas las direcciones; si el gameplay necesita")
    lines.append(" *   que se desplace a la izquierda, se mueve con el sprite de")
    lines.append(" *   perfil derecho sin espejar (o se rota/traslada, nunca flipH).")
    lines.append(" * - JOSE SÍ PUEDE ESPEJARSE: no tiene rasgos asimétricos (camisa")
    lines.append(" *   verde a rayas simétrica, lentes redondos, audífonos con cable")
    lines.append(" *   a ambos lados); su walk_right se espeja para caminar a la")
    lines.append(" *   izquierda como con los roomies.")
    lines.append(" */")
    lines.append("import type { DefinedSpriteAnim } from '@/types/sprite.types';")
    lines.append("")
    for vid, manifest in manifests.items():
        for anim in manifest:
            if (base / vid / f"{anim}.png").exists():
                lines.append(
                    f"import img_{vid}_{anim} from "
                    f"'@/assets/sprites/characters/villains/{vid}/{anim}.png';"
                )
    lines.append("")
    lines.append("export type JoseAnimKey = 'idle' | 'walk_right' | 'sneak' | 'celebrate';")
    lines.append("export type CatAnimKey = 'idle' | 'prowl' | 'pounce';")
    lines.append("")
    for vid, const_name, type_name in (
        ("jose", "JOSE_SPRITES", "JoseAnimKey"),
        ("gato", "CAT_SPRITES", "CatAnimKey"),
    ):
        manifest = manifests.get(vid, {})
        lines.append(
            f"export const {const_name}: Record<{type_name}, DefinedSpriteAnim> = {{"
        )
        for anim, entry in manifest.items():
            lines.append(
                f"  {anim}: {{ image: img_{vid}_{anim}, entry: {json.dumps(entry)} }},"
            )
        lines.append("};")
        lines.append("")
    out = app / "src" / "data" / "characters" / "villainSprites.data.ts"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"TS generado: {out}")


def main() -> None:
    app = Path(__file__).resolve().parents[1]
    base = app / "src" / "assets" / "sprites" / "characters" / "villains"
    report: dict[str, dict] = {}
    manifests: dict[str, dict] = {}
    # Filtro opcional por CLI: process_villains.py jose | gato
    only = [a for a in sys.argv[1:] if a in VILLAINS]
    targets = only if only else list(VILLAINS.keys())

    for vid in targets:
        spec = VILLAINS[vid]
        cdir = base / vid
        raw_dir = cdir / "raw"
        manifest: dict[str, dict] = {}
        for anim, expected in spec["anims"].items():
            raw = None
            for ext in ("webp", "png", "jpg"):
                cand = raw_dir / f"{anim}.{ext}"
                if cand.exists():
                    raw = cand
                    break
            if raw is None:
                report.setdefault(vid, {})[anim] = "FALTA strip crudo"
                continue
            entry, pcts = process_strip(raw, cdir / f"{anim}.png", spec["key"], expected)
            manifest[anim] = entry
            got = len(entry["frames"])
            worst = max(pcts) if pcts else 100.0
            status = "ok" if got == expected else f"SEGMENTADAS {got} (esperadas {expected})"
            if worst >= 1.5:
                status += f" | QC ALFA FALLO: peor frame {worst:.2f}% semitransparente"
            report.setdefault(vid, {})[anim] = (
                f"{status} | alfa semitransp. por frame: "
                + ", ".join(f"{p:.2f}%" for p in pcts)
            )
        (cdir / "manifest.json").write_text(
            json.dumps(manifest, indent=1), encoding="utf-8"
        )
        manifests[vid] = manifest
        report.setdefault(vid, {})["_manifest"] = f"{len(manifest)} animaciones"

    if not only:
        generate_ts(base, app, manifests)
    print(json.dumps(report, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
