import React, { useEffect } from 'react';
import { useGameStore } from '@/stores/game.store';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import {
  Compass,
  MapPin,
  ArrowLeft,
  Eye,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface MapExplorerOverlayProps {
  currentRoomName: string;
  isRiskArea: boolean;
  playerCoords?: { x: number; z: number };
  nearbyItemPrompt?: string | null;
  onTeleport?: (x: number, z: number) => void;
}

export const MapExplorerOverlay: React.FC<MapExplorerOverlayProps> = ({
  currentRoomName,
  isRiskArea,
  playerCoords,
  nearbyItemPrompt,
  onTeleport,
}) => {
  const setPhase = useGameStore((s) => s.setPhase);

  // ESC to return to menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPhase('MENU');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPhase]);

  const activeRoomDef = APARTMENT_MAP.rooms.find((r) => r.name === currentRoomName);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top Header: Navigation & Room Inspector */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Back Button & Mode Badge */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setPhase('MENU')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl backdrop-blur-md transition-all shadow-xl font-semibold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Menú (ESC)</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-bold backdrop-blur-md">
            <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>MODO EXPLORACIÓN LIBRE (DEV SANDBOX)</span>
          </div>
        </div>

        {/* Current Room HUD Panel */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 backdrop-blur-md shadow-2xl min-w-[320px] pointer-events-auto">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-slate-100 text-sm">
                {currentRoomName || 'Pasillo Central'}
              </span>
            </div>

            {isRiskArea ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3 h-3" />
                Zona de Riesgo
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                Zona Segura
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Dimensiones: </span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeRoomDef ? `${activeRoomDef.bounds.width}m × ${activeRoomDef.bounds.depth}m` : '10m × 2m'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Muebles: </span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeRoomDef?.furniture.length ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Puntos Spawn: </span>
              <span className="font-mono text-slate-200 font-semibold">
                {activeRoomDef?.spawnPoints.length ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Coordenadas: </span>
              <span className="font-mono text-sky-400 font-semibold">
                {playerCoords ? `X:${playerCoords.x.toFixed(1)} Z:${playerCoords.z.toFixed(1)}` : 'X:-- Z:--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Prompt if near item */}
      {nearbyItemPrompt && (
        <div className="self-center bg-slate-900/90 border border-sky-500/80 rounded-xl px-5 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-2 text-sky-300 text-xs font-bold animate-pulse">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Presiona [ESPACIO] para interactuar con {nearbyItemPrompt}</span>
        </div>
      )}

      {/* Bottom Bar: Teleport Bar & Quick Navigation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Controls Hint */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs text-slate-300 pointer-events-auto space-y-1">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            Controles de Navegación
          </div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">W</kbd><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">A</kbd><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">S</kbd><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">D</kbd> Mover al Personaje</div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESPACIO</kbd> Recoger / Interactuar</div>
          <div><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESC</kbd> Volver al Menú</div>
        </div>

        {/* Quick Room Teleport Navigator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl pointer-events-auto max-w-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            Teletransporte Rápido a Habitaciones (Boceto v1.2):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {APARTMENT_MAP.rooms.map((room) => {
              const centerX = room.bounds.x + room.bounds.width / 2;
              const centerZ = room.bounds.z + room.bounds.depth / 2;
              const isCurrent = currentRoomName === room.name;

              return (
                <button
                  key={room.id}
                  onClick={() => onTeleport?.(centerX, centerZ)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    isCurrent
                      ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-300'
                  }`}
                >
                  {room.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
