import React, { useEffect, useRef, useState } from 'react';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { JOSE_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import { getDuelAiProfile, scoreCatchDuel } from '@/game/systems/duelSystem';
import { CATCH_DUEL_TOTAL_ITEMS, CATCH_DUEL_SPAWN_MS } from '@/game/core/balance';
import { DuelComponentProps } from './duelShared';

interface FallingItem {
  id: number;
  xPct: number;
  y: number;
  emoji: string;
  good: boolean;
}

const FALL_SPEED = 250; // px/s
const PLAYER_SPEED = 380; // px/s
const POT_HALF = 44; // semiancho de atrapada de cada olla (px)
const GOOD_EMOJIS = ['🍅', '🥚', '🧀', '🥕', '🍗', '🌽'];
const BAD_EMOJIS = ['🍾', '🍽️', '🔔'];

/**
 * DUELO "Duelo de la cena" — COCINA vs JOSE, dentro de la escena.
 * Inspiración: CONEY ISLAND (Mario Party 5: atrapar lo que cae sobre
 * tu cono) + CAN TAKE PANCAKES (Super Mario Party: agarrar antes que
 * el rival). Caen 30 ítems en ~28 s: tú y Jose atrapáis con vuestras
 * ollas en la misma cocina; Jose se mueve con su IA (duelSystem):
 * persigue el buen ítem más bajo, con su velocidad y sus errores.
 * Lo ruidoso (🍾🍽️🔔) resta al neto de quien lo atrape.
 */
export const CatchDuel: React.FC<DuelComponentProps> = ({
  playerId,
  playerName,
  hour,
  onStir,
  onFinish,
}) => {
  const profile = getDuelAiProfile('jose', hour);
  const areaRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState(90);
  const [joseX, setJoseX] = useState(300);
  const [score, setScore] = useState({ pGood: 0, pBad: 0, jGood: 0, jBad: 0, resolved: 0 });
  const [shake, setShake] = useState(0);

  const itemsRef = useRef<FallingItem[]>([]);
  const playerXRef = useRef(90);
  const joseXRef = useRef(300);
  const keysRef = useRef({ left: false, right: false });
  const pointerTargetRef = useRef<number | null>(null);
  const spawnedRef = useRef(0);
  const nextIdRef = useRef(1);
  const scoreRef = useRef({ pGood: 0, pBad: 0, jGood: 0, jBad: 0, resolved: 0 });
  const joseTargetRef = useRef<number | null>(null);
  const joseWaitsUntilRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const s = scoreRef.current;
    onFinish(scoreCatchDuel(s.pGood, s.pBad, s.jGood, s.jBad));
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSpawn = last - CATCH_DUEL_SPAWN_MS + 350; // el primer ítem sale pronto

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = areaRef.current?.clientWidth ?? 260;
      const height = areaRef.current?.clientHeight ?? 420;
      const potY = height - 64;

      // --- Jugador: ←/→ o arrastre con puntero ---
      const dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (dir !== 0) {
        playerXRef.current = Math.max(
          30,
          Math.min(width - 30, playerXRef.current + dir * PLAYER_SPEED * dt)
        );
        pointerTargetRef.current = null;
      } else if (pointerTargetRef.current !== null) {
        const target = Math.max(30, Math.min(width - 30, pointerTargetRef.current));
        const delta = target - playerXRef.current;
        const step = Math.sign(delta) * Math.min(Math.abs(delta), PLAYER_SPEED * dt);
        playerXRef.current += step;
      }
      setPlayerX(playerXRef.current);

      // --- Jose IA: persigue el buen ítem más bajo (o se equivoca) ---
      if (now >= joseWaitsUntilRef.current) {
        let target = itemsRef.current.find((it) => it.id === joseTargetRef.current);
        if (!target) {
          const falling = itemsRef.current.filter((it) => it.y < potY - 30);
          const goods = falling.filter((it) => it.good);
          const pool =
            goods.length > 0 && Math.random() >= profile.catchErrorProb ? goods : falling;
          if (pool.length > 0) {
            target = pool.reduce((a, b) => (a.y > b.y ? a : b));
            joseTargetRef.current = target.id;
          }
        }
        if (target) {
          const targetX = (target.xPct / 100) * width;
          const speed = PLAYER_SPEED * profile.catchSpeedRatio;
          const delta = targetX - joseXRef.current;
          joseXRef.current += Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);
          if (Math.abs(delta) < 6 && Math.random() < profile.catchErrorProb * 0.12) {
            // De vez en cuando Jose "se distrae" un instante (su error humano).
            joseWaitsUntilRef.current = now + 420;
            joseTargetRef.current = null;
          }
        }
      }
      setJoseX(joseXRef.current);

      // --- Spawn ---
      if (spawnedRef.current < CATCH_DUEL_TOTAL_ITEMS && now - lastSpawn >= CATCH_DUEL_SPAWN_MS) {
        lastSpawn = now;
        spawnedRef.current += 1;
        const isGood = Math.random() < 0.7;
        const pool = isGood ? GOOD_EMOJIS : BAD_EMOJIS;
        itemsRef.current = [
          ...itemsRef.current,
          {
            id: nextIdRef.current++,
            xPct: 6 + Math.random() * 88,
            y: -26,
            emoji: pool[Math.floor(Math.random() * pool.length)],
            good: isGood,
          },
        ];
      }

      // --- Caída y atrapes (las dos ollas comparten cocina) ---
      if (itemsRef.current.length > 0) {
        const survivors: FallingItem[] = [];
        let changed = false;
        for (const item of itemsRef.current) {
          const y = item.y + FALL_SPEED * dt;
          const itemX = (item.xPct / 100) * width;
          const atPotLine = Math.abs(y - potY) < 24;
          const byPlayer = atPotLine && Math.abs(itemX - playerXRef.current) < POT_HALF;
          const byJose = atPotLine && Math.abs(itemX - joseXRef.current) < POT_HALF;
          if (byPlayer || byJose) {
            changed = true;
            scoreRef.current.resolved += 1;
            if (byPlayer) {
              if (item.good) scoreRef.current.pGood += 1;
              else {
                scoreRef.current.pBad += 1;
                onStir?.();
                setShake((s) => s + 1);
              }
            } else {
              if (item.good) scoreRef.current.jGood += 1;
              else scoreRef.current.jBad += 1;
            }
            if (joseTargetRef.current === item.id) joseTargetRef.current = null;
            continue;
          }
          if (y > height + 18) {
            changed = true;
            scoreRef.current.resolved += 1;
            if (joseTargetRef.current === item.id) joseTargetRef.current = null;
            continue;
          }
          survivors.push({ ...item, y });
        }
        itemsRef.current = survivors;
        setItems(survivors);
        if (changed) setScore({ ...scoreRef.current });
      }

      if (scoreRef.current.resolved >= CATCH_DUEL_TOTAL_ITEMS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current.right = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const playerNet = score.pGood - score.pBad;
  const joseNet = score.jGood - score.jBad;
  const bundle = getDefinedSpriteBundle(playerId);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Marcador del duelo */}
      <div className="flex items-center justify-center gap-2 py-1 text-[11px] sm:text-xs font-black">
        <span className="px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-500/60 text-sky-200">
          Tú {playerNet}
        </span>
        <span className="text-slate-300">· quedan {CATCH_DUEL_TOTAL_ITEMS - score.resolved} ·</span>
        <span className="px-2 py-0.5 rounded-full bg-red-950/90 border border-red-500/60 text-red-200">
          Jose {joseNet}
        </span>
      </div>

      {/* Arena: la propia cocina de la escena */}
      <div
        key={shake}
        ref={areaRef}
        className={`relative flex-1 overflow-hidden select-none ${shake ? 'duel-shake' : ''}`}
        onPointerDown={(e) => {
          const rect = areaRef.current?.getBoundingClientRect();
          if (rect) pointerTargetRef.current = e.clientX - rect.left;
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0) return;
          const rect = areaRef.current?.getBoundingClientRect();
          if (rect) pointerTargetRef.current = e.clientX - rect.left;
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute text-2xl sm:text-3xl"
            style={{ left: `${item.xPct}%`, top: item.y, transform: 'translateX(-50%)' }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Tú + tu olla */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: playerX, bottom: 6, transform: 'translateX(-50%)' }}
        >
          <DefinedSprite2D anim={bundle.action} height={52} cycleMs={360} title={playerName} />
          <div className="text-4xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🍲</div>
          <span className="text-[9px] font-bold text-sky-200 bg-sky-950/80 rounded px-1">TÚ</span>
        </div>

        {/* Jose + su olla */}
        <div
          className="absolute flex flex-col items-center opacity-95"
          style={{ left: joseX, bottom: 6, transform: 'translateX(-50%)' }}
        >
          <DefinedSprite2D anim={JOSE_SPRITES.walk_right} height={52} cycleMs={300} title="Jose" />
          <div className="text-4xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🥘</div>
          <span className="text-[9px] font-bold text-red-200 bg-red-950/80 rounded px-1">JOSE</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-300 pb-1">
        ← →, arrastra o mantén ◀ ▶ · lo ruidoso 🍾🍽️🔔 RESTA
      </div>
      <div className="flex justify-center gap-6 pb-1 lg:hidden">
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            onPointerDown={() => (keysRef.current[side] = true)}
            onPointerUp={() => (keysRef.current[side] = false)}
            onPointerLeave={() => (keysRef.current[side] = false)}
            onPointerCancel={() => (keysRef.current[side] = false)}
            onContextMenu={(e) => e.preventDefault()}
            className="w-16 h-11 rounded-xl bg-slate-800/90 border border-slate-500 text-xl text-slate-100 active:scale-95 touch-none"
            aria-label={side === 'left' ? 'Izquierda' : 'Derecha'}
          >
            {side === 'left' ? '◀' : '▶'}
          </button>
        ))}
      </div>
    </div>
  );
};
