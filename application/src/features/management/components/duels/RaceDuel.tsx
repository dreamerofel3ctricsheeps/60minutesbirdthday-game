import React, { useEffect, useRef, useState } from 'react';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { JOSE_SPRITES, CAT_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import {
  QTE_DIRECTION_LABEL,
  QteDirection,
  keyToDirection,
} from '@/game/systems/minigames';
import { getDuelAiProfile, scoreRoundsDuel } from '@/game/systems/duelSystem';
import {
  RACE_DUEL_TARGET_STEPS,
  RACE_DUEL_MAX_HEATS,
  RACE_DUEL_HEATS_TO_WIN,
  RACE_DUEL_SHOWDOWN_JOSE_HEAD_START,
  RACE_DUEL_SHOWDOWN_CAT_HEAD_START,
} from '@/game/core/balance';
import { DuelComponentProps } from './duelShared';

interface RaceDuelProps extends DuelComponentProps {
  /** Showdown de la puerta: el villano sale con ventaja de pasos. */
  showdown?: boolean;
}

const HEAT_TIMEOUT_MS = 22000;
const DIRS: QteDirection[] = ['up', 'down', 'left', 'right'];
const randomDir = () => DIRS[Math.floor(Math.random() * DIRS.length)];

/**
 * DUELO "Carrera al timbre" — PUERTA vs JOSE (y showdowns), dentro de
 * la escena: los dos corredores avanzan POR EL PASILLO de la casa,
 * visibles todo el rato, hasta la puerta del cuarto de Ximena.
 * Inspiración: MECHA-MARATHON (Mario Party 2: correr a golpe de
 * machaqueo) + BUTTON MASHERS (Mario Party 5, duelo de pulsar las
 * teclas mostradas sin aflojar).
 * Formato por MANGAS (mejor de 3, ~25–30 s en total): cada tecla
 * correcta de la secuencia = un paso de tu roomie (con su animación de
 * correr); tecla mala = tropiezo. El villano avanza con su IA
 * (duelSystem): ritmo por paso con acelerones y tropiezos. En
 * showdown el villano sale ya a media distancia (hándicap narrativo)
 * solo en la primera manga.
 */
export const RaceDuel: React.FC<RaceDuelProps> = ({
  playerId,
  playerName,
  villain,
  hour,
  showdown = false,
  onStir,
  onFinish,
}) => {
  const profile = getDuelAiProfile(villain, hour);
  const [heat, setHeat] = useState(1);
  const [playerSteps, setPlayerSteps] = useState(0);
  const [villainSteps, setVillainSteps] = useState(
    showdown
      ? villain === 'jose'
        ? RACE_DUEL_SHOWDOWN_JOSE_HEAD_START
        : RACE_DUEL_SHOWDOWN_CAT_HEAD_START
      : 0
  );
  const [needed, setNeeded] = useState<QteDirection>(() => randomDir());
  const [stumbled, setStumbled] = useState(false);
  const [heats, setHeats] = useState({ player: 0, villain: 0 });
  const [heatMsg, setHeatMsg] = useState<string | null>(null);

  const playerStepsRef = useRef(0);
  const villainStepsRef = useRef(villainSteps);
  const heatsRef = useRef({ player: 0, villain: 0 });
  const lockRef = useRef(false);
  const heatOverRef = useRef(false);
  const finishedRef = useRef(false);
  const villainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bundle = getDefinedSpriteBundle(playerId);
  const isCat = villain === 'gato';

  const finishDuel = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(scoreRoundsDuel(heatsRef.current.player, heatsRef.current.villain));
  };

  const endHeat = (winner: 'player' | 'villain' | null) => {
    if (heatOverRef.current) return;
    heatOverRef.current = true;
    if (villainTimerRef.current) clearTimeout(villainTimerRef.current);
    if (winner === 'player') heatsRef.current = { ...heatsRef.current, player: heatsRef.current.player + 1 };
    if (winner === 'villain') heatsRef.current = { ...heatsRef.current, villain: heatsRef.current.villain + 1 };
    setHeats({ ...heatsRef.current });
    setHeatMsg(
      winner === 'player'
        ? `¡Manga para ${playerName}! 🏃💨`
        : winner === 'villain'
          ? `Manga para ${isCat ? 'el gato' : 'Jose'}… 😤`
          : 'Manga empatada: nadie llegó a la puerta'
    );
    const { player, villain: v } = heatsRef.current;
    const decided =
      player >= RACE_DUEL_HEATS_TO_WIN || v >= RACE_DUEL_HEATS_TO_WIN || heat >= RACE_DUEL_MAX_HEATS;
    setTimeout(() => {
      if (decided) {
        finishDuel();
        return;
      }
      // Siguiente manga: posiciones a cero y el villano un pelín más rápido.
      playerStepsRef.current = 0;
      villainStepsRef.current = 0;
      setPlayerSteps(0);
      setVillainSteps(0);
      setHeatMsg(null);
      heatOverRef.current = false;
      setHeat((h) => h + 1);
    }, 1600);
  };
  const endHeatRef = useRef(endHeat);
  endHeatRef.current = endHeat;

  // --- Motor del villano: pasos con ritmo IA (acelerones y tropiezos) ---
  useEffect(() => {
    if (heatOverRef.current || finishedRef.current) return;
    let cancelled = false;
    const stepMs = profile.raceStepMs * Math.pow(0.95, heat - 1) * (showdown ? 0.97 : 1);
    const schedule = () => {
      const roll = Math.random();
      let delay = stepMs;
      if (roll < profile.raceBurstProb) delay = stepMs * 0.5;
      else if (roll < profile.raceBurstProb + profile.raceStumbleProb) delay = stepMs * 2;
      villainTimerRef.current = setTimeout(() => {
        if (cancelled || heatOverRef.current || finishedRef.current) return;
        villainStepsRef.current += 1;
        setVillainSteps(villainStepsRef.current);
        if (villainStepsRef.current >= RACE_DUEL_TARGET_STEPS) {
          endHeatRef.current('villain');
          return;
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      if (villainTimerRef.current) clearTimeout(villainTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat]);

  // --- Timeout de la manga: gana quien vaya más avanzado ---
  useEffect(() => {
    if (heatOverRef.current) return;
    const t = setTimeout(() => {
      if (heatOverRef.current || finishedRef.current) return;
      const p = playerStepsRef.current;
      const v = villainStepsRef.current;
      endHeatRef.current(p > v ? 'player' : v > p ? 'villain' : null);
    }, HEAT_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat]);

  const pressDir = (dir: QteDirection) => {
    if (heatOverRef.current || finishedRef.current || lockRef.current) return;
    if (dir === needed) {
      playerStepsRef.current += 1;
      setPlayerSteps(playerStepsRef.current);
      setNeeded(randomDir());
      if (playerStepsRef.current >= RACE_DUEL_TARGET_STEPS) endHeatRef.current('player');
    } else {
      lockRef.current = true;
      setStumbled(true);
      onStir?.();
      setTimeout(() => {
        lockRef.current = false;
        setStumbled(false);
      }, 450);
    }
  };
  const pressRef = useRef(pressDir);
  pressRef.current = pressDir;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDirection(e.key);
      if (!dir) return;
      e.preventDefault();
      pressRef.current(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pct = (steps: number) => Math.min(88, (steps / RACE_DUEL_TARGET_STEPS) * 88);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Marcador de mangas */}
      <div className="flex items-center justify-center gap-2 py-1 text-[11px] sm:text-xs font-black">
        <span className="px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-500/60 text-sky-200">
          Tú {heats.player}
        </span>
        <span className="text-slate-200">
          {heatMsg ?? `Manga ${heat}/${RACE_DUEL_MAX_HEATS} · a la puerta: pulsa ${QTE_DIRECTION_LABEL[needed]}`}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-red-950/90 border border-red-500/60 text-red-200">
          {isCat ? '🐱' : 'Jose'} {heats.villain}
        </span>
      </div>

      {/* El pasillo: dos carriles hacia la puerta de Ximena */}
      <div className="relative flex-1 mx-1 rounded-xl bg-black/25 border border-white/10 overflow-hidden">
        <div className="absolute right-1 top-1 bottom-1 w-12 rounded-t-lg bg-amber-950/90 border-2 border-amber-800 flex flex-col items-center justify-center text-center">
          <span className="text-xl">🚪</span>
          <span className="text-[8px] font-black text-amber-200 [writing-mode:vertical-rl]">CUARTO DE XIME</span>
        </div>

        {/* Carril del jugador (arriba) */}
        <div className="absolute left-0 right-14 top-[8%] h-[38%] border-b border-dashed border-white/15">
          <div
            className={`absolute bottom-0 transition-all duration-200 ease-linear ${stumbled ? 'duel-shake' : ''}`}
            style={{ left: `${pct(playerSteps)}%` }}
          >
            <DefinedSprite2D anim={bundle.run_right} height={54} cycleMs={150} title={playerName} />
          </div>
          <span className="absolute left-1 top-0 text-[9px] font-bold text-sky-200 bg-sky-950/80 rounded px-1">
            TÚ · {playerSteps}/{RACE_DUEL_TARGET_STEPS}
          </span>
        </div>

        {/* Carril del villano (abajo) */}
        <div className="absolute left-0 right-14 bottom-[6%] h-[38%]">
          <div
            className="absolute bottom-0 transition-all duration-200 ease-linear"
            style={{ left: `${pct(villainSteps)}%` }}
          >
            {isCat ? (
              <DefinedSprite2D anim={CAT_SPRITES.prowl} height={38} cycleMs={150} title="El gato de Jose" />
            ) : (
              <DefinedSprite2D anim={JOSE_SPRITES.walk_right} height={54} cycleMs={170} title="Jose" />
            )}
          </div>
          <span className="absolute left-1 top-0 text-[9px] font-bold text-red-200 bg-red-950/80 rounded px-1">
            {isCat ? 'GATO' : 'JOSE'} · {villainSteps}/{RACE_DUEL_TARGET_STEPS}
          </span>
        </div>
      </div>

      {/* Tecla pedida + botones táctiles */}
      <div className="flex items-center justify-center gap-3 py-1.5">
        <div
          className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl font-black ${
            stumbled
              ? 'border-red-500 bg-red-950/70 text-red-300'
              : 'border-amber-400 bg-amber-950/70 text-amber-200 scale-110'
          }`}
        >
          {QTE_DIRECTION_LABEL[needed]}
        </div>
        <div className="grid grid-cols-3 gap-1.5 w-[132px]">
          <div />
          <button onClick={() => pressRef.current('up')} className="h-9 rounded-lg bg-slate-800/90 border border-slate-500 text-base text-slate-100 active:scale-95" aria-label="Arriba">↑</button>
          <div />
          <button onClick={() => pressRef.current('left')} className="h-9 rounded-lg bg-slate-800/90 border border-slate-500 text-base text-slate-100 active:scale-95" aria-label="Izquierda">←</button>
          <button onClick={() => pressRef.current('down')} className="h-9 rounded-lg bg-slate-800/90 border border-slate-500 text-base text-slate-100 active:scale-95" aria-label="Abajo">↓</button>
          <button onClick={() => pressRef.current('right')} className="h-9 rounded-lg bg-slate-800/90 border border-slate-500 text-base text-slate-100 active:scale-95" aria-label="Derecha">→</button>
        </div>
        <div className="text-[10px] text-slate-300 max-w-[110px]">
          Flechas / WASD o botones · tecla mala = tropiezo
        </div>
      </div>
    </div>
  );
};
