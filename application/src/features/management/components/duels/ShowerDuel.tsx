import React, { useEffect, useRef, useState } from 'react';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { CAT_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import { timingPrecision, timingZoneAt } from '@/game/systems/minigames';
import { catShowerStopPosition, getDuelAiProfile, scoreRoundsDuel } from '@/game/systems/duelSystem';
import {
  TIMING_GREEN_MIN,
  TIMING_GREEN_MAX,
  TIMING_YELLOW_MIN,
  TIMING_YELLOW_MAX,
  SHOWER_DUEL_ROUNDS,
  SHOWER_DUEL_ROUNDS_TO_WIN,
} from '@/game/core/balance';
import { DuelComponentProps } from './duelShared';

type Phase = 'player' | 'cat' | 'resolve';

interface RoundState {
  round: number;
  playerPos: number | null;
  catPos: number | null;
}

const roundPeriodMs = (round: number) => Math.max(1150, 1750 - 130 * (round - 1));

/**
 * DUELO "Ducha silenciosa" — BAÑO vs EL GATO, dentro de la escena.
 * Inspiración: HOT ROPE JUMP (Mario Party: acertar el instante exacto
 * bajo presión, cada vez más rápido), en formato DUELO por rondas.
 * Mejor de 5 rondas: en cada una detienes el chorro en el punto
 * silencioso (centro de la barra) y luego el gato lo intenta en
 * escena: su detención sale de su IA (duelSystem.catShowerStopPosition,
 * error gaussiano). La ronda es de quien detenga con MÁS precisión.
 */
export const ShowerDuel: React.FC<DuelComponentProps> = ({
  playerId,
  playerName,
  hour,
  onStir,
  onFinish,
}) => {
  const profile = getDuelAiProfile('gato', hour);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('player');
  const [position, setPosition] = useState(0);
  const [state, setState] = useState<RoundState>({ round: 1, playerPos: null, catPos: null });
  const [wins, setWins] = useState({ player: 0, cat: 0 });
  const [roundMsg, setRoundMsg] = useState<string | null>(null);

  const posRef = useRef(0);
  const stateRef = useRef<RoundState>({ round: 1, playerPos: null, catPos: null });
  const winsRef = useRef({ player: 0, cat: 0 });
  const phaseRef = useRef<Phase>('player');
  const finishedRef = useRef(false);

  const bundle = getDefinedSpriteBundle(playerId);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Oscilación del marcador durante el turno del jugador.
  useEffect(() => {
    if (phase !== 'player') return;
    let raf = 0;
    const start = performance.now();
    const period = roundPeriodMs(round);
    const tick = (now: number) => {
      const t = ((now - start) / period) % 1;
      const p = t < 0.5 ? t * 200 : 200 - t * 200;
      posRef.current = p;
      setPosition(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, round]);

  const finishDuel = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(scoreRoundsDuel(winsRef.current.player, winsRef.current.cat));
  };

  const resolveRound = (playerPos: number, catPos: number) => {
    const pPrec = timingPrecision(playerPos);
    const cPrec = timingPrecision(catPos);
    let winner: 'player' | 'cat' | null = null;
    if (pPrec > cPrec) winner = 'player';
    else if (cPrec > pPrec) winner = 'cat';
    if (winner === 'player') winsRef.current = { ...winsRef.current, player: winsRef.current.player + 1 };
    if (winner === 'cat') winsRef.current = { ...winsRef.current, cat: winsRef.current.cat + 1 };
    setWins({ ...winsRef.current });
    setRoundMsg(
      winner === 'player'
        ? `Ronda para ${playerName}: ${pPrec} vs ${cPrec} de precisión 🎯`
        : winner === 'cat'
          ? `Ronda para el gato: ${cPrec} vs ${pPrec} de precisión 🐱`
          : `¡Empate de precisión! ${pPrec} y ${cPrec}`
    );
    setPhaseBoth('resolve');
    const { player, cat } = winsRef.current;
    const decided =
      player >= SHOWER_DUEL_ROUNDS_TO_WIN ||
      cat >= SHOWER_DUEL_ROUNDS_TO_WIN ||
      round >= SHOWER_DUEL_ROUNDS;
    setTimeout(() => {
      if (decided) {
        finishDuel();
        return;
      }
      const next = round + 1;
      stateRef.current = { round: next, playerPos: null, catPos: null };
      setState({ ...stateRef.current });
      setRoundMsg(null);
      setRound(next);
      setPhaseBoth('player');
    }, 1700);
  };

  const stop = () => {
    if (phaseRef.current !== 'player' || finishedRef.current) return;
    const p = posRef.current;
    if (timingZoneAt(p) === 'red') onStir?.();
    stateRef.current = { ...stateRef.current, playerPos: p };
    setState({ ...stateRef.current });
    setPhaseBoth('cat');
    // El gato "actúa" su intento y su marcador cae donde diga su IA.
    setTimeout(() => {
      if (finishedRef.current) return;
      const catPos = catShowerStopPosition(Math.random, profile, stateRef.current.round);
      stateRef.current = { ...stateRef.current, catPos };
      setState({ ...stateRef.current });
      setTimeout(() => resolveRound(p, catPos), 800);
    }, 900);
  };
  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const bar = (markerPos: number | null, ghostPos: number | null, active: boolean) => (
    <div className="relative w-full h-8 rounded-xl overflow-hidden border border-slate-600">
      <div className="absolute inset-0 bg-red-900/70" />
      <div
        className="absolute top-0 bottom-0 bg-amber-500/70"
        style={{ left: `${TIMING_YELLOW_MIN}%`, width: `${TIMING_YELLOW_MAX - TIMING_YELLOW_MIN}%` }}
      />
      <div
        className="absolute top-0 bottom-0 bg-emerald-500/85"
        style={{ left: `${TIMING_GREEN_MIN}%`, width: `${TIMING_GREEN_MAX - TIMING_GREEN_MIN}%` }}
      />
      {ghostPos !== null && (
        <div
          className="absolute top-0 bottom-0 w-[5px] bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.9)]"
          style={{ left: `${ghostPos}%` }}
          title="Detención del gato"
        />
      )}
      {markerPos !== null && (
        <div
          className="absolute top-0 bottom-0 w-[4px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${markerPos}%` }}
        />
      )}
      {active && (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/70 tracking-widest">
          PUNTO SILENCIOSO EN EL CENTRO
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col px-2">
      {/* Marcador de rondas */}
      <div className="flex items-center justify-center gap-2 py-1 text-[11px] sm:text-xs font-black">
        <span className="px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-500/60 text-sky-200">
          Tú {wins.player}
        </span>
        <span className="text-slate-200">
          {roundMsg ?? `Ronda ${round}/${SHOWER_DUEL_ROUNDS} · ${phase === 'player' ? 'tu turno: detén el chorro' : phase === 'cat' ? 'turno del gato…' : ''}`}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-orange-950/90 border border-orange-500/60 text-orange-200">
          🐱 {wins.cat}
        </span>
      </div>

      {/* Los dos contrincantes junto a la ducha */}
      <div className="flex items-end justify-center gap-4 py-1">
        <div className="flex flex-col items-center">
          <DefinedSprite2D anim={bundle.action} height={56} cycleMs={380} title={playerName} />
          <span className="text-[8px] font-bold text-sky-200 bg-sky-950/80 rounded px-1">TÚ</span>
        </div>
        <div className="text-4xl">🚿</div>
        <div className="flex flex-col items-center">
          <DefinedSprite2D
            anim={phase === 'cat' ? CAT_SPRITES.pounce : CAT_SPRITES.idle}
            height={42}
            cycleMs={phase === 'cat' ? 260 : 900}
            title="El gato de Jose"
          />
          <span className="text-[8px] font-bold text-orange-200 bg-orange-950/80 rounded px-1">GATO</span>
        </div>
      </div>

      {/* Barra de precisión: tu marcador (blanco) y el del gato (naranja) */}
      <div className="flex flex-col gap-1.5">
        {bar(
          phase === 'player' ? position : state.playerPos,
          state.catPos,
          phase === 'player'
        )}
        <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
          <span>⚪ tú{state.playerPos !== null ? ` · precisión ${timingPrecision(state.playerPos)}` : ''}</span>
          <span>🟠 gato{state.catPos !== null ? ` · precisión ${timingPrecision(state.catPos)}` : ''}</span>
        </div>
      </div>

      <button
        onClick={() => stopRef.current()}
        disabled={phase !== 'player'}
        className="mt-2 mx-auto px-8 h-11 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 active:scale-95 text-white font-bold shadow-lg"
      >
        ¡Detener el chorro!
      </button>
      <div className="text-center text-[10px] text-slate-300 pb-1">o presiona ESPACIO · acierta al centro verde</div>
    </div>
  );
};
