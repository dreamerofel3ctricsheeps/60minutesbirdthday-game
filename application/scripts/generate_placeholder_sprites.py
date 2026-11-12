#!/usr/bin/env python3
"""
Genera las hojas de sprites PLACEHOLDER (pixel art puro, grid 64x64) de los
7 roomies jugables de "1 Minuto para la Fiesta".

Layout de cada hoja (512x192 = 8 columnas x 3 filas de 64x64):
  Fila 0: FRENTE  (mirando a cámara)
  Fila 1: ESPALDA (alejándose de cámara)
  Fila 2: LATERAL (perfil derecho; el izquierdo se espeja en runtime)
  Columnas: [0]=idle, [1..3]=walk (3 frames), [4..7]=run (4 frames)

Es el mismo estándar que describe el GDD
(gdd/characters/mapeo_de_sprites_y_animaciones.md) y que consume
src/data/characters/roomieSprites.data.ts (manifest calculado desde el grid).

Uso:  python3 scripts/generate_placeholder_sprites.py
Salida: src/assets/sprites/characters/placeholders/<personaje>.png
"""
from PIL import Image, ImageDraw
import os

FRAME = 64
COLS = 8
ROWS = 3

OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "src", "assets", "sprites", "characters", "placeholders",
)

# Paletas por personaje según gdd/characters/personajes_y_caracter_sticas.md
CHARACTERS = {
    # Natalia: tonos deportivos vibrantes (neón, azul eléctrico, gris oscuro)
    "natalia": dict(skin="#F2C29B", hair="#2E1B10", hair_extra="#2E1B10",
                    shirt="#39E75F", accent="#B6FF2E", pants="#2456E6",
                    shoes="#F5E663", style="ponytail"),
    # Saulo: tonos cálidos y bohemios (terracota, ocre, marrón, verde olivo)
    "saulo": dict(skin="#D9A066", hair="#17110B", hair_extra="#17110B",
                  shirt="#C96F4A", accent="#8A5A2B", pants="#A97B2F",
                  shoes="#5C4633", style="messy"),
    # Itzel: pasteles contrastados con oscuros (rosa pastel, morado lavanda, negro)
    "itzel": dict(skin="#F6CFB2", hair="#241A2E", hair_extra="#241A2E",
                  shirt="#F6B8D0", accent="#8E7CC3", pants="#3A3348",
                  shoes="#241A2E", style="twintails"),
    # Fátima: limpios y hogareños (blanco, rojo cuadros vichy, beige)
    "fatima": dict(skin="#C68863", hair="#3A2410", hair_extra="#3A2410",
                   shirt="#F2F2F2", accent="#D23B3B", pants="#CBB489",
                   shoes="#5A4632", style="bun_apron"),
    # Samantha: modernos y llamativos (magenta, blanco perla, negro, dorado sutil)
    "samantha": dict(skin="#F2C29B", hair="#E8C86A", hair_extra="#C9A227",
                     shirt="#E63FA0", accent="#F2D16B", pants="#EDEDF2",
                     shoes="#1C1C22", style="long"),
    # Majo: sobrios y profesionales (azul marino, gris plomo, blanco formal)
    "majo": dict(skin="#E8B48C", hair="#101014", hair_extra="#101014",
                 shirt="#22365E", accent="#EDEDF2", pants="#6B7280",
                 shoes="#23232A", style="bun"),
    # Alan: oscuros y urbanos (negro, verde militar, acentos amarillo neón)
    "alan": dict(skin="#D9A066", hair="#0E0E12", hair_extra="#0E0E12",
                 shirt="#1F2430", accent="#D8E63F", pants="#4B5D3A",
                 shoes="#101014", style="headphones"),
}


def rect(d, x0, y0, x1, y1, color):
    d.rectangle([x0, y0, x1, y1], fill=color)


def draw_character(d, pal, ox, oy, direction, state, frame):
    """Dibuja un chibi de 64x64 con origen en (ox, oy).
    direction: 'front' | 'back' | 'side'. state: 'idle'|'walk'|'run'.
    frame: índice dentro del ciclo (walk 0-2, run 0-3)."""
    skin, hair = pal["skin"], pal["hair"]
    shirt, accent, pants, shoes = pal["shirt"], pal["accent"], pal["pants"], pal["shoes"]
    style = pal["style"]

    # --- ciclo de piernas / brazos ---
    # fases: desplazamiento horizontal de cada pierna respecto al centro
    if state == "walk":
        phase = [(0, 0), (-3, 3), (0, 0)][frame]          # izq, der
        arm_swing = [0, 2, 0][frame]
        bob = [0, 1, 0][frame]
    elif state == "run":
        phase = [(-5, 5), (-2, 2), (5, -5), (2, -2)][frame]
        arm_swing = [3, 1, 3, 1][frame]
        bob = [1, 0, 1, 0][frame]
    else:
        phase, arm_swing, bob = (0, 0), 0, 0
    oy += bob

    cx = 32  # centro del frame
    leg_y, shoe_y = 48, 57

    if direction in ("front", "back"):
        # piernas (separadas, la fase mueve los pies)
        rect(d, ox + cx - 9 + phase[0], oy + leg_y, ox + cx - 3 + phase[0], oy + shoe_y - 1, pants)
        rect(d, ox + cx + 3 + phase[1], oy + leg_y, ox + cx + 9 + phase[1], oy + shoe_y - 1, pants)
        # zapatos
        rect(d, ox + cx - 10 + phase[0], oy + shoe_y, ox + cx - 2 + phase[0], oy + 60, shoes)
        rect(d, ox + cx + 2 + phase[1], oy + shoe_y, ox + cx + 10 + phase[1], oy + 60, shoes)
        # torso
        rect(d, ox + cx - 11, oy + 33, ox + cx + 11, oy + leg_y, shirt)
        if style == "bun_apron" and direction == "front":
            rect(d, ox + cx - 7, oy + 35, ox + cx + 7, oy + leg_y - 2, accent)  # delantal vichy
        if direction == "front":
            rect(d, ox + cx - 3, oy + 35, ox + cx + 3, oy + 38, accent)  # detalle de cuello/logo
        # brazos (balanceo contrario a las piernas)
        rect(d, ox + cx - 15, oy + 34 + arm_swing, ox + cx - 11, oy + 46 + arm_swing, shirt)
        rect(d, ox + cx - 15, oy + 46 + arm_swing, ox + cx - 11, oy + 49 + arm_swing, skin)
        rect(d, ox + cx + 11, oy + 34 - arm_swing, ox + cx + 15, oy + 46 - arm_swing, shirt)
        rect(d, ox + cx + 11, oy + 46 - arm_swing, ox + cx + 15, oy + 49 - arm_swing, skin)
        # cabeza (chibi: grande)
        rect(d, ox + cx - 11, oy + 10, ox + cx + 11, oy + 32, skin)
        # cabello
        rect(d, ox + cx - 12, oy + 5, ox + cx + 12, oy + 13, hair)
        if direction == "back":
            rect(d, ox + cx - 12, oy + 13, ox + cx + 12, oy + 30, hair)  # nuca cubierta
        else:
            rect(d, ox + cx - 12, oy + 13, ox + cx - 10, oy + 22, hair)  # mechones laterales
            rect(d, ox + cx + 10, oy + 13, ox + cx + 12, oy + 22, hair)
            # ojos + boca (solo frente)
            rect(d, ox + cx - 7, oy + 20, ox + cx - 4, oy + 24, "#14100C")
            rect(d, ox + cx + 4, oy + 20, ox + cx + 7, oy + 24, "#14100C")
            rect(d, ox + cx - 1, oy + 28, ox + cx + 2, oy + 29, "#8A4B3A")
        # estilos de cabello / accesorios
        if style == "ponytail":
            rect(d, ox + cx + 12, oy + 8, ox + cx + 16, oy + 24, hair)
        elif style == "twintails":
            rect(d, ox + cx - 17, oy + 12, ox + cx - 12, oy + 30, hair)
            rect(d, ox + cx + 12, oy + 12, ox + cx + 17, oy + 30, hair)
        elif style in ("bun", "bun_apron"):
            rect(d, ox + cx - 4, oy + 1, ox + cx + 4, oy + 6, hair)
        elif style == "long":
            rect(d, ox + cx - 14, oy + 13, ox + cx - 11, oy + 34, hair)
            rect(d, ox + cx + 11, oy + 13, ox + cx + 14, oy + 34, hair)
        elif style == "messy":
            rect(d, ox + cx - 13, oy + 3, ox + cx - 8, oy + 8, hair)
            rect(d, ox + cx + 6, oy + 2, ox + cx + 12, oy + 8, hair)
        elif style == "headphones":
            rect(d, ox + cx - 14, oy + 16, ox + cx - 11, oy + 24, "#101014")
            rect(d, ox + cx + 11, oy + 16, ox + cx + 14, oy + 24, "#101014")
            rect(d, ox + cx - 14, oy + 16, ox + cx - 11, oy + 19, accent)
            rect(d, ox + cx + 11, oy + 16, ox + cx + 14, oy + 19, accent)
    else:  # side (perfil derecho)
        # piernas en perfil: una delante, otra detrás según fase
        rect(d, ox + cx - 4 + phase[0], oy + leg_y, ox + cx + 1 + phase[0], oy + shoe_y - 1, pants)
        rect(d, ox + cx - 2 + phase[1], oy + leg_y, ox + cx + 3 + phase[1], oy + shoe_y - 1, pants)
        rect(d, ox + cx - 5 + phase[0], oy + shoe_y, ox + cx + 2 + phase[0], oy + 60, shoes)
        rect(d, ox + cx - 3 + phase[1], oy + shoe_y, ox + cx + 4 + phase[1], oy + 60, shoes)
        # torso en perfil (más angosto)
        rect(d, ox + cx - 7, oy + 33, ox + cx + 8, oy + leg_y, shirt)
        # brazo visible
        rect(d, ox + cx + 1, oy + 34 + arm_swing, ox + cx + 5, oy + 46 + arm_swing, shirt)
        rect(d, ox + cx + 1, oy + 46 + arm_swing, ox + cx + 5, oy + 49 + arm_swing, skin)
        # cabeza en perfil: cara hacia +x, cabello detrás
        rect(d, ox + cx - 9, oy + 10, ox + cx + 11, oy + 32, skin)
        rect(d, ox + cx - 10, oy + 5, ox + cx + 11, oy + 13, hair)
        rect(d, ox + cx - 10, oy + 13, ox + cx - 4, oy + 28, hair)   # parte trasera
        rect(d, ox + cx + 6, oy + 20, ox + cx + 9, oy + 24, "#14100C")  # ojo
        rect(d, ox + cx + 9, oy + 27, ox + cx + 12, oy + 29, skin)      # nariz
        if style == "ponytail":
            rect(d, ox + cx - 15, oy + 8, ox + cx - 10, oy + 24, hair)
        elif style == "twintails":
            rect(d, ox + cx - 16, oy + 12, ox + cx - 10, oy + 30, hair)
        elif style in ("bun", "bun_apron"):
            rect(d, ox + cx - 6, oy + 1, ox + cx + 1, oy + 6, hair)
        elif style == "long":
            rect(d, ox + cx - 12, oy + 13, ox + cx - 9, oy + 34, hair)
        elif style == "headphones":
            rect(d, ox + cx - 6, oy + 16, ox + cx - 2, oy + 24, "#101014")
            rect(d, ox + cx - 6, oy + 16, ox + cx - 2, oy + 19, accent)


def build_sheet(pal):
    img = Image.new("RGBA", (FRAME * COLS, FRAME * ROWS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rows = [("front", 0), ("back", 1), ("side", 2)]
    for direction, row in rows:
        # col 0: idle | cols 1-3: walk | cols 4-7: run
        draw_character(d, pal, 0, row * FRAME, direction, "idle", 0)
        for i in range(3):
            draw_character(d, pal, (1 + i) * FRAME, row * FRAME, direction, "walk", i)
        for i in range(4):
            draw_character(d, pal, (4 + i) * FRAME, row * FRAME, direction, "run", i)
    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for char_id, pal in CHARACTERS.items():
        img = build_sheet(pal)
        path = os.path.normpath(os.path.join(OUT_DIR, f"{char_id}.png"))
        img.save(path)
        print(f"{char_id}: {path} ({img.width}x{img.height})")


if __name__ == "__main__":
    main()
