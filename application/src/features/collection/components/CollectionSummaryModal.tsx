import React from 'react';
import { useInventoryStore } from '@/stores/inventory.store';
import { useGameStore } from '@/stores/game.store';
import { ITEMS_DATA } from '@/data/items/items.data';
import { ShieldCheck, ArrowRight, PackageX } from 'lucide-react';

export const CollectionSummaryModal: React.FC = () => {
  const depositedItemIds = useInventoryStore((s) => s.depositedItemIds);
  const setPhase = useGameStore((s) => s.setPhase);

  const handleStartManagement = () => {
    setPhase('MANAGEMENT');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">¡Tiempo Agotado!</h2>
          <p className="text-sm text-slate-400 mt-1">
            Los 60 segundos de recolección terminaron. Esto es lo que lograste resguardar en el Ascensor:
          </p>
        </div>

        {/* Rescued Items List */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto">
          {depositedItemIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
              <PackageX className="w-8 h-8 text-amber-500/50" />
              <p className="text-sm">No lograste depositar ningún objeto a tiempo.</p>
              <p className="text-xs text-slate-600">La fiesta comenzará con recursos críticos mínimos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {depositedItemIds.map((itemId, idx) => {
                const item = ITEMS_DATA[itemId];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700/60"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-200">
                        {item ? item.name : itemId}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item ? item.category : 'Objeto'}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                      Resguardado
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleStartManagement}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
        >
          <span>Iniciar Fase de Gestión (Día 1)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
