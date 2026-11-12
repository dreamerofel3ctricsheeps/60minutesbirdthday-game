import React, { useState } from 'react';
import { EventDefinition, EventChoice } from '@/types/game.types';
import { useRunStore } from '@/stores/run.store';
import { useEventStore } from '@/stores/event.store';
import { useGameStore } from '@/stores/game.store';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { EventSystem } from '@/game/systems/eventSystem';
import { EndingSystem } from '@/game/systems/endingSystem';
import { AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface EventModalProps {
  event: EventDefinition;
  onResolved: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onResolved }) => {
  const currentRun = useRunStore((s) => s.currentRun);
  const setEnding = useRunStore((s) => s.setEnding);
  const setPhase = useGameStore((s) => s.setPhase);
  const recordEventCompletion = useEventStore((s) => s.recordEventCompletion);

  const [selectedRoomieId, setSelectedRoomieId] = useState<string>('natalia');
  const [resolutionText, setResolutionText] = useState<string | null>(null);

  const handleSelectChoice = (choice: EventChoice) => {
    const character = CHARACTERS_DATA[selectedRoomieId] || CHARACTERS_DATA.natalia;

    if (choice.skillCheck) {
      const checkResult = EventSystem.resolveSkillCheck(
        character,
        choice.skillCheck.attribute,
        choice.skillCheck.difficulty
      );

      if (checkResult.outcome === 'FAILURE') {
        // Failed check: penalty
        EventSystem.applyConsequences([
          { type: 'MODIFY_METER', meter: 'suspicion', value: 15 },
          { type: 'MODIFY_METER', meter: 'morale', value: -10 },
        ]);
        setResolutionText(
          `Fallo (${checkResult.roll} + stat = ${checkResult.total} vs dif ${choice.skillCheck.difficulty}). ${character.name} no logró resolverlo de forma convincente.`
        );
      } else {
        EventSystem.applyConsequences(choice.consequences);
        setResolutionText(
          `¡Éxito (${checkResult.roll} + stat = ${checkResult.total})! ${character.name} manejó la situación eficazmente.`
        );
      }
    } else {
      EventSystem.applyConsequences(choice.consequences);
      setResolutionText(`Acción completada.`);
    }

    recordEventCompletion(event.id);

    // Check if any ending triggered
    setTimeout(() => {
      if (currentRun) {
        const potentialEnding = EndingSystem.evaluateEnding(currentRun);
        if (potentialEnding) {
          setEnding(potentialEnding.id);
          setPhase('ENDING');
          return;
        }
      }
      onResolved();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {event.type}
            </span>
            <h2 className="text-2xl font-bold text-slate-100">{event.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {event.description}
        </p>

        {/* Assigned Character Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Asignar Roomie para resolver:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(CHARACTERS_DATA).slice(0, 4).map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedRoomieId(char.id)}
                className={`p-2 rounded-lg border text-left text-xs transition-all ${
                  selectedRoomieId === char.id
                    ? 'bg-sky-950/80 border-sky-400 text-sky-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold truncate">{char.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{char.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Decisiones disponibles:
          </div>
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleSelectChoice(choice)}
              disabled={!!resolutionText}
              className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 hover:border-sky-500/60 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm text-slate-100 group-hover:text-sky-300">
                  {choice.label}
                </div>
                {choice.description && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {choice.description}
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        {resolutionText && (
          <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resolutionText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
