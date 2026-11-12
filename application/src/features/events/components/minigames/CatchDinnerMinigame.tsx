import React, { useEffect, useRef, useState } from 'react';
import { scoreCatch, MinigameOutcome } from '@/game/systems/minigames';
import { CATCH_GOOD_TARGET } from '@/game/core/balance';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';

interface CatchDinnerMinigameProps {
  /** Id del participante: se le muestra en pose 'action' junto a la olla. */
  participantId?: string;
  participantName?: string;
  /** Se llama al atrapar un ítem ruidoso: Ximena se revuelve. */
  onStir?: () => void;
  onFinish: (outcome: MinigameOutcome) => void;
}

interface FallingItem {
  id: number;
  /** Posición horizontal, en % del ancho del área (5–95). */
  xPct: number;
  /** Posición vertical, en px desde arriba. */
  y: number;
  emoji: string;
  good: boolean;
}

const TOTAL_ITEMS = 16;
const AREA_HEIGHT = 320;
const POT_Y = AREA_HEIGHT - 52; // altura (px) de la boca de la olla
const FALL_SPEED = 260; // px/s
const POT_SPEED = 340; // px/s
const SPAWN_MS = 650;

const GOOD_EMOJIS = ['🍅', '🥚', '🧀', '🥕', '🍗', '🌽'];
const BAD_EMOJIS = ['🍾', '🍽️', '🔔'];

/**
 * Minijuego "Atrapa la cena" (Fase 4, cocina).
 * Caen ingredientes: hay que atrapar los buenos con la olla (←/→ o botones)
 * y esquivar los ruidosos (botella, platos, campana): atraparlos hace ruido.
 * La puntuación vive en game/systems/minigames (testeada).
 */
export const CatchDinnerMinigame: React.FC<CatchDinnerMinigameProps> = ({
  participantId,
  participantName,
  onStir,
  onFinish,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [potX, setPotX] = useState(200);
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(0);
  const [resolved, setResolved] = useState(0);

  const itemsRef = useRef<FallingItem[]>([]);
  const potXRef = useRef(200);
  const spawnedRef = useRef(0);
  const nextIdRef = useRef(1);
  const goodRef = useRef(0);
  const badRef = useRef(0);
  const resolvedRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(scoreCatch(goodRef.current, badRef.current));
  };

  // Bucle principal: spawn, caída, movimiento de la olla y atrapes.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSpawn = last;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = areaRef.current?.clientWidth ?? 400;

      // Movimiento de la olla
      const dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (dir !== 0) {
        potXRef.current = Math.max(34, Math.min(width - 34, potXRef.current + dir * POT_SPEED * dt));
        setPotX(potXRef.current);
      }

      // Spawn de ítems
      if (spawnedRef.current < TOTAL_ITEMS && now - lastSpawn >= SPAWN_MS) {
        lastSpawn = now;
        spawnedRef.current += 1;
        const isGood = Math.random() < 0.7;
        const pool = isGood ? GOOD_EMOJIS : BAD_EMOJIS;
        itemsRef.current = [
          ...itemsRef.current,
          {
            id: nextIdRef.current++,
            xPct: 5 + Math.random() * 90,
            y: -24,
            emoji: pool[Math.floor(Math.random() * pool.length)],
            good: isGood,
          },
        ];
      }

      // Caída + resolución (atrape o suelo)
      if (itemsRef.current.length > 0) {
        const survivors: FallingItem[] = [];
        for (const item of itemsRef.current) {
          const y = item.y + FALL_SPEED * dt;
          const itemXPx = (item.xPct / 100) * width;
          const caught = Math.abs(y - POT_Y) < 26 && Math.abs(itemXPx - potXRef.current) < 46;
          if (caught) {
            resolvedRef.current += 1;
            if (item.good) {
              goodRef.current += 1;
              setGood(goodRef.current);
            } else {
              badRef.current += 1;
              setBad(badRef.current);
              onStir?.();
            }
            setResolved(resolvedRef.current);
            continue;
          }
          if (y > AREA_HEIGHT + 16) {
            // Cayó al suelo: los buenos se pierden, los malos no penalizan.
            resolvedRef.current += 1;
            setResolved(resolvedRef.current);
            continue;
          }
          survivors.push({ ...item, y });
        }
        itemsRef.current = survivors;
        setItems(survivors);
      }

      if (resolvedRef.current >= TOTAL_ITEMS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teclado: ← / →
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current.right = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const holdButton = (side: 'left' | 'right', pressed: boolean) => {
    keysRef.current[side] = pressed;
  };

  const remaining = TOTAL_ITEMS - resolved;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-sm font-bold text-slate-100">🍲 Atrapa la cena</div>
      <div className="text-xs text-slate-400 text-center">
        Mueve la olla con ← → y atrapa los ingredientes buenos. ¡Esquiva la botella, los platos y
        la campana: hacen ruido!
        {participantName ? ` Cocina ${participantName}.` : ''}
      </div>

      {/* HUD */}
      <div className="text-xs sm:text-sm font-semibold text-slate-200">
        Buenos: <span className="text-emerald-300">{good}</span> · Meta {CATCH_GOOD_TARGET} ·
        Malos: <span className="text-red-300">{bad}</span> · Quedan: {remaining}
      </div>

      {/* Área de juego */}
      <div
        ref={areaRef}
        className="relative w-full overflow-hidden rounded-2xl border border-slate-600 bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-900 select-none"
        style={{ height: AREA_HEIGHT }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute text-3xl"
            style={{ left: `${item.xPct}%`, top: item.y, transform: 'translateX(-50%)' }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Olla + participante */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: potX, top: POT_Y - 58, transform: 'translateX(-50%)' }}
        >
          {participantId && (
            <DefinedSprite2D
              anim={getDefinedSpriteBundle(participantId).action}
              height={54}
              cycleMs={380}
              title={participantName}
            />
          )}
          <div className="text-5xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🍲</div>
        </div>
      </div>

      {/* Botones táctiles */}
      <div className="flex gap-4">
        <button
          onPointerDown={() => holdButton('left', true)}
          onPointerUp={() => holdButton('left', false)}
          onPointerLeave={() => holdButton('left', false)}
          onPointerCancel={() => holdButton('left', false)}
          onContextMenu={(e) => e.preventDefault()}
          className="w-20 h-14 rounded-xl bg-slate-800 border border-slate-600 text-2xl text-slate-100 hover:bg-slate-700 active:scale-95 touch-none"
          aria-label="Mover la olla a la izquierda"
        >
          ◀
        </button>
        <button
          onPointerDown={() => holdButton('right', true)}
          onPointerUp={() => holdButton('right', false)}
          onPointerLeave={() => holdButton('right', false)}
          onPointerCancel={() => holdButton('right', false)}
          onContextMenu={(e) => e.preventDefault()}
          className="w-20 h-14 rounded-xl bg-slate-800 border border-slate-600 text-2xl text-slate-100 hover:bg-slate-700 active:scale-95 touch-none"
          aria-label="Mover la olla a la derecha"
        >
          ▶
        </button>
      </div>
      <div className="text-[11px] text-slate-500">Mantén presionado ◀ ▶ o usa las flechas del teclado</div>
    </div>
  );
};
