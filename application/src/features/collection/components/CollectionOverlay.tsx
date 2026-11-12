import React, { useEffect, useState } from 'react';
import { useInventoryStore, selectUsedSlots } from '@/stores/inventory.store';
import { useGameStore } from '@/stores/game.store';
import { useRunStore } from '@/stores/run.store';
import { ITEMS_DATA } from '@/data/items/items.data';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { MAX_COLLECTED_ROOMIES, ROOMIE_CARRY_SLOTS } from '@/game/core/balance';
import { Timer, Package, Navigation, AlertTriangle, Users } from 'lucide-react';

interface CollectionOverlayProps {
  nearbyPrompt?: string | null;
}

export const CollectionOverlay: React.FC<CollectionOverlayProps> = ({ nearbyPrompt }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const setPhase = useGameStore((s) => s.setPhase);
  const updateCollectionTime = useRunStore((s) => s.updateCollectionTime);
  const finalizeCollectionToShelter = useInventoryStore((s) => s.finalizeCollectionToShelter);

  const heldItemIds = useInventoryStore((s) => s.heldItemIds);
  const depositedItemIds = useInventoryStore((s) => s.depositedItemIds);
  const maxCarrySlots = useInventoryStore((s) => s.maxCarrySlots);
  const carriedRoomieId = useInventoryStore((s) => s.carriedRoomieId);
  const collectedRoomieIds = useInventoryStore((s) => s.collectedRoomieIds);
  const usedSlots = useInventoryStore(selectUsedSlots);

  // 60-second countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 60 seconds finished!
          finalizeCollectionToShelter();
          updateCollectionTime(0);
          setPhase('COLLECTION_RESULT');
          return 0;
        }
        updateCollectionTime(prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setPhase, updateCollectionTime, finalizeCollectionToShelter]);

  const isUrgent = timeLeft <= 15;

  // Segmentos de la barra de espacios: el roomie cargado ocupa un bloque
  // de 3 y cada ítem un bloque de sus espacios; el resto queda vacío.
  const segments: { key: string; slots: number; label: string; kind: 'roomie' | 'item' | 'empty' }[] = [];
  if (carriedRoomieId) {
    segments.push({
      key: 'carried-roomie',
      slots: ROOMIE_CARRY_SLOTS,
      label: CHARACTERS_DATA[carriedRoomieId]?.name ?? carriedRoomieId,
      kind: 'roomie',
    });
  }
  heldItemIds.forEach((itemId, idx) => {
    const def = ITEMS_DATA[itemId];
    segments.push({
      key: `item-${idx}`,
      slots: def?.inventorySlots ?? 1,
      label: def?.name ?? itemId,
      kind: 'item',
    });
  });
  if (usedSlots < maxCarrySlots) {
    segments.push({ key: 'empty', slots: maxCarrySlots - usedSlots, label: 'Vacío', kind: 'empty' });
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top Bar: Timer & Drop zone status */}
      <div className="flex justify-between items-start">
        {/* Timer Box */}
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all ${
            isUrgent
              ? 'bg-red-950/80 border-red-500 animate-pulse text-red-300'
              : 'bg-slate-900/80 border-slate-700 text-amber-400'
          }`}
        >
          <Timer className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tiempo Restante
            </span>
            <span className="text-3xl font-black font-mono">
              {String(timeLeft).padStart(2, '0')}s
            </span>
          </div>
        </div>

        {/* Drop Zone Navigator Prompt */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 text-xs font-medium backdrop-blur-md">
          <Navigation className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Lleva los objetos al <strong>Ascensor Verde</strong> (Abajo a la Izquierda)</span>
        </div>
      </div>

      {/* Prompt contextual (Fase 2): recoger / cargar roomie / arrojar */}
      <div className="flex justify-center">
        {nearbyPrompt && (
          <div className="bg-slate-900/90 border border-sky-500/80 rounded-xl px-5 py-2.5 backdrop-blur-md shadow-2xl text-sky-300 text-sm font-bold animate-pulse">
            {nearbyPrompt}
          </div>
        )}
      </div>

      {/* Bottom Bar: Carrying inventory & Controls */}
      <div className="flex justify-between items-end">
        {/* Controls helper */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 backdrop-blur-md space-y-1">
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Controles de Recolección
          </div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">W</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">A</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">S</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">D</kbd> Moverse</div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">ESPACIO</kbd> Recoger objeto / Cargar roomie cercano</div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">F</kbd> Arrojar la carga (solo en la zona segura)</div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">Q</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">E</kbd> Rotar cámara 90°</div>
        </div>

        {/* Inventory Box */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 backdrop-blur-md min-w-[280px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-400" />
              Carga ({usedSlots}/{maxCarrySlots} espacios)
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              Resguardo: {depositedItemIds.length} ítems
            </span>
          </div>

          <div className="flex gap-2">
            {segments.map((seg) => (
              <div
                key={seg.key}
                style={{ width: `${seg.slots * 3.5}rem` }}
                className={`h-14 rounded-lg border flex flex-col items-center justify-center p-1 text-center transition-all ${
                  seg.kind === 'roomie'
                    ? 'bg-purple-900/70 border-purple-400 shadow-md'
                    : seg.kind === 'item'
                    ? 'bg-slate-800 border-sky-500 shadow-md'
                    : 'bg-slate-950/50 border-dashed border-slate-700 text-slate-600'
                }`}
              >
                <span
                  className={`text-[10px] font-bold leading-tight line-clamp-2 ${
                    seg.kind === 'empty' ? 'text-slate-600 text-xs font-normal' : 'text-slate-200'
                  }`}
                >
                  {seg.kind === 'roomie' ? `${seg.label} (al hombro)` : seg.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>
              Roomies recolectados: <strong className="text-purple-300">{collectedRoomieIds.length}/{MAX_COLLECTED_ROOMIES}</strong>
              {collectedRoomieIds.length > 0 &&
                ` (${collectedRoomieIds.map((id) => CHARACTERS_DATA[id]?.name ?? id).join(', ')})`}
              {carriedRoomieId &&
                ` · Al hombro: ${CHARACTERS_DATA[carriedRoomieId]?.name ?? carriedRoomieId} lleva tus ítems extra`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
