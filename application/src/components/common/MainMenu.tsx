import React, { useState } from 'react';
import { useGameStore } from '@/stores/game.store';
import { useRunStore } from '@/stores/run.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { audio } from '@/services/audio.service';
import {
  Play,
  Compass,
  LayoutDashboard,
  Sparkles,
  Clock,
  ShieldAlert,
  Volume2,
  VolumeX,
  Gauge,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export const MainMenu: React.FC = () => {
  const setPhase = useGameStore((s) => s.setPhase);
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  const setSelectedCharacterId = useGameStore((s) => s.setSelectedCharacterId);
  const startNewRun = useRunStore((s) => s.startNewRun);
  const resetCollectionInventory = useInventoryStore((s) => s.resetCollectionInventory);

  const [isMuted, setIsMuted] = useState(false);

  const handleStartOfficialGame = () => {
    audio.play('UI_CLICK');
    resetCollectionInventory();
    startNewRun();
    setPhase('COLLECTION');
  };

  const handleStartMapExploration = () => {
    audio.play('UI_CLICK');
    resetCollectionInventory();
    startNewRun();
    setPhase('MAP_EXPLORER');
  };

  const handleStartManagementDirect = () => {
    audio.play('UI_CLICK');
    resetCollectionInventory();
    startNewRun();
    // Pre-populate with some strategic items for testing
    useInventoryStore.getState().depositedItemIds = ['birthday_cake', 'smartphone', 'first_aid_kit'];
    useInventoryStore.getState().finalizeCollectionToShelter();
    setPhase('MANAGEMENT');
  };

  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMuted(nextMuted);
    if (!nextMuted) audio.play('UI_CLICK');
  };

  const selectedChar = CHARACTERS_DATA[selectedCharacterId] || CHARACTERS_DATA.natalia;

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls: Audio toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleAudio}
          className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold backdrop-blur-md"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-red-400" />
              <span>Sonido: OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Sonido: ON</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center text-center gap-6 relative z-10 my-auto">
        {/* Title & Tagline */}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Entorno de Desarrollo & Base del Juego
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 tracking-tight">
            1 Minuto para la Fiesta
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Supervivencia, recolección en tiempo real y gestión ramificada. Recorre el departamento, resguarda recursos y controla la sospecha de Ximena.
          </p>
        </div>

        {/* Character Selection Grid (7 Roomies) */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md text-left shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-sky-400" />
              Selecciona tu Roomie Activo:
            </div>
            <span className="text-xs text-sky-400 font-semibold">
              Seleccionado: {selectedChar.name} ({selectedChar.role})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.values(CHARACTERS_DATA).map((char) => {
              const isSelected = selectedCharacterId === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacterId(char.id);
                    audio.play('UI_CLICK');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-950/90 border-sky-400 text-sky-200 ring-2 ring-sky-500/30 shadow-lg'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs truncate text-slate-100">{char.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{char.role}</div>
                  <div className="flex justify-between items-center text-[10px] font-mono mt-2 text-amber-400/90">
                    <span>Vel: {char.attributes.speed}</span>
                    <span>Sig: {char.attributes.stealth}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Character Detail Card */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-600/40 text-sky-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200">
                  {selectedChar.name} — {selectedChar.role}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {selectedChar.passiveAbility?.name}: {selectedChar.passiveAbility?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 font-mono text-xs">
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300">
                Lógica: {selectedChar.attributes.logic}/10
              </span>
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-rose-300">
                Carisma: {selectedChar.attributes.charisma}/10
              </span>
            </div>
          </div>
        </div>

        {/* Action Modes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Mode 1: Explora el Mapa (Sandbox) */}
          <button
            onClick={handleStartMapExploration}
            className="group p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-amber-500/50 hover:border-amber-400 text-left transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400 inline-block mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Explorar Mapa 3D (Sandbox)
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Visita libremente el departamento del boceto técnico v1.2 sin límite de tiempo. Prueba colisiones, habitaciones, teletransporte y puntos de spawn.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Entrar al Sandbox del Mapa</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Mode 2: Jugar 60 Segundos (Oficial) */}
          <button
            onClick={handleStartOfficialGame}
            className="group p-5 rounded-2xl bg-gradient-to-b from-sky-900/60 to-slate-900/90 hover:from-sky-900/80 hover:to-slate-850 border border-sky-500/50 hover:border-sky-400 text-left transition-all shadow-xl flex flex-col justify-between gap-4 ring-1 ring-sky-500/30"
          >
            <div>
              <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 inline-block mb-3">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                Jugar Partida (60s + Gestión)
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                El flujo completo: 60 segundos de recolección en el departamento, rescate de objetos en el Ascensor y supervivencia por días.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>Iniciar Partida Completa</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Mode 3: Probar Gestión */}
          <button
            onClick={handleStartManagementDirect}
            className="group p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 text-left transition-all shadow-xl flex flex-col justify-between gap-4"
          >
            <div>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 inline-block mb-3">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-slate-200 transition-colors">
                Probar Fase de Gestión
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Entra directamente a la fase por turnos con ítems resguardados para probar eventos de WhatsApp, amenazas y chequeos.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-300 group-hover:translate-x-1 transition-transform">
              <span>Ir a Gestión</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Level Design & Architectural Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left text-xs text-slate-400">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Mapa Técnico v1.2: </span>
              <span>10 habitaciones mapeadas en Three.js con pasillo central ensanchado de 1.8m y zona de entrega verde.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Mecánica de Riesgo: </span>
              <span>Entrar al depto. del vecino acumula ruido en tiempo real y aumenta el peligro vecinal.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
