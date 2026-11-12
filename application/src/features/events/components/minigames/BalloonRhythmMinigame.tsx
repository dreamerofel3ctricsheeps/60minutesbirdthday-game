import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  QTE_DIRECTION_LABEL,
  generateBalloonSequence,
  keyToDirection,
  scoreBalloon,
  MinigameOutcome,
  QteDirection,
} from '@/game/systems/minigames';
import { BALLOON_SEQUENCE_LENGTH } from '@/game/core/balance';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';

interface BalloonRhythmMinigameProps {
  /** Id del participante: se le muestra en pose 'action' junto al título. */
  participantId?: string;
  participantName?: string;
  /** Se llama en cada paso fallado: Ximena se revuelve. */
  onStir?: () => void;
  onFinish: (outcome: MinigameOutcome) => void;
}

type Phase = 'demo' | 'play';

const STEP_TIMEOUT_MS = 2500;
const DEMO_STEP_MS = 650;

const DIRECTION_COLORS: Record<QteDirection, { bg: string; ring: string; knot: string }> = {
  up: { bg: 'bg-red-500', ring: 'ring-red-300', knot: 'border-b-red-500' },
  down: { bg: 'bg-blue-500', ring: 'ring-blue-300', knot: 'border-b-blue-500' },
  left: { bg: 'bg-green-500', ring: 'ring-green-300', knot: 'border-b-green-500' },
  right: { bg: 'bg-yellow-400', ring: 'ring-yellow-200', knot: 'border-b-yellow-400' },
};

const DIRECTION_ORDER: QteDirection[] = ['up', 'left', 'down', 'right'];

/**
 * Minijuego "Ritmo de globos" (Fase 4, sala) — tipo Simón dice.
 * Primero se muestra la secuencia de globos inflándose en orden; luego el
 * jugador la repite con flechas/WASD o tocando los globos de colores.
 * Un fallo (o timeout) no reinicia la secuencia: se avanza al siguiente paso.
 * La puntuación vive en game/systems/minigames (testeada).
 */
export const BalloonRhythmMinigame: React.FC<BalloonRhythmMinigameProps> = ({
  participantId,
  participantName,
  onStir,
  onFinish,
}) => {
  const sequence: QteDirection[] = useMemo(
    () => generateBalloonSequence(Math.random, BALLOON_SEQUENCE_LENGTH),
    []
  );

  const [phase, setPhase] = useState<Phase>('demo');
  const [demoIndex, setDemoIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [fraction, setFraction] = useState(1);
  const failedRef = useRef(0);
  const finishedRef = useRef(false);
  const deadlineRef = useRef<number>(0);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(scoreBalloon(failedRef.current));
  };

  // ── Fase DEMO: los globos se inflan en orden, uno cada 650ms ──
  useEffect(() => {
    if (phase !== 'demo') return;
    let count = 0;
    setDemoIndex(0);
    const iv = setInterval(() => {
      count += 1;
      if (count >= sequence.length) {
        clearInterval(iv);
        setPhase('play');
      } else {
        setDemoIndex(count);
      }
    }, DEMO_STEP_MS);
    return () => clearInterval(iv);
  }, [phase, sequence]);

  const advance = (correct: boolean) => {
    if (finishedRef.current || phase !== 'play') return;
    if (!correct) {
      failedRef.current += 1;
      onStir?.();
    }
    const nextResults = [...results, correct];
    setResults(nextResults);
    const next = step + 1;
    if (next >= sequence.length) {
      finish();
      return;
    }
    setStep(next);
    deadlineRef.current = performance.now() + STEP_TIMEOUT_MS;
    setFraction(1);
  };

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // ── Reloj por paso en la fase de juego (timeout = paso fallado) ──
  useEffect(() => {
    if (phase !== 'play') return;
    deadlineRef.current = performance.now() + STEP_TIMEOUT_MS;
    const iv = setInterval(() => {
      const left = deadlineRef.current - performance.now();
      setFraction(Math.max(0, left / STEP_TIMEOUT_MS));
      if (left <= 0) advanceRef.current(false);
    }, 40);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step]);

  // Teclado: flechas / WASD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDirection(e.key);
      if (!dir) return;
      e.preventDefault();
      advanceRef.current(dir === sequence[step]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence, step]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Título + participante */}
      <div className="flex items-end gap-3">
        {participantId && (
          <DefinedSprite2D
            anim={getDefinedSpriteBundle(participantId).action}
            height={54}
            cycleMs={380}
            title={participantName}
          />
        )}
        <div className="text-center">
          <div className="text-sm font-bold text-slate-100">🎈 Ritmo de globos</div>
          <div className="text-xs text-slate-400">
            {participantName ? `${participantName} infla los globos. ` : ''}
            Mira la secuencia y repítela sin equivocarte.
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="text-sm font-semibold text-slate-200 h-5">
        {phase === 'demo'
          ? 'Memoriza la secuencia… 👀'
          : `Tu turno: paso ${Math.min(step + 1, sequence.length)} de ${sequence.length}`}
      </div>

      {/* Globos de la secuencia */}
      <div className="flex gap-2 sm:gap-3">
        {sequence.map((dir, i) => {
          const color = DIRECTION_COLORS[dir];
          const isDemoActive = phase === 'demo' && i === demoIndex;
          const isCurrent = phase === 'play' && i === step;
          const done = phase === 'play' && i < results.length;
          const doneOk = done && results[i];
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`relative w-14 h-16 sm:w-16 sm:h-[74px] rounded-[50%] flex items-center justify-center text-2xl font-black text-white transition-all duration-300 ${
                  color.bg
                } ${isDemoActive ? 'scale-125 ring-4 ring-white/80 shadow-[0_0_24px_rgba(255,255,255,0.55)]' : ''} ${
                  isCurrent ? `ring-4 ${color.ring} scale-110` : ''
                } ${done ? (doneOk ? 'opacity-100 ring-2 ring-emerald-300' : 'opacity-50 grayscale-[35%]') : ''} ${
                  phase === 'play' && i > step ? 'opacity-70' : ''
                }`}
              >
                {QTE_DIRECTION_LABEL[dir]}
                {/* Brillo del globo */}
                <div className="absolute top-2 left-3 w-3 h-4 rounded-full bg-white/35 rotate-[-20deg]" />
              </div>
              {/* Nudo e hilo */}
              <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-l-transparent border-r-transparent ${color.knot}`} />
              <div className="w-px h-4 bg-slate-500" />
              {done && (
                <div className={`text-sm font-black ${doneOk ? 'text-emerald-300' : 'text-red-400'}`}>
                  {doneOk ? '✓' : '✗'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de tiempo del paso actual */}
      {phase === 'play' ? (
        <div className="w-64 h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
          <div
            className={`h-full ${fraction > 0.4 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      ) : (
        <div className="w-64 h-2.5" />
      )}

      {/* Globos táctiles por dirección */}
      <div className="flex gap-2 sm:gap-3">
        {DIRECTION_ORDER.map((dir) => {
          const color = DIRECTION_COLORS[dir];
          return (
            <button
              key={dir}
              onClick={() => advanceRef.current(dir === sequence[step])}
              disabled={phase !== 'play'}
              className={`relative w-14 h-14 rounded-[50%] ${color.bg} text-white text-2xl font-black shadow-lg transition-transform ${
                phase === 'play' ? 'hover:scale-110 active:scale-95' : 'opacity-40'
              }`}
              aria-label={`Globo ${QTE_DIRECTION_LABEL[dir]}`}
            >
              {QTE_DIRECTION_LABEL[dir]}
              <div className="absolute top-1.5 left-2.5 w-2.5 h-3 rounded-full bg-white/35 rotate-[-20deg]" />
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-slate-500">
        Toca los globos en orden o usa las flechas / WASD
      </div>
    </div>
  );
};
