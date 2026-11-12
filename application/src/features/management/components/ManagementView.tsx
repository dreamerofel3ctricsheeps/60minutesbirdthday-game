import React, { useState } from 'react';
import { useRunStore } from '@/stores/run.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { MeterBar } from '@/components/ui/MeterBar';
import { EventModal } from '@/features/events/components/EventModal';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { THREAT_EVENTS } from '@/data/events/threats.data';
import { DAILY_EVENTS } from '@/data/events/dailyEvents.data';
import { EventDefinition } from '@/types/game.types';
import {
  Calendar,
  Utensils,
  Droplet,
  Zap,
  Eye,
  Heart,
  Volume2,
  Users,
  Box,
  FastForward,
} from 'lucide-react';

export const ManagementView: React.FC = () => {
  const currentRun = useRunStore((s) => s.currentRun);
  const advanceDay = useRunStore((s) => s.advanceDay);
  const strategicItems = useInventoryStore((s) => s.strategicItems);
  const useStrategicItem = useInventoryStore((s) => s.useStrategicItem);

  const [activeEvent, setActiveEvent] = useState<EventDefinition | null>(null);

  if (!currentRun) return null;

  const handleNextDay = () => {
    advanceDay();

    // Trigger an event based on day or chance
    const eventPool = [
      ...Object.values(THREAT_EVENTS),
      ...Object.values(DAILY_EVENTS),
    ];
    const pickedEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    setActiveEvent(pickedEvent);
  };

  const handleUseItem = (instanceId: string, itemId: string) => {
    const itemDef = ITEMS_DATA[itemId];
    if (!itemDef) return;

    useStrategicItem(instanceId);
    // Apply immediate effects
    itemDef.effects.forEach((eff) => {
      if (eff.type === 'MODIFY_METER' && eff.meter && eff.value) {
        useRunStore.getState().modifyMeter(eff.meter, eff.value);
      }
      if (eff.type === 'ADD_RESOURCE' && eff.resource && eff.value) {
        useRunStore.getState().modifyResource(eff.resource, eff.value);
      }
    });
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col p-6 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Fase de Gestión y Preparación
          </span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">
            Día {currentRun.day} / 5
          </h1>
        </div>

        {/* Resources Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
            <Utensils className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase text-slate-400">Comida:</span>
            <span className="font-mono font-bold text-base">{currentRun.resources.food}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
            <Droplet className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-bold uppercase text-slate-400">Agua:</span>
            <span className="font-mono font-bold text-base">{currentRun.resources.water}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-yellow-400">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase text-slate-400">Energía:</span>
            <span className="font-mono font-bold text-base">{currentRun.resources.energy}</span>
          </div>
        </div>

        {/* Advance Day Action */}
        <button
          onClick={handleNextDay}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-950/50"
        >
          <FastForward className="w-4 h-4" />
          <span>Avanzar Día</span>
        </button>
      </div>

      {/* Main Grid: Status, Roomies, Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
        {/* Column 1: Meters & Risk Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Estado de Riesgo del Departamento
          </h2>

          <MeterBar
            label="Sospecha de Ximena"
            value={currentRun.meters.suspicion}
            color={currentRun.meters.suspicion > 70 ? 'bg-red-500' : 'bg-amber-500'}
            icon={<Eye className="w-4 h-4 text-amber-400" />}
          />

          <MeterBar
            label="Moral del Grupo"
            value={currentRun.meters.morale}
            color={currentRun.meters.morale < 30 ? 'bg-red-500' : 'bg-emerald-500'}
            icon={<Heart className="w-4 h-4 text-rose-400" />}
          />

          <MeterBar
            label="Ruido y Vecinos"
            value={currentRun.meters.noise}
            color={currentRun.meters.noise > 70 ? 'bg-red-500' : 'bg-sky-500'}
            icon={<Volume2 className="w-4 h-4 text-sky-400" />}
          />

          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-slate-200">Consejo Estratégico:</div>
            <p>
              Mantén la sospecha por debajo del 100%. Si Ximena llega y encuentra el desastre, el cumpleaños terminará en catástrofe.
            </p>
          </div>
        </div>

        {/* Column 2: Roomies Roster */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              Roomies en el Departamento
            </h2>
            <span className="text-xs text-slate-500">7 disponibles</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 overflow-y-auto max-h-[380px] pr-1">
            {Object.values(CHARACTERS_DATA).map((char) => (
              <div
                key={char.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200">{char.name}</div>
                  <div className="text-xs text-slate-400">{char.role}</div>
                </div>
                <div className="flex gap-1.5 text-[11px] font-mono text-slate-300">
                  <span title="Lógica" className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">L:{char.attributes.logic}</span>
                  <span title="Carisma" className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">C:{char.attributes.charisma}</span>
                  <span title="Sigilo" className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">S:{char.attributes.stealth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Strategic Inventory */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-400" />
              Ítems en Resguardo ({strategicItems.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {strategicItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                No hay ítems en reserva.
              </div>
            ) : (
              strategicItems.map((instance) => {
                const def = ITEMS_DATA[instance.itemId];
                if (!def) return null;

                return (
                  <div
                    key={instance.instanceId}
                    className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-200">{def.name}</div>
                      <div className="text-xs text-slate-400">{def.description}</div>
                      <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                        Usos restantes: {instance.usesRemaining}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUseItem(instance.instanceId, def.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-100 rounded-lg transition-colors border border-slate-600 shrink-0"
                    >
                      Usar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Active Event Modal */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          onResolved={() => setActiveEvent(null)}
        />
      )}
    </div>
  );
};
