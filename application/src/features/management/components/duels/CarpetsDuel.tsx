import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { CAT_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import {
  getDuelAiProfile,
  pickCatCarpet,
  scoreRoundsDuel,
} from '@/game/systems/duelSystem';
import {
  CARPETS_DUEL_MAX_ROUNDS,
  CARPETS_DUEL_ROUNDS_TO_WIN,
} from '@/game/core/balance';
import { DuelComponentProps } from './duelShared';

interface CarpetDef {
  id: string;
  label: string;
  bg: string;
  dark: string;
  ring: string;
}

const CARPETS: CarpetDef[] = [
  { id: 'roja', label: 'ROJA', bg: 'bg-red-600', dark: 'bg-red-900', ring: 'ring-red-300' },
  { id: 'azul', label: 'AZUL', bg: 'bg-blue-600', dark: 'bg-blue-900', ring: 'ring-blue-300' },
  { id: 'verde', label: 'VERDE', bg: 'bg-emerald-600', dark: 'bg-emerald-900', ring: 'ring-emerald-300' },
  { id: 'amarilla', label: 'AMARILLA', bg: 'bg-yellow-500', dark: 'bg-yellow-800', ring: 'ring-yellow-200' },
];

const roundTimeMs = (round: number) => Math.max(1600, 3000 - 250 * (round - 1));
const posPct = (idx: number) => ((idx + 0.5) / CARPETS.length) * 100;

type Phase = 'run' | 'resolve';

/**
 * DUELO "Alfombras de colores" — SALA vs EL GATO, dentro de la escena.
 * Inspiración directa: MUSHROOM MIX-UP (Mario Party) / HEXAGON HEAT
 * (Mario Party 2): se anuncia un color y hay que correr a la
 * plataforma de ese color antes de que las demás se hundan; el ritmo
 * se acelera ronda a ronda. Aquí: 4 alfombras en la sala, mejor de 5
 * rondas; el gato corre con su IA (duelSystem): reacciona tras un
 * retardo y a veces elige la alfombra equivocada. Si ambos aciertan,
 * la ronda es de quien llegó ANTES. El sprite del gato NUNCA se
 * espeja (su mancha del cachete izquierdo es su identidad): entra y
 * corre con su strip `prowl` de perfil derecho tal cual.
 */
export const CarpetsDuel: React.FC<DuelComponentProps> = ({
  playerId,
  playerName,
  hour,
  onStir,
  onFinish,
}) => {
  const profile = getDuelAiProfile('gato', hour);
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState(() => Math.floor(Math.random() * CARPETS.length));
  const [playerPos, setPlayerPos] = useState(0);
  const [catPos, setCatPos] = useState(0);
  const [phase, setPhase] = useState<Phase>('run');
  const [fraction, setFraction] = useState(1);
  const [roundWins, setRoundWins] = useState({ player: 0, cat: 0 });
  const [roundMsg, setRoundMsg] = useState<string | null>(null);

  const playerPosRef = useRef(0);
  const catPosRef = useRef(0);
  const playerArrivalRef = useRef<number | null>(null);
  const roundStartRef = useRef(performance.now());
  const catPlanRef = useRef<{ dest: number; arrivalMs: number } | null>(null);
  const catMovedRef = useRef(false);
  const resolvedRef = useRef(false);
  const finishedRef = useRef(false);
  const winsRef = useRef({ player: 0, cat: 0 });

  const bundle = getDefinedSpriteBundle(playerId);

  const planCat = useCallback(
    (roundNum: number, targetIdx: number) => {
      const dest = pickCatCarpet(Math.random, profile, roundNum, targetIdx, CARPETS.length);
      // Tiempo de llegada del gato: reacción + viaje según distancia.
      const travelMs = Math.abs(dest - catPosRef.current) * 260;
      catPlanRef.current = {
        dest,
        arrivalMs: profile.carpetsReactionMs + travelMs + Math.random() * 350,
      };
      catMovedRef.current = false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Plan del gato al abrir cada ronda.
  useEffect(() => {
    if (phase !== 'run') return;
    roundStartRef.current = performance.now();
    resolvedRef.current = false;
    // Si ya estás sobre la alfombra correcta al anunciarse, cuenta como
    // llegada casi inmediata (pero no gratis: 200 ms nominales).
    playerArrivalRef.current = playerPosRef.current === target ? 200 : null;
    planCat(round, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase]);

  const resolveRound = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const plan = catPlanRef.current;
    const catDest = plan ? plan.dest : catPosRef.current;
    const playerOk = playerPosRef.current === target;
    const catOk = catDest === target;
    const playerArrival = playerArrivalRef.current ?? Number.POSITIVE_INFINITY;
    const catArrival = catOk ? (plan?.arrivalMs ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

    let winner: 'player' | 'cat' | null = null;
    if (playerOk && catOk) winner = playerArrival <= catArrival ? 'player' : 'cat';
    else if (playerOk) winner = 'player';
    else if (catOk) winner = 'cat';

    if (winner === 'player') winsRef.current = { ...winsRef.current, player: winsRef.current.player + 1 };
    if (winner === 'cat') winsRef.current = { ...winsRef.current, cat: winsRef.current.cat + 1 };
    setRoundWins({ ...winsRef.current });
    if (!playerOk) onStir?.();
    setRoundMsg(
      winner === 'player'
        ? `¡Ronda para ${playerName}! 🎉`
        : winner === 'cat'
          ? '¡Ronda para el gato! 🐱'
          : 'Nadie acertó la alfombra… ronda en blanco'
    );
    setPhase('resolve');

    const { player, cat } = winsRef.current;
    const roundsPlayed = round;
    const decided =
      player >= CARPETS_DUEL_ROUNDS_TO_WIN ||
      cat >= CARPETS_DUEL_ROUNDS_TO_WIN ||
      roundsPlayed >= CARPETS_DUEL_MAX_ROUNDS;
    setTimeout(() => {
      if (decided) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish(scoreRoundsDuel(player, cat));
        }
        return;
      }
      setRoundMsg(null);
      setTarget(Math.floor(Math.random() * CARPETS.length));
      setRound((r) => r + 1);
      setPhase('run');
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, target]);

  // Reloj de la ronda + movimiento del gato.
  useEffect(() => {
    if (phase !== 'run') return;
    const total = roundTimeMs(round);
    const iv = setInterval(() => {
      const elapsed = performance.now() - roundStartRef.current;
      setFraction(Math.max(0, 1 - elapsed / total));
      const plan = catPlanRef.current;
      if (plan && !catMovedRef.current && elapsed >= profile.carpetsReactionMs) {
        catMovedRef.current = true;
        catPosRef.current = plan.dest;
        setCatPos(plan.dest);
      }
      if (elapsed >= total) {
        clearInterval(iv);
        resolveRound();
      }
    }, 40);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, resolveRound]);

  const movePlayer = (idx: number) => {
    if (phase !== 'run' || resolvedRef.current) return;
    const clamped = Math.max(0, Math.min(CARPETS.length - 1, idx));
    playerPosRef.current = clamped;
    setPlayerPos(clamped);
    if (clamped === target && playerArrivalRef.current === null) {
      playerArrivalRef.current = performance.now() - roundStartRef.current;
    }
    if (clamped !== target) playerArrivalRef.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        movePlayer(playerPosRef.current - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        movePlayer(playerPosRef.current + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target]);

  const targetCarpet = CARPETS[target];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Anuncio del color + marcador de rondas */}
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-black">
          <span className="px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-500/60 text-sky-200">
            Tú {roundWins.player}
          </span>
          <span className="text-slate-300">Ronda {round}/{CARPETS_DUEL_MAX_ROUNDS}</span>
          <span className="px-2 py-0.5 rounded-full bg-orange-950/90 border border-orange-500/60 text-orange-200">
            🐱 {roundWins.cat}
          </span>
        </div>
        {phase === 'run' ? (
          <div
            className={`px-3 py-1 rounded-xl text-white font-black text-sm sm:text-base ${targetCarpet.bg} shadow-lg pulse-soft`}
          >
            ¡A la alfombra {targetCarpet.label}!
          </div>
        ) : (
          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-600 text-slate-100 font-black text-sm">
            {roundMsg}
          </div>
        )}
        <div className="w-44 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
          <div
            className={`h-full ${fraction > 0.35 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${(phase === 'run' ? fraction : 0) * 100}%` }}
          />
        </div>
      </div>

      {/* Pista: alfombras en el suelo de la sala */}
      <div className="relative flex-1 mx-1 mb-1">
        {/* Carril del gato (al fondo) */}
        <div
          className="absolute z-10 transition-all duration-500 ease-linear"
          style={{ left: `${posPct(catPos)}%`, bottom: '46%', transform: 'translateX(-50%)' }}
        >
          <div className="flex flex-col items-center">
            <DefinedSprite2D anim={CAT_SPRITES.prowl} height={34} cycleMs={170} title="El gato de Jose" />
            <span className="text-[8px] font-bold text-orange-200 bg-orange-950/80 rounded px-1">GATO</span>
          </div>
        </div>

        {/* Carril del jugador */}
        <div
          className="absolute z-20 transition-all duration-300 ease-linear"
          style={{ left: `${posPct(playerPos)}%`, bottom: '30%', transform: 'translateX(-50%)' }}
        >
          <div className="flex flex-col items-center">
            <DefinedSprite2D anim={bundle.walk_front} height={56} cycleMs={300} title={playerName} />
            <span className="text-[8px] font-bold text-sky-200 bg-sky-950/80 rounded px-1">TÚ</span>
          </div>
        </div>

        {/* Alfombras */}
        <div className="absolute left-0 right-0 bottom-0 flex gap-1.5">
          {CARPETS.map((carpet, i) => {
            const isTarget = i === target;
            const sinking = phase === 'resolve' && !isTarget;
            return (
              <button
                key={carpet.id}
                onClick={() => movePlayer(i)}
                className={`flex-1 h-14 sm:h-16 rounded-lg border-b-8 border-black/40 flex items-end justify-center pb-1 font-black text-[10px] sm:text-xs text-white/95 transition-all duration-700 ${
                  sinking ? `${carpet.dark} translate-y-3 opacity-50` : carpet.bg
                } ${isTarget && phase === 'run' ? `ring-4 ${carpet.ring}` : ''}`}
                aria-label={`Alfombra ${carpet.label}`}
              >
                {carpet.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-300 pb-1">
        Toca una alfombra o usa ← → · si ambos aciertan, gana quien llegó antes
      </div>
    </div>
  );
};
