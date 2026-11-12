#!/usr/bin/env python3
"""
Extrae el idle frontal de cada roomie desde su draft v1.2 (assets/drafts).

Los drafts traen fondo de DAMERO (dos grises en patrón regular), que NO es
transparencia. Enfoque (v2, vectorizado):
  1. Candidato a fondo = píxel "gris damero": baja saturación (max-min RGB
     pequeño) y luminancia > 25 (el contorno del personaje es negro casi
     puro y actúa de barrera; los grises INTERIORES del diseño quedan
     encerrados y no se alcanzan).
  2. Componentes del candidato que tocan el borde = fondo real (el contorno
     es negro grueso de pixel art: el candidato no lo cruza; una erosión
     previa fragmentaba el damero oscuro en islas y se descartó).
  3. Personaje = resto; se conserva solo su componente mayor y se rellenan
     sus huecos interiores.
Verificación de cordura: la fracción opaca final debe estar en 0.05-0.32
(un chibi centrado en un lienzo 2048x2048); fuera de rango se reporta y no
se escribe el archivo (el procesador puede derivar idle de walk_front[0]).

Salida: src/assets/sprites/characters/defined/<id>/idle_front.png
Uso: python3 scripts/extract_idle_from_drafts.py [repo_root]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOMIES = ["natalia", "saulo", "itzel", "fatima", "samantha", "majo", "alan"]
DRAFT_NAMES = {
    "natalia": "Natalia", "saulo": "Saulo", "itzel": "Itzel", "fatima": "Fatima",
    "samantha": "Samantha", "majo": "Majo", "alan": "Alan",
}


TARGET_FRAC = 0.235  # los 7 chibi ocupan ~0.21-0.26 del lienzo


def _border_background(free: np.ndarray) -> np.ndarray:
    labeled, _ = ndimage.label(free)
    border_labels = set(np.unique(np.concatenate([
        labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]
    ]))) - {0}
    return np.isin(labeled, list(border_labels))


def _clean(character: np.ndarray) -> np.ndarray:
    character = ndimage.binary_fill_holes(character)
    labeled_c, n_c = ndimage.label(character)
    if n_c > 1:
        sizes = ndimage.sum(character, labeled_c, range(1, n_c + 1))
        character = labeled_c == (int(np.argmax(sizes)) + 1)
        character = ndimage.binary_fill_holes(character)
    return character


def _method_flood(rgb: np.ndarray) -> np.ndarray:
    """Flood por candidato 'gris damero' (sat<34, lum>14). Falla si la ropa
    es blanca/gris/negra suave: el relleno cruza el contorno JPEG y se la come."""
    saturation = rgb.max(axis=2) - rgb.min(axis=2)
    luminance = rgb.mean(axis=2)
    candidate = (saturation < 34) & (luminance > 14)
    return _clean(~_border_background(candidate))


def _method_seal(rgb: np.ndarray) -> np.ndarray:
    """Sello de contorno: barrera de negro casi puro (lum<13, excluye la
    celda oscura del damero ~20) dilatada 2px; el fondo es lo alcanzable
    sin cruzar el sello. Falla si el contorno tiene cabellos muy finos."""
    luminance = rgb.mean(axis=2)
    seal = ndimage.binary_dilation(luminance < 13, iterations=2)
    return _clean(~_border_background(~seal))


def extract(draft_path: Path, out_path: Path) -> dict:
    rgb = np.asarray(Image.open(draft_path).convert("RGB")).astype(np.int32)
    h, w, _ = rgb.shape
    flood = _method_flood(rgb)
    seal = _method_seal(rgb)
    options = []
    # 'union' rescata personajes donde flood se come la ropa oscura y seal
    # fragmenta (Samantha): flood aporta cabeza/torso, seal pelo y piernas.
    for name, mask in (("flood", flood), ("seal", seal), ("union", _clean(flood | seal))):
        options.append((abs(float(mask.mean()) - TARGET_FRAC), name, mask))
    options.sort(key=lambda t: t[0])
    _, method, character = options[0]
    frac = float(character.mean())
    if not (0.15 < frac < 0.32):
        return {"ok": False, "reason": f"ningún método en rango (mejor {method}: {frac:.3f})"}

    alpha = np.where(character, 255, 0).astype(np.uint8)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    ys, xs = np.where(character)
    pad = 6
    y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + pad + 1)
    out = Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path)
    return {"ok": True, "size": out.size, "opaque_frac": round(frac, 3), "method": method}


def main() -> None:
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
    drafts = repo / "assets" / "drafts" / "v1.2"
    defined = repo / "application" / "src" / "assets" / "sprites" / "characters" / "defined"
    for rid in ROOMIES:
        draft = drafts / f"{DRAFT_NAMES[rid]}.jpg"
        out = defined / rid / "idle_front.png"
        print(f"{rid}: {extract(draft, out)}")


if __name__ == "__main__":
    main()
