import React from 'react';

interface XimenaBedProps {
  /** Medidor Despertar 0-100: define el estado visual de Ximena. */
  despertar: number;
  /** Sube con cada fallo durante un minijuego: provoca un revolcón extra. */
  stirSignal?: number;
}

/**
 * Ximena durmiendo en su cuarto (Fase 3). Compuesta con CSS (cama, manta,
 * cabello, cintillo de Bonnie) porque no hay sheet de Ximena en el grid de
 * roomies. Su estado refleja el medidor DESPERTAR:
 *  - < 40: sueño profundo, Zzz tranquilas.
 *  - 40-69: se revuelve (animación de stir, Zzz inquietas).
 *  - 70-99: se incorpora a medias, ceño fruncido: está a nada de despertar.
 *  - 100: sentada y DESPIERTA (fin de la partida).
 */
export const XimenaBed: React.FC<XimenaBedProps> = ({ despertar, stirSignal = 0 }) => {
  const awake = despertar >= 100;
  const sitting = !awake && despertar >= 70;
  const stirring = stirSignal > 0 || (despertar >= 40 && !sitting && !awake);

  return (
    <div className="relative flex flex-col items-center select-none">
      <div className="relative w-[210px] h-[110px]">
        {/* Cabecera */}
        <div className="absolute left-0 top-2 w-5 h-[86px] rounded-md bg-amber-900 border border-amber-950" />
        {/* Colchón */}
        <div className="absolute left-4 bottom-3 w-[190px] h-[26px] rounded-lg bg-slate-200 border border-slate-300" />
        {/* Manta */}
        <div
          className={`absolute bottom-6 rounded-t-xl border transition-all duration-500 ${
            sitting || awake
              ? 'left-[86px] w-[118px] h-[26px] bg-violet-400/80 border-violet-300'
              : 'left-[52px] w-[152px] h-[38px] bg-violet-500/90 border-violet-300'
          }`}
        />
        {/* Cuerpo/cabeza de Ximena */}
        <div
          key={stirSignal}
          className={`absolute transition-all duration-500 ${stirring && !awake ? 'sleep-stir' : ''}`}
          style={{
            left: sitting || awake ? 58 : 18,
            bottom: sitting || awake ? 34 : 40,
          }}
        >
          <div className="relative w-[44px] h-[44px]">
            {/* Cabello castaño liso */}
            <div className="absolute inset-0 rounded-full bg-amber-800 border-2 border-amber-950" />
            {/* Cara */}
            <div className="absolute left-[7px] top-[9px] w-[30px] h-[30px] rounded-full bg-amber-100" />
            {/* Ojos: cerrados durmiendo / abiertos despierta */}
            {awake ? (
              <>
                <div className="absolute left-[14px] top-[19px] w-[5px] h-[7px] rounded-full bg-slate-900" />
                <div className="absolute left-[26px] top-[19px] w-[5px] h-[7px] rounded-full bg-slate-900" />
                <div className="absolute left-[19px] top-[30px] w-[8px] h-[3px] rounded bg-slate-900" />
              </>
            ) : (
              <>
                <div className="absolute left-[13px] top-[22px] w-[7px] h-[2px] rounded bg-slate-700" />
                <div className="absolute left-[25px] top-[22px] w-[7px] h-[2px] rounded bg-slate-700" />
                {sitting && (
                  <div className="absolute left-[18px] top-[30px] w-[9px] h-[4px] rounded-full border border-slate-700" />
                )}
              </>
            )}
            {/* Cintillo de orejas de Bonnie (su rasgo distintivo) */}
            <div className="absolute -top-[7px] left-[9px] w-[6px] h-[12px] rounded-t-full bg-violet-600 border border-violet-800 rotate-[-8deg]" />
            <div className="absolute -top-[7px] left-[28px] w-[6px] h-[12px] rounded-t-full bg-violet-600 border border-violet-800 rotate-[8deg]" />
          </div>
        </div>
        {/* Almohada */}
        <div className="absolute left-[14px] bottom-[38px] w-[46px] h-[14px] rounded-md bg-white/90 border border-slate-300 -z-0" />
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
