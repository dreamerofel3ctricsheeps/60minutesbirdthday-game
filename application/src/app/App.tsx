import React, { useState } from 'react';
import { useGameStore } from '@/stores/game.store';
import { MainMenu } from '@/components/common/MainMenu';
import { CollectionScene } from '@/scenes/collection/CollectionScene';
import { CollectionOverlay } from '@/features/collection/components/CollectionOverlay';
import { MapExplorerOverlay } from '@/features/collection/components/MapExplorerOverlay';
import { CollectionSummaryModal } from '@/features/collection/components/CollectionSummaryModal';
import { ManagementView } from '@/features/management/components/ManagementView';
import { EndingScreen } from '@/features/endings/EndingScreen';

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  // Live map exploration states
  const [currentRoom, setCurrentRoom] = useState<string>('Ascensor / Zona de Resguardo');
  const [isRiskArea, setIsRiskArea] = useState<boolean>(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; z: number }>({ x: 2.0, z: 9.5 });
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<[number, number] | null>(null);

  const handleTeleport = (x: number, z: number) => {
    setTeleportTarget([x, z]);
    // reset teleport trigger so same room can be re-teleported
    setTimeout(() => setTeleportTarget(null), 100);
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {phase === 'MENU' && <MainMenu />}

      {/* Official 60-Second Collection Game Mode */}
      {phase === 'COLLECTION' && (
        <div className="w-full h-full relative">
          <CollectionScene
            onRoomChange={(room, isRisk) => {
              setCurrentRoom(room);
              setIsRiskArea(isRisk);
            }}
            onNearbyPrompt={setNearbyPrompt}
          />
          <CollectionOverlay nearbyPrompt={nearbyPrompt} />
        </div>
      )}

      {/* Free Map Explorer / Development Sandbox */}
      {phase === 'MAP_EXPLORER' && (
        <div className="w-full h-full relative">
          <CollectionScene
            onRoomChange={(room, isRisk) => {
              setCurrentRoom(room);
              setIsRiskArea(isRisk);
            }}
            onNearbyPrompt={setNearbyPrompt}
            onPositionUpdate={setPlayerCoords}
            teleportTarget={teleportTarget}
          />
          <MapExplorerOverlay
            currentRoomName={currentRoom}
            isRiskArea={isRiskArea}
            playerCoords={playerCoords}
            nearbyItemPrompt={nearbyPrompt}
            onTeleport={handleTeleport}
          />
        </div>
      )}

      {/* Collection Results Modal */}
      {phase === 'COLLECTION_RESULT' && (
        <div className="w-full h-full relative">
          <CollectionScene />
          <CollectionSummaryModal />
        </div>
      )}

      {/* Turn-based Daily Management Phase */}
      {phase === 'MANAGEMENT' && <ManagementView />}

      {/* Victory or Defeat Ending Screen */}
      {phase === 'ENDING' && <EndingScreen />}
    </main>
  );
};

export default App;
