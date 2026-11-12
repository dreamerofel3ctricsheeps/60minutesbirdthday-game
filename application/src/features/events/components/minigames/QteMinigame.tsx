import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  QTE_DIRECTION_LABEL,
  generateQteSequence,
  keyToDirection,
  qteTimePerKeyMs,
  scoreQte,
  MinigameOutcome,
} from '@/game/systems/minigames';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';

interface QteMinigameProps {
  /** Sigilo de quien intercepta; null = nadie puede interceptar (modo duro). */
  interceptorStealth: number | null;
  interceptorName?: string;
  /** Id del interceptor: se le muestra en pose 'action' de su bundle definido. */
  interceptorId?: string;
  /** Fase 4 (showdown): largo de la secuencia; por defecto el estándar. */
  sequenceLength?: number;
  /** Fase 4 (showdown): multiplicador del tiempo por tecla (<1 = más exigente). */
  timePerKeyScale?: number;
  /** Se llama en cada fallo: Ximena se revuelve en la escena 2D. */
  onStir?: () => void;
  onFinish: (outcome: MinigameOutcome) => void;
}

/**
 * Minijuego QTE "¡Que no la despierten!" (Fase 3).
 * Secuencia de flechas: teclado (flechas/WASD) o botones en pantalla.
 * La lógica de puntuación vive en game/systems/minigames (testeada).
 */
export const QteMinigame: React.FC<QteMinigameProps> = ({
  interceptorStealth,
  interceptorName,
  interceptorId,
  sequenceLength,
  timePerKeyScale = 1,
  onStir,
  onFinish,
}) => {
  const sequence = useMemo(
    () => generateQteSequence(Math.random, interceptorStealth !== null, sequenceLength),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interceptorStealth, sequenceLength]
  );
  const timePerKey = Math.round(qteTimePerKeyMs(interceptorStealth) * timePerKeyScale);

  const [index, setIndex] = useState(0);
  const [fraction, setFraction] = useState(1);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const finishedRef = useRef(false);
  const deadlineRef = useRef<number>(performance.now() + timePerKey);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(scoreQte(hitsRef.current, missesRef.current, sequence.length));
  };

  const advance = (wasHit: boolean) => {
    if (finishedRef.current) return;
    if (wasHit) {
      hitsRef.current += 1;
    } else {
      missesRef.current += 1;
      onStir?.();
    }
    const next = index + 1;
    if (next >= sequence.length) {
      finish();
      return;
    }
    setIndex(next);
    deadlineRef.current = performance.now() + timePerKey;
    setFraction(1);
  };

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Reloj por tecla (timeout = fallo)
  useEffect(() => {
    if (index >= sequence.length) return;
    deadlineRef.current = performance.now() + timePerKey;
    const iv = setInterval(() => {
      const left = deadlineRef.current - performance.now();
      setFraction(Math.max(0, left / timePerKey));
      if (left <= 0) advanceRef.current(false);
    }, 40);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDirection(e.key);
      if (!dir) return;
      e.preventDefault();
      advanceRef.current(dir === sequence[index]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence, index]);

  const current = sequence[Math.min(index, sequence.length - 1)];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* El interceptor, en su pose 'action' del diseño definido */}
      {interceptorId && (
        <DefinedSprite2D
          anim={getDefinedSpriteBundle(interceptorId).action}
          height={92}
          cycleMs={380}
          title={interceptorName}
        />
      )}
      <div className="text-xs text-slate-400 text-center">
        {interceptorName
          ? `${interceptorName} intercepta el disturbio. `
          : '¡Nadie puede interceptar! '}
        Tiempo por tecla: {(timePerKey / 1000).toFixed(1)}s
      </div>

      {/* Secuencia */}
      <div className="flex gap-2">
        {sequence.map((dir, i) => (
          <div
            key={i}
            className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl font-black ${
              i < index
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : i === index
                  ? 'border-amber-400 bg-amber-950/60 text-amber-200 scale-110'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400'
            }`}
          >
            {QTE_DIRECTION_LABEL[dir]}
          </div>
        ))}
      </div>

      {/* Barra de tiempo de la tecla actual */}
      <div className="w-64 h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
        <div
          className={`h-full ${fraction > 0.4 ? 'bg-amber-400' : 'bg-red-500'}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <div className="text-4xl font-black text-slate-100">
        {current ? QTE_DIRECTION_LABEL[current] : '—'}
      </div>

      {/* Botones en pantalla (móvil / mouse) */}
      <div className="grid grid-cols-3 gap-2 w-[168px]">
        <div />
        <button
          onClick={() => advanceRef.current(current === 'up')}
          className="h-12 rounded-xl bg-slate-800 border border-slate-600 text-xl hover:bg-slate-700 active:scale-95"
          aria-label="Arriba"
        >
          ↑
        </button>
        <div />
        <button
          onClick={() => advanceRef.current(current === 'left')}
          className="h-12 rounded-xl bg-slate-800 border border-slate-600 text-xl hover:bg-slate-700 active:scale-95"
          aria-label="Izquierda"
        >
          ←
        </button>
        <button
          onClick={() => advanceRef.current(current === 'down')}
          className="h-12 rounded-xl bg-slate-800 border border-slate-600 text-xl hover:bg-slate-700 active:scale-95"
          aria-label="Abajo"
        >
          ↓
        </button>
        <button
          onClick={() => advanceRef.current(current === 'right')}
          className="h-12 rounded-xl bg-slate-800 border border-slate-600 text-xl hover:bg-slate-700 active:scale-95"
          aria-label="Derecha"
        >
          →
        </button>
      </div>
    </div>
  );
};
