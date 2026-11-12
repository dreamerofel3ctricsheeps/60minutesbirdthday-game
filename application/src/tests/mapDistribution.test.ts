import { describe, it, expect } from 'vitest';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';

describe('Apartment Map Distribution, Walls & Security Verification (v4.1)', () => {
  it('guarantees NO room floor bounding boxes overlap (zero Z-fighting)', () => {
    const rooms = APARTMENT_MAP.rooms;
    const overlaps: string[] = [];

    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const a = rooms[i].bounds;
        const b = rooms[j].bounds;

        const xOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
        const zOverlap = a.z < b.z + b.depth && a.z + a.depth > b.z;

        if (xOverlap && zOverlap) {
          overlaps.push(`${rooms[i].name} overlaps with ${rooms[j].name}`);
        }
      }
    }

    expect(overlaps).toEqual([]);
  });

  it('guarantees hallways have exactly 2.5m width/depth', () => {
    const verticalHallway = APARTMENT_MAP.rooms.find((r) => r.id === 'vertical_hallway');
    const centralHallway = APARTMENT_MAP.rooms.find((r) => r.id === 'central_hallway');

    expect(verticalHallway).toBeDefined();
    expect(centralHallway).toBeDefined();

    // Vertical hallway width is exactly 2.5m
    expect(verticalHallway!.bounds.width).toBe(2.5);

    // Central hallway depth is exactly 2.5m
    expect(centralHallway!.bounds.depth).toBe(2.5);
  });

  it('guarantees Baño Principal is exclusively accessible from Sala (no access from Ascensor/Pasillo)', () => {
    // 1. Check door connections
    const bathroomDoors = APARTMENT_MAP.doors.filter(
      (d) => d.connects.includes('main_bathroom')
    );

    expect(bathroomDoors.length).toBe(1);
    expect(bathroomDoors[0].connects).toContain('living_room');
    expect(bathroomDoors[0].direction).toBe('x'); // On east wall with Sala

    // 2. Check south wall of Baño Principal exists and is solid (Z=17.0, X: 1.0 to 7.0)
    const bathroomSouthWall = APARTMENT_MAP.walls.find(
      (w) =>
        Math.abs(w.from[1] - 17.0) < 0.01 &&
        Math.abs(w.to[1] - 17.0) < 0.01 &&
        Math.min(w.from[0], w.to[0]) <= 1.0 &&
        Math.max(w.from[0], w.to[0]) >= 7.0
    );
    expect(bathroomSouthWall).toBeDefined();

    // 3. Check north wall of Ascensor exists and is solid (Z=22.0, X: 1.0 to 7.0)
    const ascensorNorthWall = APARTMENT_MAP.walls.find(
      (w) =>
        Math.abs(w.from[1] - 22.0) < 0.01 &&
        Math.abs(w.to[1] - 22.0) < 0.01 &&
        Math.min(w.from[0], w.to[0]) <= 1.0 &&
        Math.max(w.from[0], w.to[0]) >= 7.0
    );
    expect(ascensorNorthWall).toBeDefined();
  });

  it('guarantees Sala main entrance connects to the vertical hallway (no south back-door to Pasillo Central)', () => {
    // 1. Verify NO door connects living_room directly to central_hallway
    const salaToPasilloCentral = APARTMENT_MAP.doors.find(
      (d) =>
        d.connects.includes('living_room') && d.connects.includes('central_hallway')
    );
    expect(salaToPasilloCentral).toBeUndefined();

    // 2. Verify Sala main entrance connects to vertical_hallway (pasillo depto de Ximena)
    const salaToVerticalHallway = APARTMENT_MAP.doors.find(
      (d) =>
        d.connects.includes('living_room') && d.connects.includes('vertical_hallway')
    );
    expect(salaToVerticalHallway).toBeDefined();
    expect(salaToVerticalHallway?.position[0]).toBe(19.0); // East wall of Sala
    expect(salaToVerticalHallway?.direction).toBe('x');

    // 3. Verify south wall of Sala (Z=22.0) is a solid continuous load wall from X=7.0 to X=19.0
    const salaSouthWall = APARTMENT_MAP.walls.find(
      (w) =>
        Math.abs(w.from[1] - 22.0) < 0.01 &&
        Math.abs(w.to[1] - 22.0) < 0.01 &&
        Math.min(w.from[0], w.to[0]) <= 7.0 &&
        Math.max(w.from[0], w.to[0]) >= 19.0 &&
        w.type === 'load'
    );
    expect(salaSouthWall).toBeDefined();
  });

  it('guarantees Comedor entrance is exclusively from vertical hallway (no south door to Pasillo Central)', () => {
    // 1. Verify NO door connects dining_room directly to central_hallway
    const comedorToPasilloCentral = APARTMENT_MAP.doors.find(
      (d) =>
        d.connects.includes('dining_room') && d.connects.includes('central_hallway')
    );
    expect(comedorToPasilloCentral).toBeUndefined();

    // 2. Verify Comedor entrance connects to vertical_hallway on its west wall
    const comedorToVerticalHallway = APARTMENT_MAP.doors.find(
      (d) =>
        d.connects.includes('dining_room') && d.connects.includes('vertical_hallway')
    );
    expect(comedorToVerticalHallway).toBeDefined();
    expect(comedorToVerticalHallway?.position[0]).toBe(21.5); // West wall of Comedor
    expect(comedorToVerticalHallway?.direction).toBe('x');

    // 3. Verify south wall of Comedor (Z=22.0) is a solid continuous load wall from X=21.5 to X=36.5
    const comedorSouthWall = APARTMENT_MAP.walls.find(
      (w) =>
        Math.abs(w.from[1] - 22.0) < 0.01 &&
        Math.abs(w.to[1] - 22.0) < 0.01 &&
        Math.min(w.from[0], w.to[0]) <= 21.5 &&
        Math.max(w.from[0], w.to[0]) >= 36.5 &&
        w.type === 'load'
    );
    expect(comedorSouthWall).toBeDefined();
  });

  it('guarantees all doorways have clear clearance zones without furniture obstructions', () => {
    const minClearanceDist = 1.0;
    const blockedDoors: string[] = [];

    APARTMENT_MAP.doors.forEach((door, dIdx) => {
      const [dx, dz] = door.position;

      APARTMENT_MAP.rooms.forEach((room) => {
        room.furniture.forEach((f) => {
          const halfW = f.size[0] / 2;
          const halfD = f.size[2] / 2;

          const fXMin = f.position[0] - halfW;
          const fXMax = f.position[0] + halfW;
          const fZMin = f.position[2] - halfD;
          const fZMax = f.position[2] + halfD;

          const closestX = Math.max(fXMin, Math.min(dx, fXMax));
          const closestZ = Math.max(fZMin, Math.min(dz, fZMax));
          const dist = Math.hypot(closestX - dx, closestZ - dz);

          if (dist < minClearanceDist) {
            blockedDoors.push(
              `Door ${dIdx} (${door.connects.join(' <-> ')}) is blocked by furniture "${f.name}" in ${room.name} (dist=${dist.toFixed(2)}m)`
            );
          }
        });
      });
    });

    expect(blockedDoors).toEqual([]);
  });

  it('verifies 2-tier shelves architecture and item showcase heights in enlarged rooms', () => {
    const allShelves = APARTMENT_MAP.rooms.flatMap((r) =>
      r.furniture.filter((f) => f.isShelf)
    );

    // Verify shelves are present across key rooms
    expect(allShelves.length).toBeGreaterThanOrEqual(6);

    allShelves.forEach((shelf) => {
      expect(shelf.shelfConfig).toBeDefined();
      expect(shelf.shelfConfig?.tierHeights).toBeDefined();
      const [t1, t2] = shelf.shelfConfig!.tierHeights!;

      // Tier 1: ground accessible (~0.85m)
      expect(t1).toBeGreaterThanOrEqual(0.8);
      expect(t1).toBeLessThanOrEqual(0.95);

      // Tier 2: requires ladder (~1.70m - 1.85m)
      expect(t2).toBeGreaterThanOrEqual(1.65);
      expect(t2).toBeLessThanOrEqual(1.85);

      // Each shelf has an integrated ladder on left or right
      expect(['left', 'right']).toContain(shelf.shelfConfig?.ladderSide);
    });

    // Verify key items spawn precisely on either Tier 1 or Tier 2 of the shelves
    const shelfItems = [
      'sp_kitchen_cake',      // Torta de Cumpleaños (Tier 1)
      'sp_kitchen_food',      // Fast food box (Tier 2)
      'sp_living_phone',      // Smartphone (Tier 1)
      'sp_bedroom_key',       // Llaves del vecino (Tier 2)
      'sp_bedbath_perfume',   // Perfume de Lujo (Tier 1)
      'sp_dining_gift',       // Mystery Gift (Tier 2)
      'sp_library_tablet',    // Tablet con playlist (Tier 2)
      'sp_neighbor_speaker',  // Pro speaker (Tier 2)
    ];

    shelfItems.forEach((spId) => {
      const sp = APARTMENT_MAP.rooms
        .flatMap((r) => r.spawnPoints)
        .find((s) => s.id === spId);

      expect(sp).toBeDefined();
      const y = sp!.position[1];
      const isTier1 = y >= 0.85 && y <= 1.05;
      const isTier2 = y >= 1.65 && y <= 1.95;
      expect(isTier1 || isTier2).toBe(true);
    });
  });

  it('guarantees impenetrable perimeter: player CANNOT leak or escape outside the apartment walls', () => {
    const res = 0.25;
    const xMin = -2.0;
    const xMax = 46.0;
    const zMin = -5.0;
    const zMax = 42.0;

    const widthCells = Math.ceil((xMax - xMin) / res);
    const heightCells = Math.ceil((zMax - zMin) / res);

    const toGX = (x: number) => Math.floor((x - xMin) / res);
    const toGZ = (z: number) => Math.floor((z - zMin) / res);
    const toWorldX = (gx: number) => xMin + gx * res;
    const toWorldZ = (gz: number) => zMin + gz * res;

    const grid: boolean[][] = Array.from({ length: widthCells }, () =>
      new Array(heightCells).fill(false)
    );

    const playerRadius = 0.22;

    // Mark all walls (both interior and exterior) as solid obstacles
    APARTMENT_MAP.walls.forEach((w) => {
      const halfT = (w.thickness || 0.15) / 2 + playerRadius;
      const isHorizontal = Math.abs(w.from[1] - w.to[1]) < 0.01;
      const isVertical = Math.abs(w.from[0] - w.to[0]) < 0.01;

      let minX = Math.min(w.from[0], w.to[0]);
      let maxX = Math.max(w.from[0], w.to[0]);
      let minZ = Math.min(w.from[1], w.to[1]);
      let maxZ = Math.max(w.from[1], w.to[1]);

      if (isHorizontal) {
        minX -= playerRadius;
        maxX += playerRadius;
        minZ = w.from[1] - halfT;
        maxZ = w.from[1] + halfT;
      } else if (isVertical) {
        minX = w.from[0] - halfT;
        maxX = w.from[0] + halfT;
        minZ -= playerRadius;
        maxZ += playerRadius;
      }

      const minGX = Math.max(0, toGX(minX));
      const maxGX = Math.min(widthCells - 1, toGX(maxX));
      const minGZ = Math.max(0, toGZ(minZ));
      const maxGZ = Math.min(heightCells - 1, toGZ(maxZ));

      for (let gx = minGX; gx <= maxGX; gx++) {
        for (let gz = minGZ; gz <= maxGZ; gz++) {
          grid[gx][gz] = true;
        }
      }
    });

    // BFS Flood Fill from Player Spawn inside Ascensor
    const startGX = toGX(APARTMENT_MAP.playerSpawn[0]);
    const startGZ = toGZ(APARTMENT_MAP.playerSpawn[2]);

    const visited: boolean[][] = Array.from({ length: widthCells }, () =>
      new Array(heightCells).fill(false)
    );

    const queue: [number, number][] = [[startGX, startGZ]];
    visited[startGX][startGZ] = true;

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const [cx, cz] = queue.shift()!;
      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (
          nx >= 0 &&
          nx < widthCells &&
          nz >= 0 &&
          nz < heightCells &&
          !visited[nx][nz] &&
          !grid[nx][nz]
        ) {
          visited[nx][nz] = true;
          queue.push([nx, nz]);
        }
      }
    }

    // Helper: is a point inside ANY of the apartment rooms/corridors?
    const isInsideApartment = (x: number, z: number): boolean => {
      const margin = 0.45;
      return APARTMENT_MAP.rooms.some(
        (r) =>
          x >= r.bounds.x - margin &&
          x <= r.bounds.x + r.bounds.width + margin &&
          z >= r.bounds.z - margin &&
          z <= r.bounds.z + r.bounds.depth + margin
      );
    };

    // Check all reachable cells
    const escapedCells: string[] = [];
    for (let gx = 0; gx < widthCells; gx++) {
      for (let gz = 0; gz < heightCells; gz++) {
        if (visited[gx][gz]) {
          const worldX = toWorldX(gx);
          const worldZ = toWorldZ(gz);
          if (!isInsideApartment(worldX, worldZ)) {
            escapedCells.push(
              `Reachable cell at X:${worldX.toFixed(2)}, Z:${worldZ.toFixed(2)} escaped outside apartment rooms!`
            );
          }
        }
      }
    }

    expect(escapedCells).toEqual([]);
  });

  it('verifies full navigability: player can reach every room and key item from spawn', () => {
    const res = 0.25;
    const xMin = -2.0;
    const xMax = 46.0;
    const zMin = -5.0;
    const zMax = 42.0;

    const widthCells = Math.ceil((xMax - xMin) / res);
    const heightCells = Math.ceil((zMax - zMin) / res);

    const toGX = (x: number) => Math.floor((x - xMin) / res);
    const toGZ = (z: number) => Math.floor((z - zMin) / res);

    const grid: boolean[][] = Array.from({ length: widthCells }, () =>
      new Array(heightCells).fill(false)
    );

    const playerRadius = 0.22;

    // 1. Mark furniture as blocked
    APARTMENT_MAP.rooms.forEach((room) => {
      room.furniture.forEach((f) => {
        const halfW = f.size[0] / 2 + playerRadius;
        const halfD = f.size[2] / 2 + playerRadius;

        const minGX = Math.max(0, toGX(f.position[0] - halfW));
        const maxGX = Math.min(widthCells - 1, toGX(f.position[0] + halfW));
        const minGZ = Math.max(0, toGZ(f.position[2] - halfD));
        const maxGZ = Math.min(heightCells - 1, toGZ(f.position[2] + halfD));

        for (let gx = minGX; gx <= maxGX; gx++) {
          for (let gz = minGZ; gz <= maxGZ; gz++) {
            grid[gx][gz] = true;
          }
        }
      });
    });

    // 2. Mark interior and exterior walls as blocked
    APARTMENT_MAP.walls.forEach((w) => {
      const halfT = (w.thickness || 0.15) / 2 + playerRadius;
      const isHorizontal = Math.abs(w.from[1] - w.to[1]) < 0.01;
      const isVertical = Math.abs(w.from[0] - w.to[0]) < 0.01;

      let minX = Math.min(w.from[0], w.to[0]);
      let maxX = Math.max(w.from[0], w.to[0]);
      let minZ = Math.min(w.from[1], w.to[1]);
      let maxZ = Math.max(w.from[1], w.to[1]);

      if (isHorizontal) {
        minX -= playerRadius;
        maxX += playerRadius;
        minZ = w.from[1] - halfT;
        maxZ = w.from[1] + halfT;
      } else if (isVertical) {
        minX = w.from[0] - halfT;
        maxX = w.from[0] + halfT;
        minZ -= playerRadius;
        maxZ += playerRadius;
      }

      const minGX = Math.max(0, toGX(minX));
      const maxGX = Math.min(widthCells - 1, toGX(maxX));
      const minGZ = Math.max(0, toGZ(minZ));
      const maxGZ = Math.min(heightCells - 1, toGZ(maxZ));

      for (let gx = minGX; gx <= maxGX; gx++) {
        for (let gz = minGZ; gz <= maxGZ; gz++) {
          grid[gx][gz] = true;
        }
      }
    });

    // BFS from player spawn
    const startGX = toGX(APARTMENT_MAP.playerSpawn[0]);
    const startGZ = toGZ(APARTMENT_MAP.playerSpawn[2]);

    const visited: boolean[][] = Array.from({ length: widthCells }, () =>
      new Array(heightCells).fill(false)
    );

    const queue: [number, number][] = [[startGX, startGZ]];
    visited[startGX][startGZ] = true;

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const [cx, cz] = queue.shift()!;
      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (
          nx >= 0 &&
          nx < widthCells &&
          nz >= 0 &&
          nz < heightCells &&
          !visited[nx][nz] &&
          !grid[nx][nz]
        ) {
          visited[nx][nz] = true;
          queue.push([nx, nz]);
        }
      }
    }

    const isReachable = (x: number, z: number, reachDist = 1.8): boolean => {
      const cellRange = Math.ceil(reachDist / res);
      const gx = toGX(x);
      const gz = toGZ(z);
      for (let ox = -cellRange; ox <= cellRange; ox++) {
        for (let oz = -cellRange; oz <= cellRange; oz++) {
          const testX = gx + ox;
          const testZ = gz + oz;
          if (
            testX >= 0 &&
            testX < widthCells &&
            testZ >= 0 &&
            testZ < heightCells &&
            visited[testX][testZ]
          ) {
            const worldDist = Math.hypot(ox * res, oz * res);
            if (worldDist <= reachDist) {
              return true;
            }
          }
        }
      }
      return false;
    };

    const destinations = [
      { name: 'Drop Zone (Ascensor)', pos: [4.0, 23.25] },
      { name: 'Cocina (Centro)', pos: [13.0, 5.0] },
      { name: 'Torta de Cumpleaños en Repisa Nivel 1', pos: [11.8, -2.4] },
      { name: 'Comida Rápida en Repisa Nivel 2', pos: [14.2, -2.4] },
      { name: 'Sala (Living Room)', pos: [13.0, 16.5] },
      { name: 'Smartphone de Ximena en Repisa Nivel 1', pos: [14.5, 21.3] },
      { name: 'Baño Principal', pos: [3.0, 14.0] },
      { name: 'Botiquín', pos: [3.0, 11.7] },
      { name: 'Habitación Principal', pos: [29.0, 4.0] },
      { name: 'Llaves del Vecino en Repisa Nivel 2', pos: [26.0, -2.3] },
      { name: 'Baño de Habitación', pos: [40.0, 2.0] },
      { name: 'Perfume de Lujo en Repisa Nivel 1', pos: [40.0, -2.3] },
      { name: 'Comedor (Salón)', pos: [29.0, 13.5] },
      { name: 'El Regalo Principal en Repisa Nivel 2', pos: [31.0, 21.3] },
      { name: 'Librería / Estudio (Salón)', pos: [13.0, 30.0] },
      { name: 'Tablet con Playlist en Repisa Nivel 2', pos: [13.0, 37.8] },
      { name: 'Departamento del Vecino (Salón)', pos: [24.0, 30.0] },
      { name: 'Parlante del Vecino en Repisa Nivel 2', pos: [33.0, 37.8] },
    ];

    const unreachable = destinations.filter((d) => !isReachable(d.pos[0], d.pos[1]));
    expect(unreachable.map((d) => d.name)).toEqual([]);
  });
});
