import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '@/stores/inventory.store';
import { useThrowStore } from '@/stores/throw.store';
import { ITEMS_DATA } from '@/data/items/items.data';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import {
  CARRY_CAPACITY,
  MAX_COLLECTED_ROOMIES,
  ROOMIE_CARRY_SLOTS,
} from '@/game/core/balance';
import {
  canCarryRoomie,
  canThrowLoad,
  totalSlotsUsed,
  CarryStateLike,
} from '@/game/systems/carryLogic';
import { assignSpawnItems, ALL_SPAWN_POINTS } from '@/game/systems/spawnAssignment';
import { placeRoomieNpcs } from '@/game/systems/roomiePlacement';

const emptyCarry = (): CarryStateLike => ({
  heldItemIds: [],
  carriedRoomieId: null,
  collectedRoomieIds: [],
});

describe('Fase 2 — lógica de carga (roomie = 3 espacios)', () => {
  it('cuenta los espacios: roomie (3) + torta (2) = 5, capacidad llena', () => {
    const state: CarryStateLike = {
      heldItemIds: ['birthday_cake'],
      carriedRoomieId: 'saulo',
      collectedRoomieIds: [],
    };
    expect(totalSlotsUsed(state)).toBe(ROOMIE_CARRY_SLOTS + 2);
    expect(totalSlotsUsed(state)).toBe(CARRY_CAPACITY);
  });

  it('bloquea cargar un segundo roomie mientras llevas uno', () => {
    const state: CarryStateLike = {
      heldItemIds: [],
      carriedRoomieId: 'saulo',
      collectedRoomieIds: [],
    };
    expect(canCarryRoomie(state, 'itzel')).toBe(false);
  });

  it('bloquea cargar roomie si los ítems ya ocupan más de 2 espacios', () => {
    const state: CarryStateLike = {
      heldItemIds: ['birthday_cake', 'toolbox'], // 2 + 2 = 4, no caben los 3 del roomie
      carriedRoomieId: null,
      collectedRoomieIds: [],
    };
    expect(canCarryRoomie(state, 'saulo')).toBe(false);
  });

  it('bloquea cargar roomie ya recolectado y respeta el tope de 3 por partida', () => {
    const state: CarryStateLike = {
      heldItemIds: [],
      carriedRoomieId: null,
      collectedRoomieIds: ['saulo', 'itzel', 'majo'],
    };
    expect(state.collectedRoomieIds.length).toBe(MAX_COLLECTED_ROOMIES);
    expect(canCarryRoomie(state, 'alan')).toBe(false); // tope alcanzado
    expect(canCarryRoomie(state, 'saulo')).toBe(false); // ya recolectado
  });

  it('el arrojo solo es válido dentro de la zona y con carga', () => {
    const loaded = { ...emptyCarry(), heldItemIds: ['smartphone'] };
    expect(canThrowLoad(loaded, false)).toBe(false);
    expect(canThrowLoad(loaded, true)).toBe(true);
    expect(canThrowLoad(emptyCarry(), true)).toBe(false);
  });
});

describe('Fase 2 — inventory.store con roomies', () => {
  beforeEach(() => {
    useInventoryStore.getState().resetCollectionInventory();
    useThrowStore.getState().resetThrows();
  });

  it('cargar roomie + ítems hasta 5, arrojar fuera NO deposita y dentro SÍ', () => {
    const inv = useInventoryStore.getState();

    expect(inv.pickupRoomie('saulo')).toBe(true);
    expect(inv.pickupRoomie('itzel')).toBe(false); // segundo roomie bloqueado
    expect(inv.pickupItem('birthday_cake')).toBe(true); // 3 + 2 = 5
    expect(inv.pickupItem('smartphone')).toBe(false); // sin espacios

    // Fuera de la zona segura: no pasa nada
    expect(inv.attemptThrow(false)).toBeNull();
    let s = useInventoryStore.getState();
    expect(s.carriedRoomieId).toBe('saulo');
    expect(s.heldItemIds).toEqual(['birthday_cake']);
    expect(s.collectedRoomieIds).toEqual([]);
    expect(s.depositedItemIds).toEqual([]);

    // Dentro de la zona: vuela todo, roomie cuenta como recolectado
    const thrown = inv.attemptThrow(true);
    expect(thrown).toEqual({ items: ['birthday_cake'], roomieId: 'saulo' });
    s = useInventoryStore.getState();
    expect(s.carriedRoomieId).toBeNull();
    expect(s.heldItemIds).toEqual([]);
    expect(s.collectedRoomieIds).toEqual(['saulo']);
    expect(s.depositedItemIds).toEqual(['birthday_cake']);
  });

  it('no permite un cuarto roomie recolectado en la partida', () => {
    const inv = useInventoryStore.getState();
    for (const id of ['saulo', 'itzel', 'majo']) {
      expect(inv.pickupRoomie(id)).toBe(true);
      expect(inv.attemptThrow(true)?.roomieId).toBe(id);
    }
    expect(useInventoryStore.getState().collectedRoomieIds).toHaveLength(3);
    expect(inv.pickupRoomie('alan')).toBe(false);
  });

  it('el arrojo del roomie en throw.store aterriza como roomie entregado', () => {
    const ts = useThrowStore.getState();
    ts.launchRoomieThrow('saulo', [7.2, 0, 23.25], [4.0, 23.25], 5.0);
    const active = useThrowStore.getState().activeThrows;
    expect(active).toHaveLength(1);
    expect(active[0].kind).toBe('roomie');
    expect(active[0].characterId).toBe('saulo');

    ts.onLanded(active[0].id);
    const landed = useThrowStore.getState().landedItems;
    expect(landed).toHaveLength(1);
    expect(landed[0].kind).toBe('roomie');
    expect(landed[0].characterId).toBe('saulo');
  });
});

describe('Fase 2 — spawn aleatorio con seed (pool completo)', () => {
  it('misma seed → misma asignación exacta', () => {
    expect(assignSpawnItems(42)).toEqual(assignSpawnItems(42));
  });

  it('otra seed → otra asignación', () => {
    expect(assignSpawnItems(42)).not.toEqual(assignSpawnItems(777));
  });

  it('usa el pool completo: sin duplicados, ítems válidos y un ítem por spawn point', () => {
    const assigned = assignSpawnItems(1234);
    expect(assigned).toHaveLength(ALL_SPAWN_POINTS.length);
    const itemIds = assigned.map((a) => a.itemId);
    expect(new Set(itemIds).size).toBe(itemIds.length);
    itemIds.forEach((id) => expect(ITEMS_DATA[id]).toBeDefined());
    const pointIds = new Set(assigned.map((a) => a.id));
    expect(pointIds.size).toBe(ALL_SPAWN_POINTS.length);
  });
});

describe('Fase 2 — distribución de roomies NPC con seed', () => {
  it('coloca a los 6 no protagonistas dentro de sus habitaciones, determinista', () => {
    const a = placeRoomieNpcs(42, 'natalia');
    const b = placeRoomieNpcs(42, 'natalia');
    expect(a).toEqual(b);
    expect(a).toHaveLength(6);
    expect(a.map((p) => p.characterId)).not.toContain('natalia');

    for (const p of a) {
      const room = APARTMENT_MAP.rooms.find((r) => r.id === p.roomId)!;
      expect(room).toBeDefined();
      expect(p.position[0]).toBeGreaterThan(room.bounds.x);
      expect(p.position[0]).toBeLessThan(room.bounds.x + room.bounds.width);
      expect(p.position[2]).toBeGreaterThan(room.bounds.z);
      expect(p.position[2]).toBeLessThan(room.bounds.z + room.bounds.depth);
    }
  });

  it('excluye a otro protagonista cuando cambia la selección', () => {
    const placements = placeRoomieNpcs(42, 'alan');
    expect(placements.map((p) => p.characterId)).not.toContain('alan');
    expect(placements.map((p) => p.characterId)).toContain('natalia');
  });
});
