import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRunStore } from '@/stores/run.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { useGameStore } from '@/stores/game.store';
import { MeterBar } from '@/components/ui/MeterBar';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { getItemSpriteUrl } from '@/data/items/itemSprites.data';
import { ALL_TASKS, TASKS_DATA } from '@/data/management/tasks.data';
import { getBeatAtHour } from '@/data/events/storyBeats.data';
import { getManagementEvent } from '@/data/events/managementEvents.data';
import {
  StoryBeat,
  ManagementEventDefinition,
  CharacterRunState,
} from '@/types/game.types';
import {
  formatHour,
  pickInterceptor,
  rollRandomEvent,
  isCharacterFree,
} from '@/game/systems/managementSystem';
import { EndingSystem } from '@/game/systems/endingSystem';
import {
  ManagementEventModal,
  EventInterceptor,
} from '@/features/events/components/ManagementEventModal';
import { RoomieSprite2D } from './RoomieSprite2D';
import { XimenaBed } from './XimenaBed';
import {
  MANAGEMENT_END_HOUR,
  VICTORY_PREPARATION_THRESHOLD,
  ITEM_PREPARATION_BONUS,
  ITEM_PREPARATION_BONUS_CAP,
} from '@/game/core/balance';
import {
  Clock,
  MoonStar,
  PartyPopper,
  Heart,
  FastForward,
  MousePointerClick,
  ScrollText,
} from 'lucide-react';

/**
 * Fase de gestión (Fase 3): JUEGO DE GESTIÓN en una ESCENA 2D nueva
 * (vista lateral tipo casa de muñecas, DOM/CSS + sprites), ya no un
 * dashboard. Aquí viven el reloj por horas (7:00 → 00:00), las tareas
 * con duración, los beats de historia y los eventos/minijuegos.
 */
export const ManagementView: React.FC = () => {
  const currentRun = useRunStore((s) => s.currentRun);
  const advanceHour = useRunStore((s) => s.advanceHour);
  const assignManagementTask = useRunStore((s) => s.assignManagementTask);
  const modifyMeter = useRunStore((s) => s.modifyMeter);
  const setEnding = useRunStore((s) => s.setEnding);
  const setPhase = useGameStore((s) => s.setPhase);
  const strategicItems = useInventoryStore((s) => s.strategicItems);

  const [selectedRoomieId, setSelectedRoomieId] = useState<string | null>(null);
  const [activeBeat, setActiveBeat] = useState<StoryBeat | null>(() =>
    getBeatAtHour(7) ?? null
  );
  const [beatLine, setBeatLine] = useState(0);
  const [activeEvent, setActiveEvent] = useState<ManagementEventDefinition | null>(null);
  const [eventInterceptor, setEventInterceptor] = useState<EventInterceptor | null>(null);
  const [stirSignal, setStirSignal] = useState(0);
  const [log, setLog] = useState<string[]>([
    'La gestión empezó: Ximena duerme, el reloj corre.',
  ]);
  const stirTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsBonusApplied = useRef(false);

  const stealthMap = useMemo(() => {
    const map: Record<string, number> = {};
    Object.values(CHARACTERS_DATA).forEach((c) => (map[c.id] = c.attributes.stealth));
    return map;
  }, []);

  // Los ítems recogidos, exhibidos en la repisa, ya son media fiesta:
  // preparación inicial según cuántos se resguardaron (una sola vez).
  useEffect(() => {
    if (!currentRun || itemsBonusApplied.current) return;
    itemsBonusApplied.current = true;
    if (strategicItems.length > 0 && currentRun.meters.preparacion === 0) {
      const bonus = Math.min(
        ITEM_PREPARATION_BONUS_CAP,
        strategicItems.length * ITEM_PREPARATION_BONUS
      );
      modifyMeter('preparacion', bonus);
      setLog((l) => [
        `Los ${strategicItems.length} ítems de la repisa ya aportan +${bonus} de Preparación.`,
        ...l,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun?.id]);

  if (!currentRun) return null;
  const run = currentRun;
  const party = run.characters.filter((c) => c.available);
  const busy = !!activeEvent || !!activeBeat;

  const pushLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 5));

  const stir = () => {
    setStirSignal((s) => s + 1);
    if (stirTimeout.current) clearTimeout(stirTimeout.current);
    stirTimeout.current = setTimeout(() => setStirSignal(0), 1400);
  };

  const checkEnding = (): boolean => {
    const latest = useRunStore.getState().currentRun;
    if (!latest) return false;
    const ending = EndingSystem.evaluateEnding(latest);
    if (ending) {
      setEnding(ending.id);
      setPhase('ENDING');
      return true;
    }
    return false;
  };

  const launchEvent = (def: ManagementEventDefinition) => {
    const latest = useRunStore.getState().currentRun;
    const picked = latest ? pickInterceptor(latest, stealthMap) : null;
    setEventInterceptor(
      picked
        ? { character: CHARACTERS_DATA[picked.characterId], isGuardian: picked.isGuardian }
        : null
    );
    setActiveEvent(def);
  };

  const handleAdvanceHour = () => {
    if (busy) return;
    setSelectedRoomieId(null);
    const result = advanceHour();
    if (!result) return;

    result.completedTasks.forEach((ct) => {
      const name = CHARACTERS_DATA[ct.characterId]?.name ?? ct.characterId;
      pushLog(
        `✔ ${name} terminó "${ct.task.name}" (+${ct.preparationGained} Preparación${
          ct.despertarDelta !== 0
            ? `, ${ct.despertarDelta > 0 ? '+' : ''}${ct.despertarDelta} Despertar`
            : ''
        }).`
      );
    });

    if (checkEnding()) return;

    const beat = getBeatAtHour(result.run.hour);
    if (beat) {
      setActiveBeat(beat);
      setBeatLine(0);
      return;
    }
    const randomEvent = rollRandomEvent(Math.random);
    if (randomEvent) launchEvent(randomEvent);
  };

  const handleBeatNext = () => {
    if (!activeBeat) return;
    if (beatLine < activeBeat.lines.length - 1) {
      setBeatLine(beatLine + 1);
      return;
    }
    const eventId = activeBeat.eventId;
    setActiveBeat(null);
    setBeatLine(0);
    if (eventId) {
      const def = getManagementEvent(eventId);
      if (def) launchEvent(def);
    }
  };

  const handleEventResolved = () => {
    setActiveEvent(null);
    checkEnding();
  };

  const handleAssign = (taskId: string) => {
    if (!selectedRoomieId) return;
    const ok = assignManagementTask(selectedRoomieId, taskId);
    if (ok) {
      const task = TASKS_DATA[taskId];
      pushLog(
        `${CHARACTERS_DATA[selectedRoomieId]?.name} empezó "${task.name}" (${task.durationHours}h).`
      );
      setSelectedRoomieId(null);
    }
  };

  /** Roomies visibles en una zona: los ocupados van a la zona de su tarea; los libres, a la sala. */
  const roomiesInZone = (zone: 'sala' | 'cocina' | 'puerta') =>
    party.filter((c) => {
      if (zone === 'puerta') return c.currentTaskId === 'vigia';
      if (!c.currentTaskId) return zone === 'sala';
      return TASKS_DATA[c.currentTaskId]?.zone === zone;
    });

  const renderRoomie = (c: CharacterRunState) => {
    const def = CHARACTERS_DATA[c.characterId];
    const free = isCharacterFree(run, c.characterId);
    const task = c.currentTaskId ? TASKS_DATA[c.currentTaskId] : null;
    const progress =
      task && c.taskStartedHour !== undefined
        ? Math.min(100, ((run.hour - c.taskStartedHour) / task.durationHours) * 100)
        : 0;

    return (
      <button
        key={c.characterId}
        onClick={() => free && setSelectedRoomieId(c.characterId)}
        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
          free
            ? 'hover:bg-white/10 cursor-pointer'
            : 'cursor-default opacity-95'
        } ${selectedRoomieId === c.characterId ? 'bg-sky-500/20 ring-2 ring-sky-400' : ''}`}
        title={free ? `Asignar tarea a ${def?.name}` : `${def?.name} está ocupado`}
      >
        <RoomieSprite2D characterId={c.characterId} size={62} bob={!task} title={def?.name} />
        <span className="text-[11px] font-bold text-slate-100 leading-none">{def?.name}</span>
        {task ? (
          <span className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-amber-300 leading-none">
              {task.icon} {task.name}
            </span>
            <span className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <span className="block h-full bg-amber-400" style={{ width: `${progress}%` }} />
            </span>
            <span className="text-[9px] text-slate-400 leading-none">
              termina {c.busyUntilHour !== undefined ? formatHour(c.busyUntilHour) : ''}
            </span>
          </span>
        ) : (
          <span className="text-[10px] text-emerald-300 leading-none">Libre</span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* HUD superior */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 bg-slate-900/90 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span className="text-2xl font-black font-mono text-slate-100">
            {formatHour(run.hour)}
          </span>
          <span className="text-xs text-slate-400">/ 00:00 · fiesta a medianoche</span>
        </div>

        <div className="flex items-center gap-5 flex-1 min-w-[340px]">
          <MeterBar
            label="Despertar"
            value={run.meters.despertar}
            color={run.meters.despertar >= 70 ? 'bg-red-500' : run.meters.despertar >= 40 ? 'bg-amber-500' : 'bg-sky-500'}
            icon={<MoonStar className="w-4 h-4 text-sky-300" />}
          />
          <MeterBar
            label={`Preparación (meta ${VICTORY_PREPARATION_THRESHOLD})`}
            value={run.meters.preparacion}
            color={run.meters.preparacion >= VICTORY_PREPARATION_THRESHOLD ? 'bg-emerald-500' : 'bg-amber-500'}
            icon={<PartyPopper className="w-4 h-4 text-amber-300" />}
          />
          <MeterBar
            label="Moral"
            value={run.meters.morale}
            color={run.meters.morale < 30 ? 'bg-red-500' : 'bg-emerald-500'}
            icon={<Heart className="w-4 h-4 text-rose-400" />}
          />
        </div>

        <button
          onClick={handleAdvanceHour}
          disabled={busy || run.hour >= MANAGEMENT_END_HOUR}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg"
        >
          <FastForward className="w-4 h-4" />
          Avanzar 1 hora
        </button>
      </header>

      {/* ESCENA 2D */}
      <div className="flex-1 grid grid-cols-12 min-h-0">
        {/* COCINA / ZONA DE TRABAJO */}
        <section className="col-span-3 relative bg-gradient-to-b from-orange-950/70 via-[#241612] to-[#17100c] border-r-4 border-amber-950 p-3 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-300/90">
            🍳 Cocina
          </h3>
          <div className="mt-2 h-10 rounded bg-orange-900/40 border border-orange-800/50 flex items-center px-2 text-[10px] text-orange-200/70">
            cocina · horno · la prueba de sonido de Alan
          </div>
          <div className="flex-1 flex items-end justify-center gap-1 flex-wrap content-end pb-1">
            {roomiesInZone('cocina').map(renderRoomie)}
          </div>
          <div className="h-2 rounded bg-amber-950" />
        </section>

        {/* SALA / CUARTO SEGURO */}
        <section className="col-span-5 relative bg-gradient-to-b from-indigo-950/80 via-[#161a2e] to-[#101222] border-r-4 border-indigo-950 p-3 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300/90">
            🛋️ Sala — cuarto seguro
          </h3>

          {/* Repisa de ítems recogidos */}
          <div className="mt-2 rounded-lg bg-black/30 border border-indigo-800/50 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300/80 mb-1">
              Ítems resguardados ({strategicItems.length})
            </div>
            {strategicItems.length === 0 ? (
              <div className="text-[11px] text-slate-500">La repisa está vacía… la recolección no dejó nada.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {strategicItems.map((inst) => (
                  <img
                    key={inst.instanceId}
                    src={getItemSpriteUrl(inst.itemId)}
                    alt={ITEMS_DATA[inst.itemId]?.name ?? inst.itemId}
                    title={ITEMS_DATA[inst.itemId]?.name ?? inst.itemId}
                    className="w-9 h-9 object-contain rounded bg-slate-800/70 border border-slate-700 p-0.5 pixelated"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-end justify-center gap-1 flex-wrap content-end pb-1">
            {roomiesInZone('sala').map(renderRoomie)}
          </div>
          <div className="h-2 rounded bg-indigo-950" />
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" /> Click en un roomie LIBRE para asignarle una tarea.
          </p>
        </section>

        {/* CUARTO DE XIMENA */}
        <section className="col-span-4 relative bg-gradient-to-b from-violet-950/90 via-[#1d1430] to-[#130d20] p-3 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-violet-300/90">
            🛏️ Cuarto de Ximena — ¡silencio!
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <XimenaBed despertar={run.meters.despertar} stirSignal={stirSignal} />
          </div>

          {/* Puerta + vigía */}
          <div className="flex items-end gap-2">
            <div className="w-10 h-24 rounded-t-lg bg-amber-950 border-2 border-amber-900 flex items-start justify-center pt-1 text-[9px] text-amber-200/70 [writing-mode:vertical-rl]">
              PUERTA
            </div>
            <div className="flex gap-1 items-end min-h-[104px]">
              {roomiesInZone('puerta').map(renderRoomie)}
            </div>
            {roomiesInZone('puerta').length === 0 && (
              <span className="text-[10px] text-slate-500 pb-2">sin vigía 😬</span>
            )}
          </div>
          <div className="h-2 rounded bg-violet-950 mt-1" />
        </section>
      </div>

      {/* Panel de asignación de tareas */}
      {selectedRoomieId && (
        <div className="bg-slate-900 border-t-2 border-sky-700 px-5 py-3 z-10">
          <div className="text-sm font-bold text-slate-100 mb-2">
            Asignar tarea a {CHARACTERS_DATA[selectedRoomieId]?.name} —{' '}
            <span className="text-slate-400 font-normal">
              Sigilo {CHARACTERS_DATA[selectedRoomieId]?.attributes.stealth} · Lógica{' '}
              {CHARACTERS_DATA[selectedRoomieId]?.attributes.logic} · Carisma{' '}
              {CHARACTERS_DATA[selectedRoomieId]?.attributes.charisma}
            </span>
            <button
              onClick={() => setSelectedRoomieId(null)}
              className="ml-3 text-xs text-slate-400 underline"
            >
              cancelar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TASKS.map((task) => {
              const fits = run.hour + task.durationHours <= MANAGEMENT_END_HOUR;
              const affinity = task.affinityCharacterIds?.includes(selectedRoomieId);
              return (
                <button
                  key={task.id}
                  disabled={!fits}
                  onClick={() => handleAssign(task.id)}
                  title={task.description}
                  className={`px-3 py-2 rounded-xl border text-left text-xs transition-all ${
                    fits
                      ? 'bg-slate-800 border-slate-600 hover:border-sky-400 text-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-bold">
                    {task.icon} {task.name}
                  </span>{' '}
                  <span className="text-slate-400">
                    {task.durationHours}h · +{task.preparationGain} prep · ruido {task.noise}
                    {affinity && <span className="text-emerald-300 font-bold"> · ¡AFÍN! (+50% prep, -2 ruido)</span>}
                    {!fits && ' · no cabe antes de las 00:00'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Registro de la partida */}
      <footer className="bg-slate-900/80 border-t border-slate-800 px-5 py-2">
        <div className="flex items-start gap-2 text-[11px] text-slate-400">
          <ScrollText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            {log.map((line, i) => (
              <span key={i} className={i === 0 ? 'text-slate-200' : undefined}>
                {line}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Caja de diálogo de la historia (beats) */}
      {activeBeat && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl bg-slate-900/97 border-2 border-violet-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur">
            <div className="text-xs font-black uppercase tracking-widest text-violet-300 mb-1.5">
              {activeBeat.title}
            </div>
            <p className="text-sm text-slate-100 leading-relaxed min-h-[44px]">
              {activeBeat.lines[beatLine]}
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleBeatNext}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg"
              >
                {beatLine < activeBeat.lines.length - 1 ? 'Siguiente ▸' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evento / minijuego activo */}
      {activeEvent && (
        <ManagementEventModal
          event={activeEvent}
          interceptor={eventInterceptor}
          onStir={stir}
          onResolved={handleEventResolved}
        />
      )}
    </div>
  );
};
