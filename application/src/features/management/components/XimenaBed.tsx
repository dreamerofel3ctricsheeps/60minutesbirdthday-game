import React from 'react';
import { XIMENA_SLEEP } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';

interface XimenaBedProps {
  /** Medidor Despertar 0-100: define el estado visual de Ximena. */
  despertar: number;
  /** Sube con cada fallo durante un minijuego: provoca un revolcón extra. */
  stirSignal?: number;
}

/**
 * Ximena durmiendo en su cuarto. Corrección de arte: usa el strip
 * 'sleep' generado desde su diseño definido (ella en su cama, con sus
 * lentes y su cintillo de orejas de Bonnie) en vez de la composición
 * CSS de la Fase 3. Los 3 frames mapean a los estados del medidor
 * DESPERTAR, conservando la semántica y las Zzz:
 *  - frame 0 (durmiendo profundo): < 40 y sin revolcones recientes.
 *  - frame 1 (revolviéndose): 40-69, o tras un fallo en un minijuego.
 *  - frame 2 (sentada, recién despertada): 70-99 a punto de despertar;
 *    a 100 la partida termina (WAKE_DEFEAT) con su grito.
 */
export const XimenaBed: React.FC<XimenaBedProps> = ({ despertar, stirSignal = 0 }) => {
  const awake = despertar >= 100;
  const sitting = !awake && despertar >= 70;
  const stirring = stirSignal > 0 || (despertar >= 40 && !sitting && !awake);
  const frameIndex = awake || sitting ? 2 : stirring ? 1 : 0;

  return (
    <div className="relative flex flex-col items-center select-none">
      <div
        key={stirSignal}
        className={stirring && !awake ? 'sleep-stir' : undefined}
      >
        <DefinedSprite2D anim={XIMENA_SLEEP} height={118} frameIndex={frameIndex} />
      </div>

      {/* Zzz / estado */}
      {!awake ? (
        <div className="relative h-6 w-full">
          <span
            className={`absolute left-[38px] top-0 font-black ${
              despertar >= 70 ? 'text-red-300 text-xl' : 'text-sky-300 text-lg'
            } zzz-float`}
          >
            Z
          </span>
          <span
            className="absolute left-[52px] top-1 text-sky-200 text-sm font-black zzz-float"
            style={{ animationDelay: '0.9s' }}
          >
            z
          </span>
          {sitting && <span className="absolute right-2 top-0 text-lg pulse-soft">💢</span>}
        </div>
      ) : (
        <div className="text-red-300 font-black text-lg pulse-soft">¡¿QUÉ ES TODO ESTO?!</div>
      )}

      <div className="text-[11px] font-semibold text-slate-300 mt-1">
        Ximena {awake ? '¡DESPIERTA!' : sitting ? 'a punto de despertar…' : despertar >= 40 ? 'se revuelve…' : 'duerme profundo'}
      </div>
    </div>
  );
};
