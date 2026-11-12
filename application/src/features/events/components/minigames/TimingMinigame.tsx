import React, { useEffect, useRef, useState } from 'react';
import {
  scoreTiming,
  timingZoneAt,
  MinigameOutcome,
} from '@/game/systems/minigames';
import {
  TIMING_ATTEMPTS,
  TIMING_GREEN_MIN,
  TIMING_GREEN_MAX,
  TIMING_YELLOW_MIN,
  TIMING_YELLOW_MAX,
} from '@/game/core/balance';

interface TimingMinigameProps {
  /** Se llama en cada detención en zona roja: Ximena se revuelve. */
  onStir?: () => void;
  onFinish: (outcome: MinigameOutcome) => void;
}

/**
 * Minijuego TIMING "Sin hacer ruido" (Fase 3).
 * Un marcador oscila sobre la barra; hay que detenerlo en la zona VERDE
 * en TIMING_ATTEMPTS intentos. Botón en pantalla o barra espaciadora.
 * La puntuación vive en game/systems/minigames (testeada).
 */
export const TimingMinigame: React.FC<TimingMinigameProps> = ({ onStir, onFinish }) => {
  const [position, setPosition] = useState(0);
  const [stops, setStops] = useState<number[]>([]);
  const posRef = useRef(0);
  const stopsRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  // Oscilación triangular 0→100→0 (periodo ~1.6s)
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 1600) % 1;
      const p = t < 0.5 ? t * 200 : 200 - t * 200;
      posRef.current = p;
      setPosition(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stops]);

  const stop = () => {
    if (finishedRef.current) return;
    const p = posRef.current;
    if (timingZoneAt(p) === 'red') onStir?.();
    const next = [...stopsRef.current, p];
    stopsRef.current = next;
    setStops(next);
    if (next.length >= TIMING_ATTEMPTS) {
      finishedRef.current = true;
      onFinish(scoreTiming(next));
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-xs text-slate-400">
        Intento {Math.min(stops.length + 1, TIMING_ATTEMPTS)} de {TIMING_ATTEMPTS} — detén el
        marcador en la zona <span className="text-emerald-300 font-bold">VERDE</span>
      </div>

      {/* Barra con zonas */}
      <div className="relative w-full max-w-md h-9 rounded-xl overflow-hidden border border-slate-600">
        <div className="absolute inset-0 bg-red-900/70" />
        <div
          className="absolute top-0 bottom-0 bg-amber-500/70"
          style={{ left: `${TIMING_YELLOW_MIN}%`, width: `${TIMING_YELLOW_MAX - TIMING_YELLOW_MIN}%` }}
        />
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/85"
          style={{ left: `${TIMING_GREEN_MIN}%`, width: `${TIMING_GREEN_MAX - TIMING_GREEN_MIN}%` }}
        />
        {/* Detenciones previas */}
        {stops.map((s, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[3px] bg-white/60"
            style={{ left: `${s}%` }}
          />
        ))}
        {/* Marcador */}
        <div
          className="absolute top-0 bottom-0 w-[4px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${position}%` }}
        />
      </div>

      <button
        onClick={stop}
        className="px-8 h-12 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-lg shadow-lg"
      >
        ¡Detener!
      </button>
      <div className="text-[11px] text-slate-500">o presiona ESPACIO</div>
    </div>
  );
};
