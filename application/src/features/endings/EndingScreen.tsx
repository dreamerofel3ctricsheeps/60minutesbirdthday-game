import React from 'react';
import { useRunStore } from '@/stores/run.store';
import { useGameStore } from '@/stores/game.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { ENDINGS_DATA } from '@/data/endings/endings.data';
import { JOSE_SPRITES } from '@/data/characters/villainSprites.data';
import { XIMENA_SLEEP } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

export const EndingScreen: React.FC = () => {
  const currentRun = useRunStore((s) => s.currentRun);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetCollectionInventory = useInventoryStore((s) => s.resetCollectionInventory);

  const endingId = currentRun?.ending || 'STANDARD_VICTORY';
  const ending = ENDINGS_DATA[endingId] || ENDINGS_DATA.STANDARD_VICTORY;

  const handleRestart = () => {
    resetCollectionInventory();
    resetGame();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95">
        <div
          className={`p-5 rounded-2xl border ${
            ending.isVictory
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
              : 'bg-red-950/80 border-red-500/50 text-red-400'
          }`}
        >
          {ending.isVictory ? (
            <Trophy className="w-12 h-12" />
          ) : (
            <Skull className="w-12 h-12" />
          )}
        </div>

        <div>
          <span
            className={`text-xs font-bold uppercase tracking-widest ${
              ending.isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {ending.isVictory ? '¡Victoria!' : 'Fin de la Partida'}
          </span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">
            {ending.title}
          </h1>
        </div>

        {endingId === 'RIVAL_PARTY_DEFEAT' && (
          <div className="flex items-end justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <DefinedSprite2D anim={JOSE_SPRITES.celebrate} height={120} cycleMs={430} />
              <span className="text-[11px] font-bold text-red-300">Jose, triunfal 😼</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <DefinedSprite2D anim={XIMENA_SLEEP} height={96} frameIndex={2} />
              <span className="text-[11px] font-bold text-violet-300">Ximena, recién despertada</span>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {ending.description}
        </p>

        {currentRun && (
          <div className="grid grid-cols-3 gap-3 w-full bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 uppercase">Hora Alcanzada</span>
              <span className="text-lg font-bold font-mono text-slate-200">{`${(currentRun.hour % 24).toString().padStart(2, '0')}:00`}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 uppercase">Preparación Final</span>
              <span className="text-lg font-bold font-mono text-amber-400">{Math.round(currentRun.meters.preparacion)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 uppercase">Moral Final</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{Math.round(currentRun.meters.morale)}%</span>
            </div>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-950/50"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Volver al Menú Principal</span>
        </button>
      </div>
    </div>
  );
};
