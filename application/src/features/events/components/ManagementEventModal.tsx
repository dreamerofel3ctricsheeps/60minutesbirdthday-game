import React, { useState } from 'react';
import {
  ManagementEventDefinition,
  EventChoice,
  CharacterDefinition,
} from '@/types/game.types';
import { useRunStore } from '@/stores/run.store';
import { EventSystem } from '@/game/systems/eventSystem';
import {
  MinigameOutcome,
  QTE_DESPERTAR_DELTAS,
  TIMING_DESPERTAR_DELTAS,
} from '@/game/systems/minigames';
import { QteMinigame } from './minigames/QteMinigame';
import { TimingMinigame } from './minigames/TimingMinigame';
import { AlertTriangle, CheckCircle2, MoonStar } from 'lucide-react';

export interface EventInterceptor {
  character: CharacterDefinition;
  isGuardian: boolean;
}

interface ManagementEventModalProps {
  event: ManagementEventDefinition;
  /** Quién intercepta (vigía > libre más sigiloso); null = nadie disponible. */
  interceptor: EventInterceptor | null;
  onStir?: () => void;
  onResolved: () => void;
}

const OUTCOME_TEXT: Record<MinigameOutcome, string> = {
  perfect: '¡Perfecto! Ni un solo ruido. Ximena ni se enteró.',
  partial: 'Funcionó, pero hubo un tropiezo: Ximena se revolvió en la cama.',
  fail: '¡Ruido! Ximena se revolvió fuerte y está mucho más cerca de despertar.',
};

/**
 * Modal de eventos de la gestión (Fase 3): despacha según el tipo del
 * framework — decisión clásica, QTE o timing — y aplica las consecuencias
 * al medidor DESPERTAR (y demás medidores en las decisiones).
 */
export const ManagementEventModal: React.FC<ManagementEventModalProps> = ({
  event,
  interceptor,
  onStir,
  onResolved,
}) => {
  const modifyMeter = useRunStore((s) => s.modifyMeter);
  const [resolution, setResolution] = useState<string | null>(null);

  const handleChoice = (choice: EventChoice) => {
    const actor = interceptor?.character;
    if (choice.skillCheck && actor) {
      const result = EventSystem.resolveSkillCheck(
        actor,
        choice.skillCheck.attribute,
        choice.skillCheck.difficulty
      );
      if (result.outcome === 'FAILURE') {
        EventSystem.applyConsequences([
          { type: 'MODIFY_METER', meter: 'despertar', value: 10 },
          { type: 'MODIFY_METER', meter: 'morale', value: -5 },
        ]);
        onStir?.();
        setResolution(
          `${actor.name} falló el chequeo (${result.total} vs ${choice.skillCheck.difficulty}). El ruido despertó un poco más a Ximena (+10 Despertar).`
        );
        return;
      }
      EventSystem.applyConsequences(choice.consequences);
      setResolution(`¡${actor.name} lo resolvió! (${result.total} vs ${choice.skillCheck.difficulty})`);
      return;
    }
    EventSystem.applyConsequences(choice.consequences);
    setResolution('Decisión tomada. El grupo contiene el aliento.');
  };

  const handleMinigameFinish = (outcome: MinigameOutcome) => {
    const delta =
      event.kind === 'minigame-qte'
        ? QTE_DESPERTAR_DELTAS[outcome]
        : TIMING_DESPERTAR_DELTAS[outcome];
    modifyMeter('despertar', delta);
    if (outcome === 'fail') onStir?.();
    setResolution(
      `${OUTCOME_TEXT[outcome]} (${delta >= 0 ? '+' : ''}${delta} Despertar)`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-red-900/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
              <MoonStar className="w-3.5 h-3.5" />
              {event.kind === 'choice'
                ? 'Disturbio — decisión'
                : event.kind === 'minigame-qte'
                  ? 'Disturbio — ¡minijuego QTE!'
                  : 'Disturbio — ¡minijuego de timing!'}
            </span>
            <h2 className="text-2xl font-bold text-slate-100">{event.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {event.description}
        </p>

        <div className="text-xs text-slate-400">
          {interceptor ? (
            <>
              Intercepta:{' '}
              <span className="font-bold text-sky-300">{interceptor.character.name}</span>{' '}
              (Sigilo {interceptor.character.attributes.stealth})
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

        {!resolution && event.kind === 'choice' && (
          <div className="flex flex-col gap-2.5">
            {event.choices?.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:border-red-400/60 text-left transition-all"
              >
                <div className="font-semibold text-sm text-slate-100">{choice.label}</div>
                {choice.description && (
                  <div className="text-xs text-slate-400 mt-0.5">{choice.description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {!resolution && event.kind === 'minigame-qte' && (
          <>
            {event.minigameHint && (
              <p className="text-xs text-slate-400 text-center">{event.minigameHint}</p>
            )}
            <QteMinigame
              interceptorStealth={interceptor ? interceptor.character.attributes.stealth : null}
              interceptorName={interceptor?.character.name}
              interceptorId={interceptor?.character.id}
              onStir={onStir}
              onFinish={handleMinigameFinish}
            />
          </>
        )}

        {!resolution && event.kind === 'minigame-timing' && (
          <>
            {event.minigameHint && (
              <p className="text-xs text-slate-400 text-center">{event.minigameHint}</p>
            )}
            <TimingMinigame onStir={onStir} onFinish={handleMinigameFinish} />
          </>
        )}

        {resolution && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resolution}</span>
            </div>
            <button
              onClick={onResolved}
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
