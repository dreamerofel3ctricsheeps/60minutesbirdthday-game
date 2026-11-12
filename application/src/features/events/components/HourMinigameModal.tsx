import React, { useRef, useState } from 'react';
import { CharacterDefinition } from '@/types/game.types';
import { HourMinigamePlan } from '@/game/systems/hourMinigames';
import { MinigameOutcome } from '@/game/systems/minigames';
import { JOSE_SPRITES, CAT_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import { QteMinigame } from './minigames/QteMinigame';
import { TimingMinigame } from './minigames/TimingMinigame';
import { CatchDinnerMinigame } from './minigames/CatchDinnerMinigame';
import { BalloonRhythmMinigame } from './minigames/BalloonRhythmMinigame';
import { Gamepad2, Swords, MapPin, CheckCircle2 } from 'lucide-react';

export interface MinigameParticipant {
  character: CharacterDefinition;
  isGuardian: boolean;
}

interface HourMinigameModalProps {
  plan: HourMinigamePlan;
  /** Quién intercepta en QTE/timing/showdown (vigía > libre más sigiloso); null = nadie libre. */
  interceptor: MinigameParticipant | null;
  /** El protagonista: juega los minijuegos de cocina/sala. */
  protagonist: CharacterDefinition;
  onStir?: () => void;
  /** Se invoca UNA vez al terminar el juego: el padre resuelve la hora y devuelve las líneas de resumen a mostrar. */
  onOutcome: (outcome: MinigameOutcome) => string[];
  onClose: () => void;
}

const ZONE_LABEL: Record<HourMinigamePlan['zone'], string> = {
  cocina: '🍳 Cocina',
  sala: '🛋️ Sala',
  puerta: '🚪 Puerta del cuarto',
  bano: '🚿 Baño / cuarto',
};

const OUTCOME_BANNER: Record<MinigameOutcome, { text: string; classes: string }> = {
  perfect: { text: '🌟 ¡Perfecto!', classes: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' },
  partial: { text: '👍 Bien, pero con tropiezos', classes: 'bg-amber-950/80 border-amber-500/50 text-amber-200' },
  fail: { text: '💥 ¡Ruido! Eso salió mal…', classes: 'bg-red-950/80 border-red-500/50 text-red-200' },
};

/** Dificultad del showdown: Jose es el cerebro rival (más largo y rápido); el gato es escurridizo pero menor. */
const SHOWDOWN_QTE: Record<'jose' | 'gato', { sequenceLength: number; timePerKeyScale: number }> = {
  jose: { sequenceLength: 7, timePerKeyScale: 0.75 },
  gato: { sequenceLength: 6, timePerKeyScale: 0.9 },
};

/**
 * Fase 4: shell (marco) del MINIJUEGO DE LA HORA. La gestión ya no es
 * "click y nada más": resolver una hora abre esta shell estilo Mario
 * Party en la zona del mapa que toca (o el SHOWDOWN contra el villano
 * que espera en la puerta), y el resultado alimenta la resolución de la
 * hora (game/systems/hourResolution).
 */
export const HourMinigameModal: React.FC<HourMinigameModalProps> = ({
  plan,
  interceptor,
  protagonist,
  onStir,
  onOutcome,
  onClose,
}) => {
  const [done, setDone] = useState<{ outcome: MinigameOutcome; lines: string[] } | null>(null);
  const resolvedRef = useRef(false);

  const handleFinish = (outcome: MinigameOutcome) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const lines = onOutcome(outcome);
    setDone({ outcome, lines });
  };

  const isShowdown = plan.kind === 'showdown';
  const villain = plan.villain;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-slate-900 border rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto ${
          isShowdown ? 'border-red-500/60' : 'border-sky-900/60'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl border ${
              isShowdown
                ? 'bg-red-950/80 border-red-600/50 text-red-300'
                : 'bg-sky-950/80 border-sky-600/50 text-sky-300'
            }`}
          >
            {isShowdown ? <Swords className="w-7 h-7" /> : <Gamepad2 className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isShowdown ? 'text-red-300' : 'text-sky-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {isShowdown ? '¡SHOWDOWN en la puerta!' : `Minijuego de la hora — ${ZONE_LABEL[plan.zone]}`}
            </span>
            <h2 className="text-2xl font-bold text-slate-100">{plan.title}</h2>
          </div>
          {isShowdown && villain === 'jose' && (
            <DefinedSprite2D anim={JOSE_SPRITES.sneak} height={76} cycleMs={420} title="Jose, el villano" />
          )}
          {isShowdown && villain === 'gato' && (
            <DefinedSprite2D anim={CAT_SPRITES.pounce} height={52} cycleMs={380} title="El gato de Jose" />
          )}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {plan.description}
        </p>

        {!done && (
          <div className="text-xs text-slate-400">
            {plan.kind === 'catch' || plan.kind === 'balloon' ? (
              <>
                Juega: <span className="font-bold text-sky-300">{protagonist.name}</span> (el anfitrión
                de la fiesta en preparación)
              </>
            ) : interceptor ? (
              <>
                Intercepta:{' '}
                <span className="font-bold text-sky-300">{interceptor.character.name}</span> (Sigilo{' '}
                {interceptor.character.attributes.stealth})
                {interceptor.isGuardian && (
                  <span className="text-emerald-300 font-semibold"> — ¡es el vigía, va con ventaja!</span>
                )}
              </>
            ) : (
              <span className="text-red-300 font-semibold">
                ¡No hay nadie libre para interceptar! El minijuego será más duro.
              </span>
            )}
          </div>
        )}

        {!done && plan.kind === 'catch' && (
          <CatchDinnerMinigame
            participantId={protagonist.id}
            participantName={protagonist.name}
            onStir={onStir}
            onFinish={handleFinish}
          />
        )}
        {!done && plan.kind === 'balloon' && (
          <BalloonRhythmMinigame
            participantId={protagonist.id}
            participantName={protagonist.name}
            onStir={onStir}
            onFinish={handleFinish}
          />
        )}
        {!done && plan.kind === 'qte' && (
          <QteMinigame
            interceptorStealth={interceptor ? interceptor.character.attributes.stealth : null}
            interceptorName={interceptor?.character.name}
            interceptorId={interceptor?.character.id}
            onStir={onStir}
            onFinish={handleFinish}
          />
        )}
        {!done && plan.kind === 'timing' && (
          <TimingMinigame onStir={onStir} onFinish={handleFinish} />
        )}
        {!done && isShowdown && villain && (
          <QteMinigame
            interceptorStealth={interceptor ? interceptor.character.attributes.stealth : null}
            interceptorName={interceptor?.character.name}
            interceptorId={interceptor?.character.id}
            sequenceLength={SHOWDOWN_QTE[villain].sequenceLength}
            timePerKeyScale={SHOWDOWN_QTE[villain].timePerKeyScale}
            onStir={onStir}
            onFinish={handleFinish}
          />
        )}

        {done && (
          <div className="flex flex-col gap-3">
            <div
              className={`p-3.5 rounded-xl border font-bold text-center ${OUTCOME_BANNER[done.outcome].classes}`}
            >
              {OUTCOME_BANNER[done.outcome].text}
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 text-sm flex flex-col gap-1.5">
              {done.lines.map((line, i) => (
                <span key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </span>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
