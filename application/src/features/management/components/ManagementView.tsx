import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRunStore } from '@/stores/run.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { useGameStore } from '@/stores/game.store';
import { MeterBar } from '@/components/ui/MeterBar';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { getItemSpriteUrl } from '@/data/items/itemSprites.data';
import { ALL_TASKS, TASKS_DATA } from '@/data/management/tasks.data';
import { getManagementEvent } from '@/data/events/managementEvents.data';
import {
  getThreadsAtHour,
  WhatsappThread,
  SceneAction,
} from '@/data/events/whatsapp.data';
import {
  EventChoice,
  CharacterRunState,
  VillainId,
} from '@/types/game.types';
import {
  formatHour,
  pickInterceptor,
  isCharacterFree,
} from '@/game/systems/managementSystem';
import { getHourMinigame, HOUR_MINIGAME_EFFECTS } from '@/game/systems/hourMinigames';
import { MinigameOutcome } from '@/game/systems/minigames';
import {
  getVillains,
  isVillainActive,
  VILLAIN_ZONES,
} from '@/game/systems/villainSystem';
import { EventSystem } from '@/game/systems/eventSystem';
import { EndingSystem } from '@/game/systems/endingSystem';
import {
  HourMinigameModal,
  MinigameParticipant,
} from '@/features/events/components/HourMinigameModal';
import { WhatsappPanel, ChatDisplayMessage } from './WhatsappPanel';
import { RoomieSprite2D } from './RoomieSprite2D';
import { XimenaBed } from './XimenaBed';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import { JOSE_SPRITES, CAT_SPRITES } from '@/data/characters/villainSprites.data';
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
  MousePointerClick,
  ScrollText,
  Dices,
} from 'lucide-react';

/**
 * Fase de gestión (Fase 4): juego de gestión en la ESCENA 2D con tres
 * capas vivas:
 *  - HISTORIA POR WHATSAPP: los beats llegan como mensajes al grupo de
 *    los amigos (WhatsappPanel) y las decisiones se responden ahí.
 *  - MINIJUEGO POR HORA: "Resolver hora" abre el minijuego de la hora
 *    (rotación Mario Party por zonas; showdown si un villano espera en
 *    la puerta) y su resultado resuelve la hora (hourResolution).
 *  - VILLANOS EN ESCENA: Jose y su gato avanzan por las zonas del mapa
 *    hacia el cuarto de Ximena; se les ve en su zona y el vigía (tarea
 *    'vigia') puede retrasarlos.
 */
export const ManagementView: React.FC = () => {
  const currentRun = useRunStore((s) => s.currentRun);
  const applyHourResolution = useRunStore((s) => s.applyHourResolution);
  const assignManagementTask = useRunStore((s) => s.assignManagementTask);
  const modifyMeter = useRunStore((s) => s.modifyMeter);
  const setEnding = useRunStore((s) => s.setEnding);
  const setPhase = useGameStore((s) => s.setPhase);
  const protagonistId = useGameStore((s) => s.selectedCharacterId);
  const strategicItems = useInventoryStore((s) => s.strategicItems);

  const [selectedRoomieId, setSelectedRoomieId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatDisplayMessage[]>([]);
  const [pendingThreads, setPendingThreads] = useState<WhatsappThread[]>([]);
  const [pendingChoice, setPendingChoice] = useState<{
    eventId: string;
    choices: EventChoice[];
  } | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<ReturnType<typeof getHourMinigame> | null>(null);
  const [minigameInterceptor, setMinigameInterceptor] = useState<MinigameParticipant | null>(null);
  const [sceneAction, setSceneAction] = useState<{ kind: SceneAction; nonce: number } | null>(null);
  const [stirSignal, setStirSignal] = useState(0);
  const [log, setLog] = useState<string[]>([
    'La gestión empezó: Ximena duerme, el grupo de WhatsApp está activo y cada hora trae un minijuego.',
  ]);
  const stirTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneActionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsBonusApplied = useRef(false);
  const deliveredHourRef = useRef<number | null>(null);
  const msgCounter = useRef(0);

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

  // Al llegar a una hora nueva, se encolan sus hilos de WhatsApp.
  const currentHour = currentRun?.hour;
  useEffect(() => {
    if (currentHour === undefined) return;
    if (deliveredHourRef.current === currentHour) return;
    deliveredHourRef.current = currentHour;
    const threads = getThreadsAtHour(currentHour);
    if (threads.length > 0) setPendingThreads((q) => [...q, ...threads]);
  }, [currentHour]);

  // Entrega de hilos, uno a uno: si un hilo trae decisión, se espera la
  // respuesta del jugador antes de entregar el siguiente.
  useEffect(() => {
    if (pendingChoice || activeMinigame || pendingThreads.length === 0) return;
    const [thread, ...rest] = pendingThreads;
    setPendingThreads(rest);
    setChatMessages((msgs) => [
      ...msgs,
      ...thread.messages.map((m) => ({
        id: `chat_${++msgCounter.current}`,
        fromId: m.fromId,
        text: m.text,
      })),
    ]);
    if (thread.sceneAction) triggerSceneAction(thread.sceneAction);
    if (thread.choiceEventId) {
      const def = getManagementEvent(thread.choiceEventId);
      if (def?.choices) {
        setPendingChoice({ eventId: def.id, choices: def.choices });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingThreads, pendingChoice, activeMinigame]);

  if (!currentRun) return null;
  const run = currentRun;
  const party = run.characters.filter((c) => c.available);
  const partyIds = party.map((c) => c.characterId);
  const protagonist = CHARACTERS_DATA[protagonistId] ?? CHARACTERS_DATA.natalia;
  const flowBusy = !!pendingChoice || !!activeMinigame || pendingThreads.length > 0;
  const nextPlan = getHourMinigame(run);

  const villains = getVillains(run);
  const catActive = isVillainActive('gato', run.hour);
  const joseActive = isVillainActive('jose', run.hour);

  const pushLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 5));

  const stir = () => {
    setStirSignal((s) => s + 1);
    if (stirTimeout.current) clearTimeout(stirTimeout.current);
    stirTimeout.current = setTimeout(() => setStirSignal(0), 1400);
  };

  function triggerSceneAction(kind: SceneAction) {
    if (kind === 'ximena-stir') {
      stir();
      return;
    }
    setSceneAction({ kind, nonce: Date.now() });
    if (sceneActionTimeout.current) clearTimeout(sceneActionTimeout.current);
    sceneActionTimeout.current = setTimeout(() => setSceneAction(null), 3600);
  }

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

  // --- WhatsApp: el jugador responde una decisión del grupo ---
  const handlePickChoice = (choice: EventChoice) => {
    setChatMessages((msgs) => [
      ...msgs,
      { id: `chat_${++msgCounter.current}`, fromId: 'protagonist', text: choice.label },
    ]);

    let reaction = 'uff… listo 😮‍💨';
    if (choice.skillCheck) {
      const result = EventSystem.resolveSkillCheck(
        protagonist,
        choice.skillCheck.attribute,
        choice.skillCheck.difficulty
      );
      if (result.outcome === 'FAILURE') {
        EventSystem.applyConsequences([
          { type: 'MODIFY_METER', meter: 'despertar', value: 10 },
          { type: 'MODIFY_METER', meter: 'morale', value: -5 },
        ]);
        stir();
        reaction = '¡hizo ruido! Ximena se revolvió fuerte 😱';
        pushLog(
          `✖ ${protagonist.name} falló el chequeo de "${choice.label}" (${result.total} vs ${choice.skillCheck.difficulty}): +10 Despertar, −5 Moral.`
        );
      } else {
        EventSystem.applyConsequences(choice.consequences);
        reaction = '¡salió bien! sigamos 🤫';
        pushLog(
          `✔ ${protagonist.name} resolvió "${choice.label}" (${result.total} vs ${choice.skillCheck.difficulty}).`
        );
      }
    } else {
      EventSystem.applyConsequences(choice.consequences);
      pushLog(`✔ Decisión del grupo: "${choice.label}".`);
    }

    setChatMessages((msgs) => [
      ...msgs,
      { id: `chat_${++msgCounter.current}`, fromId: 'amigo', text: reaction },
    ]);
    setPendingChoice(null);
    checkEnding();
  };

  // --- Resolver la hora: se juega el minijuego de la hora ---
  const handleResolveHour = () => {
    if (flowBusy || run.hour >= MANAGEMENT_END_HOUR) return;
    setSelectedRoomieId(null);
    const picked = pickInterceptor(run, stealthMap);
    setMinigameInterceptor(
      picked
        ? { character: CHARACTERS_DATA[picked.characterId], isGuardian: picked.isGuardian }
        : null
    );
    setActiveMinigame(getHourMinigame(run));
  };

  const handleMinigameOutcome = (outcome: MinigameOutcome): string[] => {
    const result = applyHourResolution(outcome);
    if (!result) return ['La hora se resolvió.'];

    const lines: string[] = [];
    result.completedTasks.forEach((ct) => {
      const name = CHARACTERS_DATA[ct.characterId]?.name ?? ct.characterId;
      const line = `✔ ${name} terminó "${ct.task.name}" (+${ct.preparationGained} Preparación${
        ct.despertarDelta !== 0
          ? `, ${ct.despertarDelta > 0 ? '+' : ''}${ct.despertarDelta} Despertar`
          : ''
      })`;
      lines.push(line);
      pushLog(line);
    });

    if (result.plan.kind !== 'showdown') {
      const fx = HOUR_MINIGAME_EFFECTS[outcome];
      if (fx.preparacion !== 0 || fx.despertar !== 0) {
        lines.push(
          `🎲 Minijuego de la hora: ${fx.preparacion !== 0 ? `+${fx.preparacion} Preparación` : ''}${
            fx.preparacion !== 0 && fx.despertar !== 0 ? ' · ' : ''
          }${fx.despertar !== 0 ? `${fx.despertar > 0 ? '+' : ''}${fx.despertar} Despertar` : ''}.`
        );
      }
    }
    result.summary.forEach((s) => {
      lines.push(s);
      pushLog(s);
    });

    if (result.catBreach || outcome === 'fail') stir();
    return lines;
  };

  const handleMinigameClose = () => {
    setActiveMinigame(null);
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

  /** Villanos presentes en una sección de la escena, según su zona actual. */
  const villainsInSection = (section: 'cocina' | 'sala' | 'cuarto'): VillainId[] => {
    const ids: VillainId[] = [];
    const zoneIdxOf = (id: VillainId) => (id === 'gato' ? villains.gatoZone : villains.joseZone);
    const activeOf = (id: VillainId) => (id === 'gato' ? catActive : joseActive);
    (['gato', 'jose'] as VillainId[]).forEach((id) => {
      if (!activeOf(id)) return;
      const z = zoneIdxOf(id);
      if (section === 'cocina' && (z === 0 || z === 1)) ids.push(id);
      if (section === 'sala' && z === 2) ids.push(id);
      if (section === 'cuarto' && (z === 3 || z === 4)) ids.push(id);
    });
    return ids;
  };

  const renderVillain = (id: VillainId) => {
    const zoneIdx = id === 'gato' ? villains.gatoZone : villains.joseZone;
    const zoneName = VILLAIN_ZONES[zoneIdx];
    if (id === 'gato') {
      return (
        <div key="villain-gato" className="flex flex-col items-center gap-0.5 p-1" title="El gato de Jose">
          <DefinedSprite2D anim={CAT_SPRITES.idle} height={30} cycleMs={900} />
          <span className="text-[9px] font-bold text-orange-300 leading-none bg-black/50 rounded px-1 py-0.5">
            🐱 gato · {zoneName}
          </span>
        </div>
      );
    }
    const atDoor = zoneIdx === 3;
    return (
      <div key="villain-jose" className="flex flex-col items-center gap-0.5 p-1" title="Jose, el villano rival">
        <DefinedSprite2D
          anim={atDoor ? JOSE_SPRITES.sneak : JOSE_SPRITES.idle}
          height={56}
          cycleMs={800}
        />
        <span
          className={`text-[9px] font-bold leading-none rounded px-1 py-0.5 ${
            atDoor ? 'text-red-200 bg-red-950/80 pulse-soft' : 'text-red-300 bg-black/50'
          }`}
        >
          😼 Jose · {zoneName}
        </span>
      </div>
    );
  };

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
        <RoomieSprite2D characterId={c.characterId} size={62} bob={!task} busy={!!task} title={def?.name} />
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

  const highlightFor = (section: 'cocina' | 'sala' | 'cuarto'): string => {
    if (!activeMinigame) return '';
    const z = activeMinigame.zone;
    const hit =
      (section === 'cocina' && z === 'cocina') ||
      (section === 'sala' && z === 'sala') ||
      (section === 'cuarto' && (z === 'puerta' || z === 'bano'));
    return hit ? 'ring-4 ring-inset ring-amber-400/60 z-10' : '';
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

        {(catActive || joseActive) && (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-slate-400 uppercase tracking-wider">Villanos:</span>
            {catActive && (
              <span className="px-2 py-1 rounded-full bg-orange-950/80 border border-orange-700/60 text-orange-200">
                🐱 gato → {VILLAIN_ZONES[villains.gatoZone]}
              </span>
            )}
            {joseActive && (
              <span className="px-2 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-200">
                😼 Jose → {VILLAIN_ZONES[villains.joseZone]}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleResolveHour}
          disabled={flowBusy || run.hour >= MANAGEMENT_END_HOUR}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg"
          title={
            pendingChoice
              ? 'Primero responde la decisión del grupo de WhatsApp'
              : `Juega "${nextPlan.title}" y resuelve la hora`
          }
        >
          <Dices className="w-4 h-4" />
          Resolver hora · {nextPlan.title}
        </button>
      </header>

      {/* Cuerpo: escena + panel de WhatsApp */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* ESCENA 2D */}
          <div className="relative flex-1 grid grid-cols-12 min-h-0">
            {/* COCINA / ZONA DE TRABAJO (+ balcón/exterior a la izquierda) */}
            <section className={`col-span-3 relative bg-gradient-to-b from-orange-950/70 via-[#241612] to-[#17100c] border-r-4 border-amber-950 p-3 flex flex-col ${highlightFor('cocina')}`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-orange-300/90">
                🍳 Cocina
              </h3>
              <div className="mt-2 h-10 rounded bg-orange-900/40 border border-orange-800/50 flex items-center px-2 text-[10px] text-orange-200/70">
                cocina · horno · balcón a la izquierda 👈
              </div>
              <div className="flex-1 flex items-end justify-center gap-1 flex-wrap content-end pb-1">
                {roomiesInZone('cocina').map(renderRoomie)}
                {villainsInSection('cocina').map(renderVillain)}
              </div>
              <div className="h-2 rounded bg-amber-950" />
            </section>

            {/* SALA / CUARTO SEGURO */}
            <section className={`col-span-5 relative bg-gradient-to-b from-indigo-950/80 via-[#161a2e] to-[#101222] border-r-4 border-indigo-950 p-3 flex flex-col ${highlightFor('sala')}`}>
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
                {villainsInSection('sala').map(renderVillain)}
              </div>
              <div className="h-2 rounded bg-indigo-950" />
              <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Click en un roomie LIBRE para asignarle una tarea.
              </p>
            </section>

            {/* CUARTO DE XIMENA */}
            <section className={`col-span-4 relative bg-gradient-to-b from-violet-950/90 via-[#1d1430] to-[#130d20] p-3 flex flex-col ${highlightFor('cuarto')}`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-violet-300/90">
                🛏️ Cuarto de Ximena — ¡silencio!
              </h3>

              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <XimenaBed despertar={run.meters.despertar} stirSignal={stirSignal} />
              </div>

              {/* Puerta + vigía + villanos que llegaron hasta aquí */}
              <div className="flex items-end gap-2">
                <div className="w-10 h-24 rounded-t-lg bg-amber-950 border-2 border-amber-900 flex items-start justify-center pt-1 text-[9px] text-amber-200/70 [writing-mode:vertical-rl]">
                  PUERTA
                </div>
                <div className="flex gap-1 items-end min-h-[104px] flex-wrap">
                  {roomiesInZone('puerta').map(renderRoomie)}
                  {villainsInSection('cuarto').map(renderVillain)}
                </div>
                {roomiesInZone('puerta').length === 0 && (
                  <span className="text-[10px] text-slate-500 pb-2">sin vigía 😬</span>
                )}
              </div>
              <div className="h-2 rounded bg-violet-950 mt-1" />
            </section>

            {/* ACCIONES EN ESCENA (historia por acciones) */}
            {sceneAction?.kind === 'cat-prowl' && (
              <div
                key={sceneAction.nonce}
                className="scene-cat-prowl absolute bottom-14 z-30 pointer-events-none"
              >
                <DefinedSprite2D anim={CAT_SPRITES.prowl} height={34} cycleMs={170} />
              </div>
            )}
            {sceneAction?.kind === 'jose-peek' && (
              <div
                key={sceneAction.nonce}
                className="scene-jose-peek absolute bottom-3 right-[16%] z-30 pointer-events-none"
              >
                <DefinedSprite2D anim={JOSE_SPRITES.sneak} height={78} />
              </div>
            )}
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

          {/* Registro mecánico de la partida */}
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
        </div>

        {/* GRUPO DE WHATSAPP: historia y decisiones */}
        <div className="h-[300px] lg:h-auto lg:w-[330px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-emerald-950 min-h-0">
          <WhatsappPanel
            messages={chatMessages}
            pendingChoices={pendingChoice?.choices ?? null}
            onPickChoice={handlePickChoice}
            partyIds={partyIds}
            protagonistId={protagonistId}
          />
        </div>
      </div>

      {/* Minijuego de la hora (o showdown) */}
      {activeMinigame && (
        <HourMinigameModal
          plan={activeMinigame}
          interceptor={minigameInterceptor}
          protagonist={protagonist}
          onStir={stir}
          onOutcome={handleMinigameOutcome}
          onClose={handleMinigameClose}
        />
      )}
    </div>
  );
};
