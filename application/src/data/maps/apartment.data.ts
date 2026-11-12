import { MapDefinition } from '@/types/map.types';

/**
 * BOCETO TÉCNICO DE MAPA v4.1 (HABITACIONES AMPLIADAS + PASILLOS DE 2.5m RESTAURADOS)
 * "1 Minuto para la Fiesta"
 *
 * Mejoras arquitectónicas implementadas:
 * 1. PASILLOS DE ANCHO RESTAURADO A 2.5m:
 *    - Pasillo Vertical (Norte-Sur): ancho exacto de 2.5m (X: 19.0 a 21.5).
 *    - Pasillo Central (Este-Oeste): fondo exacto de 2.5m (Z: 22.0 a 24.5).
 * 2. HABITACIONES GRANDES Y AMPLIADAS PRESERVADAS:
 *    - Todas las habitaciones conservan sus proporciones duplicadas y espaciosas.
 * 3. REORGANIZACIÓN DE REPISAS DE 2 NIVELES CON ESCALERA E ÍTEMS:
 *    - Todas las repisas ubicadas contra muros estructurales, dejando holguras masivas de circulación.
 *    - Ítems en Niveles 1 (accesible a pie) y 2 (alcanzable con escalera).
 * 4. PERÍMETRO EXTERIOR HERMÉTICO Y NAVEGABILIDAD SIN BLOQUEOS.
 */

export const APARTMENT_MAP: MapDefinition = {
  id: 'apartment_v4.1_restored_corridors',
  name: 'Departamento de Ximena — Edición Habitaciones Grandes y Pasillos de 2.5m v4.1',
  scale: 1,

  // Spawn dentro del Ascensor / Drop Zone
  playerSpawn: [4.0, 0.5, 23.25],

  dropZone: {
    center: [4.0, 23.25],
    radius: 1.8,
    bounds: {
      xMin: 1.0,
      xMax: 7.0,
      zMin: 22.0,
      zMax: 24.5,
    },
  },

  rooms: [
    // ═══════════════════════════════════════════════════════════
    //  ZONA 0 — ASCENSOR / DROP ZONE (6.0m x 2.5m)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'elevator_dropzone',
      name: 'Ascensor / Zona de Resguardo',
      zone: 0,
      bounds: { x: 1.0, z: 22.0, width: 6.0, depth: 2.5 },
      floorColor: '#475569',
      floorMaterial: {
        type: 'concrete',
        baseColor: '#64748b',
        pattern: 'plain',
        roughness: 0.85,
      },
      wallMaterial: {
        type: 'concrete',
        baseColor: '#334155',
        pattern: 'plain',
        roughness: 0.85,
      },
      isDropZone: true,
      spawnPoints: [],
      furniture: [],
    },

    // ═══════════════════════════════════════════════════════════
    //  ZONA 1 — SAQUEO RÁPIDO
    // ═══════════════════════════════════════════════════════════

    // Baño Principal (6.0m x 6.0m — X: 1.0 a 7.0, Z: 11.0 a 17.0) — Entrada exclusiva desde Sala
    {
      id: 'main_bathroom',
      name: 'Baño Principal',
      zone: 1,
      bounds: { x: 1.0, z: 11.0, width: 6.0, depth: 6.0 },
      floorColor: '#c2410c',
      floorMaterial: {
        type: 'ceramic',
        baseColor: '#c2410c',
        pattern: 'hexagonal',
        roughness: 0.4,
      },
      wallMaterial: {
        type: 'tile',
        baseColor: '#1e40af',
        pattern: 'metro_tile',
        roughness: 0.25,
      },
      spawnPoints: [
        // Botiquín sobre el mueble de tocador del baño principal
        { id: 'sp_bathroom_medkit', roomId: 'main_bathroom', position: [3.0, 0.95, 11.7], candidateItemIds: ['first_aid_kit'] },
      ],
      furniture: [
        { id: 'bathroom_sink', name: 'Tocador Doble Lavamanos', position: [3.0, 0.5, 11.7], size: [2.4, 0.9, 0.8], color: '#e2e8f0' },
        { id: 'bathroom_toilet', name: 'Inodoro y Bidet', position: [2.5, 0.4, 16.2], size: [1.2, 0.7, 0.9], color: '#f1f5f9' },
        { id: 'bathroom_tub', name: 'Bañera Clásica', position: [5.2, 0.5, 11.8], size: [2.2, 0.8, 1.2], color: '#e2e8f0' },
      ],
    },

    // Cocina Ampliada (12.0m x 14.0m — X: 7.0 a 19.0, Z: -3.0 a 11.0)
    {
      id: 'kitchen',
      name: 'Cocina',
      zone: 1,
      bounds: { x: 7.0, z: -3.0, width: 12.0, depth: 14.0 },
      floorColor: '#8B6914',
      floorMaterial: {
        type: 'wood',
        baseColor: '#8B6914',
        pattern: 'planks',
        roughness: 0.75,
      },
      wallMaterial: {
        type: 'tile',
        baseColor: '#ffffff',
        secondaryColor: '#7f1d1d',
        pattern: 'checkerboard',
        roughness: 0.3,
      },
      spawnPoints: [
        // Torta de Cumpleaños sobre Nivel 1 de la Repisa Alacena
        { id: 'sp_kitchen_cake', roomId: 'kitchen', position: [11.8, 0.95, -2.4], candidateItemIds: ['birthday_cake'] },
        // Caja de comida rápida sobre Nivel 2 de la Repisa Alacena
        { id: 'sp_kitchen_food', roomId: 'kitchen', position: [14.2, 1.80, -2.4], candidateItemIds: ['fast_food_box'] },
      ],
      furniture: [
        // Gran Isla Central de Cocina
        { id: 'kitchen_island', name: 'Isla Central de Cocina', position: [13.0, 0.5, 3.5], size: [4.6, 1.0, 1.8], color: '#4a5568' },
        // Refrigerador Americano Doble
        { id: 'kitchen_fridge', name: 'Refrigerador Doble', position: [8.5, 1.1, -1.8], size: [1.6, 2.2, 1.2], color: '#cbd5e1' },
        // Barra Auxiliar con Taburetes
        { id: 'kitchen_bar', name: 'Barra de Cocina', position: [8.5, 0.5, 6.0], size: [1.2, 0.9, 3.6], color: '#78350f' },
        // Gran Repisa Alacena de 2 Niveles con Escalera
        {
          id: 'kitchen_shelf_pantry',
          name: 'Alacena Repisa de 2 Niveles con Escalera',
          position: [13.0, 0.0, -2.4],
          size: [5.2, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'right',
            style: 'modern_wood',
            showcaseLight: true,
          },
        },
      ],
    },

    // Sala Ampliada (12.0m x 11.0m — X: 7.0 a 19.0, Z: 11.0 a 22.0)
    {
      id: 'living_room',
      name: 'Sala',
      zone: 1,
      bounds: { x: 7.0, z: 11.0, width: 12.0, depth: 11.0 },
      floorColor: '#d4a76a',
      floorMaterial: {
        type: 'wood',
        baseColor: '#d4a76a',
        pattern: 'parquet',
        roughness: 0.65,
      },
      wallMaterial: {
        type: 'paint',
        baseColor: '#f5f0e6',
        pattern: 'plain',
        roughness: 0.9,
      },
      spawnPoints: [
        // Smartphone sobre Nivel 1 de la Repisa de Entretenimiento
        { id: 'sp_living_phone', roomId: 'living_room', position: [14.5, 0.95, 21.3], candidateItemIds: ['smartphone'] },
      ],
      furniture: [
        // Gran Sofá Seccional en L
        { id: 'sofa_l_main', name: 'Sofá Sección Larga', position: [9.8, 0.45, 18.5], size: [3.4, 0.8, 1.4], color: '#9b2226' },
        { id: 'sofa_l_corner', name: 'Sofá Sección Lateral', position: [8.6, 0.45, 16.2], size: [1.4, 0.8, 2.8], color: '#9b2226' },
        // Mesa de Centro
        { id: 'coffee_table', name: 'Mesa de Centro', position: [11.8, 0.25, 16.5], size: [2.0, 0.5, 1.4], color: '#78350f' },
        // Mueble de Televisión y Sonido
        { id: 'tv_stand', name: 'Centro de Entretenimiento TV', position: [18.2, 0.5, 13.0], size: [0.8, 1.0, 2.8], color: '#334155' },
        // Repisa de Sala de 2 Niveles con Escalera
        {
          id: 'living_shelf_display',
          name: 'Repisa de Sala de 2 Niveles con Escalera',
          position: [14.5, 0.0, 21.3],
          size: [4.6, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'left',
            style: 'modern_wood',
            showcaseLight: true,
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    //  PASILLOS — RESTAURADOS AL ANCHO ORIGINAL DE 2.5 METROS
    // ═══════════════════════════════════════════════════════════

    // Pasillo Vertical (Norte-Sur, ANCHO EXACTO 2.5m — X: 19.0 a 21.5, Z: -3.0 a 22.0)
    {
      id: 'vertical_hallway',
      name: 'Pasillo Norte',
      zone: 1,
      bounds: { x: 19.0, z: -3.0, width: 2.5, depth: 25.0 },
      floorColor: '#64748b',
      floorMaterial: {
        type: 'concrete',
        baseColor: '#64748b',
        pattern: 'plain',
        roughness: 0.85,
      },
      spawnPoints: [],
      furniture: [],
    },

    // Pasillo Central (Horizontal Este-Oeste, FONDO EXACTO 2.5m — X: 7.0 a 39.0, Z: 22.0 a 24.5)
    {
      id: 'central_hallway',
      name: 'Pasillo Central',
      zone: 1,
      bounds: { x: 7.0, z: 22.0, width: 32.0, depth: 2.5 },
      floorColor: '#64748b',
      floorMaterial: {
        type: 'concrete',
        baseColor: '#64748b',
        pattern: 'plain',
        roughness: 0.85,
      },
      spawnPoints: [
        // Rollo de cinta adhesiva sobre el pasillo central
        { id: 'sp_hallway_tape', roomId: 'central_hallway', position: [16.0, 0.3, 23.25], candidateItemIds: ['tape_roll'] },
      ],
      furniture: [],
    },

    // ═══════════════════════════════════════════════════════════
    //  ZONA 2 — ALTA RECOMPENSA (Habitaciones Ampliadas)
    // ═══════════════════════════════════════════════════════════

    // Habitación Principal Ampliada (15.0m x 14.0m — X: 21.5 a 36.5, Z: -3.0 a 11.0)
    {
      id: 'bedroom',
      name: 'Habitación Principal',
      zone: 2,
      bounds: { x: 21.5, z: -3.0, width: 15.0, depth: 14.0 },
      floorColor: '#f5f0e6',
      floorMaterial: {
        type: 'carpet',
        baseColor: '#f5f0e6',
        pattern: 'carpet',
        roughness: 0.95,
      },
      wallMaterial: {
        type: 'paint',
        baseColor: '#d1d5db',
        pattern: 'plain',
        roughness: 0.9,
      },
      spawnPoints: [
        // Llaves del vecino sobre Nivel 2 de la Repisa Boutíque
        { id: 'sp_bedroom_key', roomId: 'bedroom', position: [26.0, 1.80, -2.3], candidateItemIds: ['neighbor_key'] },
      ],
      furniture: [
        // Gran Cama King Size Matrimonial
        { id: 'bed_double', name: 'Cama King Size', position: [32.0, 0.5, -0.6], size: [3.6, 0.9, 3.2], color: '#6b21a8' },
        { id: 'nightstand_l', name: 'Mesita Noche Izq', position: [29.2, 0.4, -1.5], size: [1.0, 0.6, 0.8], color: '#78350f' },
        { id: 'nightstand_r', name: 'Mesita Noche Der', position: [34.8, 0.4, -1.5], size: [1.0, 0.6, 0.8], color: '#78350f' },
        // Sillón de Lectura y Tocador
        { id: 'bedroom_armchair', name: 'Sillón de Lectura', position: [25.0, 0.45, 6.0], size: [1.6, 0.8, 1.4], color: '#4b5563' },
        // Repisa Boutíque de 2 Niveles con Escalera
        {
          id: 'bedroom_shelf_wardrobe',
          name: 'Repisa Boutíque de 2 Niveles con Escalera',
          position: [26.0, 0.0, -2.3],
          size: [4.8, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'right',
            style: 'chic_white',
            showcaseLight: true,
          },
        },
      ],
    },

    // Baño de Habitación Ampliado (7.0m x 9.0m — X: 36.5 a 43.5, Z: -3.0 a 6.0)
    {
      id: 'bedroom_bathroom',
      name: 'Baño de Habitación',
      zone: 2,
      bounds: { x: 36.5, z: -3.0, width: 7.0, depth: 9.0 },
      floorColor: '#c2410c',
      floorMaterial: {
        type: 'ceramic',
        baseColor: '#c2410c',
        pattern: 'hexagonal',
        roughness: 0.4,
      },
      wallMaterial: {
        type: 'tile',
        baseColor: '#1e40af',
        pattern: 'metro_tile',
        roughness: 0.25,
      },
      spawnPoints: [
        // Perfume de Lujo sobre Nivel 1 de la Repisa Cosmética
        { id: 'sp_bedbath_perfume', roomId: 'bedroom_bathroom', position: [40.0, 0.95, -2.3], candidateItemIds: ['luxury_perfume'] },
      ],
      furniture: [
        // Ducha Italiana / Jacuzzi
        { id: 'bedbath_shower', name: 'Jacuzzi & Cabina de Ducha', position: [41.0, 0.9, 3.5], size: [2.6, 1.8, 2.6], color: '#94a3b8' },
        { id: 'bedbath_vanity', name: 'Mueble Lavamanos Suite', position: [38.0, 0.5, -1.4], size: [1.6, 0.9, 0.8], color: '#e2e8f0' },
        // Repisa Cosmética de 2 Niveles
        {
          id: 'bedbath_shelf_vanity',
          name: 'Repisa Cosmética de 2 Niveles',
          position: [40.0, 0.0, -2.3],
          size: [4.2, 2.2, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.70],
            ladderSide: 'left',
            style: 'chic_white',
            showcaseLight: true,
          },
        },
      ],
    },

    // Comedor Ampliado (15.0m x 11.0m — X: 21.5 a 36.5, Z: 11.0 a 22.0)
    {
      id: 'dining_room',
      name: 'Comedor',
      zone: 2,
      bounds: { x: 21.5, z: 11.0, width: 15.0, depth: 11.0 },
      floorColor: '#d4a76a',
      floorMaterial: {
        type: 'wood',
        baseColor: '#d4a76a',
        pattern: 'parquet',
        roughness: 0.65,
      },
      wallMaterial: {
        type: 'brick',
        baseColor: '#9a3412',
        pattern: 'brick',
        roughness: 0.85,
      },
      spawnPoints: [
        // Regalo Principal sobre Nivel 2 del Gran Aparador Repisa
        { id: 'sp_dining_gift', roomId: 'dining_room', position: [31.0, 1.80, 21.3], candidateItemIds: ['mystery_gift'] },
      ],
      furniture: [
        // Gran Mesa de Banquete
        { id: 'dining_table', name: 'Gran Mesa de Banquete', position: [28.5, 0.5, 16.0], size: [4.8, 1.0, 2.2], color: '#7f1d1d' },
        // Buffet Auxiliar
        { id: 'dining_buffet', name: 'Mueble Bar Buffet', position: [35.5, 0.5, 14.0], size: [0.8, 1.0, 3.2], color: '#78350f' },
        // Gran Aparador Repisa de 2 Niveles con Escalera
        {
          id: 'dining_shelf_buffet',
          name: 'Aparador Repisa de 2 Niveles con Escalera',
          position: [31.0, 0.0, 21.3],
          size: [5.2, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'right',
            style: 'classic_library',
            showcaseLight: true,
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    //  ZONA 3 — PELIGRO / SIGILO (Sur Ampliado)
    // ═══════════════════════════════════════════════════════════

    // Librería / Estudio Ampliada (12.0m x 14.0m — X: 7.0 a 19.0, Z: 24.5 a 38.5)
    {
      id: 'library',
      name: 'Librería / Estudio',
      zone: 3,
      bounds: { x: 7.0, z: 24.5, width: 12.0, depth: 14.0 },
      floorColor: '#3c1a00',
      floorMaterial: {
        type: 'wood',
        baseColor: '#3c1a00',
        pattern: 'planks',
        roughness: 0.55,
      },
      wallMaterial: {
        type: 'wood_panel',
        baseColor: '#1a3a2a',
        pattern: 'boiserie',
        roughness: 0.75,
      },
      isRiskArea: false,
      spawnPoints: [
        // Tablet con Playlist sobre Nivel 2 de la Gran Biblioteca Repisa
        { id: 'sp_library_tablet', roomId: 'library', position: [13.0, 1.85, 37.8], candidateItemIds: ['tablet_playlist'] },
      ],
      furniture: [
        // Escritorio Central Ejecutivo
        { id: 'study_desk', name: 'Gran Escritorio Ejecutivo', position: [13.0, 0.5, 31.0], size: [3.4, 0.9, 1.6], color: '#44403c' },
        // Estantería Lateral Este
        { id: 'bookshelf_east', name: 'Estantería Lateral Este', position: [18.2, 1.1, 32.0], size: [0.8, 2.2, 4.2], color: '#78350f' },
        // Gran Biblioteca Repisa de 2 Niveles con Escalera
        {
          id: 'library_shelf_main',
          name: 'Biblioteca Repisa de 2 Niveles con Escalera',
          position: [13.0, 0.0, 37.8],
          size: [5.6, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'left',
            style: 'classic_library',
            showcaseLight: true,
          },
        },
      ],
    },

    // Departamento del Vecino Ampliado (20.0m x 14.0m — X: 19.0 a 39.0, Z: 24.5 a 38.5) — ALTO RIESGO
    {
      id: 'neighbor_apartment',
      name: 'Departamento de Vecino',
      zone: 3,
      bounds: { x: 19.0, z: 24.5, width: 20.0, depth: 14.0 },
      floorColor: '#44403c',
      floorMaterial: {
        type: 'concrete',
        baseColor: '#44403c',
        pattern: 'plain',
        roughness: 0.95,
      },
      wallMaterial: {
        type: 'concrete',
        baseColor: '#292524',
        pattern: 'plain',
        roughness: 0.9,
      },
      isRiskArea: true,
      spawnPoints: [
        // Parlante Pro sobre Nivel 2 del Rack Industrial
        { id: 'sp_neighbor_speaker', roomId: 'neighbor_apartment', position: [33.0, 1.85, 37.8], candidateItemIds: ['pro_speaker'] },
      ],
      furniture: [
        // Sillón Reclinable y Mesas de Cerveza
        { id: 'neighbor_couch', name: 'Sillones Reclinables Peligro', position: [28.0, 0.5, 31.5], size: [3.8, 0.9, 2.0], color: '#3f3f46', riskZone: true },
        // Pilas de Cajas de Trastos Peligrosas
        { id: 'neighbor_boxes', name: 'Pilas de Cajas Trastos', position: [36.5, 0.6, 31.0], size: [2.4, 1.2, 2.4], color: '#78716c', riskZone: true },
        // Repisa Rack Industrial de 2 Niveles con Escalera
        {
          id: 'neighbor_shelf_industrial',
          name: 'Repisa Industrial de 2 Niveles con Escalera',
          position: [33.0, 0.0, 37.8],
          size: [5.6, 2.4, 0.7],
          isShelf: true,
          shelfConfig: {
            tierHeights: [0.85, 1.75],
            ladderSide: 'right',
            style: 'industrial_metal',
            showcaseLight: true,
          },
        },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  //  PUERTAS (Aperturas despejadas de 1.8m a 2.2m)
  // ═══════════════════════════════════════════════════════════
  doors: [
    // 1. Ascensor -> Pasillo Central (salida este)
    { position: [7.0, 23.25], width: 1.8, connects: ['elevator_dropzone', 'central_hallway'], direction: 'x' },

    // 2. Baño Principal -> Sala (puerta interna exclusiva)
    { position: [7.0, 14.0], width: 2.0, connects: ['main_bathroom', 'living_room'], direction: 'x' },

    // 3. Cocina -> Pasillo Vertical (puerta este)
    { position: [19.0, 4.0], width: 2.0, connects: ['kitchen', 'vertical_hallway'], direction: 'x' },

    // 4. Cocina -> Sala (puerta interna norte-sur)
    { position: [13.0, 11.0], width: 2.2, connects: ['kitchen', 'living_room'], direction: 'z' },

    // 5. ENTRADA PRINCIPAL A LA SALA: Pasillo Vertical -> Sala (muro este)
    { position: [19.0, 17.0], width: 2.0, connects: ['vertical_hallway', 'living_room'], direction: 'x' },

    // 6. Pasillo Vertical -> Habitación (puerta este)
    { position: [21.5, 4.0], width: 2.0, connects: ['vertical_hallway', 'bedroom'], direction: 'x' },

    // 7. Habitación -> Baño de Habitación (puerta este en X=36.5)
    { position: [36.5, 1.0], width: 2.0, connects: ['bedroom', 'bedroom_bathroom'], direction: 'x' },

    // 8. Pasillo Vertical -> Comedor (puerta oeste del comedor, única entrada)
    { position: [21.5, 16.0], width: 2.0, connects: ['vertical_hallway', 'dining_room'], direction: 'x' },

    // 9. Pasillo Central -> Librería (puerta sur)
    { position: [13.0, 24.5], width: 2.2, connects: ['central_hallway', 'library'], direction: 'z' },

    // 10. Pasillo Central -> Departamento del Vecino (puerta sur de alto riesgo)
    { position: [29.0, 24.5], width: 2.2, connects: ['central_hallway', 'neighbor_apartment'], direction: 'z' },
  ],

  // ═══════════════════════════════════════════════════════════
  //  PAREDES (Perímetro exterior herméticamente sellado y tabiques con vanos exactos)
  // ═══════════════════════════════════════════════════════════
  walls: [
    // ─── PERÍMETRO EXTERIOR (Muros de carga 30cm - 100% infranqueables) ─
    // Norte (Cocina + Pasillo Vertical + Habitación + Baño Habitación Z=-3.0, X: 7.0 a 43.5):
    { from: [7.0, -3.0], to: [43.5, -3.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Este superior (Baño Habitación X=43.5, Z: -3.0 a 6.0):
    { from: [43.5, -3.0], to: [43.5, 6.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Quiebre sur de Baño Habitación (Z=6.0, X: 36.5 a 43.5):
    { from: [36.5, 6.0], to: [43.5, 6.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Este (Habitación + Comedor X=36.5, Z: 6.0 a 22.0):
    { from: [36.5, 6.0], to: [36.5, 22.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Quiebre este de Pasillo Central (Z=22.0, X: 36.5 a 39.0):
    { from: [36.5, 22.0], to: [39.0, 22.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Este (Pasillo Central X=39.0, Z: 22.0 a 24.5):
    { from: [39.0, 22.0], to: [39.0, 24.5], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Este (Departamento de Vecino X=39.0, Z: 24.5 a 38.5):
    { from: [39.0, 24.5], to: [39.0, 38.5], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Sur (Departamento de Vecino + Librería Z=38.5, X: 39.0 a 7.0):
    { from: [39.0, 38.5], to: [7.0, 38.5], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Oeste (Librería X=7.0, Z: 38.5 a 24.5):
    { from: [7.0, 38.5], to: [7.0, 24.5], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Ascensor (Sur Z=24.5, X: 7.0 a 1.0):
    { from: [7.0, 24.5], to: [1.0, 24.5], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Ascensor (Oeste X=1.0, Z: 24.5 a 22.0):
    { from: [1.0, 24.5], to: [1.0, 22.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Ascensor (Norte Z=22.0, X: 1.0 a 7.0) — Cierra totalmente el ascensor por arriba:
    { from: [1.0, 22.0], to: [7.0, 22.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro exterior oeste de la Sala entre Ascensor y Baño Principal (X=7.0, Z: 17.0 a 22.0):
    { from: [7.0, 17.0], to: [7.0, 22.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro exterior oeste entre Ascensor y Baño Principal (X=1.0, Z: 22.0 a 17.0):
    { from: [1.0, 22.0], to: [1.0, 17.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro sur de Baño Principal (Z=17.0, X: 1.0 a 7.0) — Cierra totalmente el baño al sur:
    { from: [1.0, 17.0], to: [7.0, 17.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro oeste de Baño Principal (X=1.0, Z: 17.0 a 11.0):
    { from: [1.0, 17.0], to: [1.0, 11.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro norte de Baño Principal (Z=11.0, X: 1.0 a 7.0):
    { from: [1.0, 11.0], to: [7.0, 11.0], thickness: 0.3, height: 2.6, type: 'exterior' },
    // Muro oeste de Cocina (X=7.0, Z: 11.0 a -3.0):
    { from: [7.0, 11.0], to: [7.0, -3.0], thickness: 0.3, height: 2.6, type: 'exterior' },

    // ─── MUROS INTERIORES Y TABIQUES (15cm y 30cm) ──────────

    // Muro Oeste Sala / Este Baño Principal (X=7.0, Z: 11.0 a 17.0)
    // Puerta al Baño en Z=14.0 (ancho 2.0 -> hueco Z: 13.0 a 15.0)
    { from: [7.0, 11.0], to: [7.0, 13.0], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [7.0, 15.0], to: [7.0, 17.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Ascensor y Pasillo Central (X=7.0, Z: 22.0 a 24.5)
    // Puerta en Z=23.25 (ancho 1.8 -> hueco Z: 22.35 a 24.15)
    { from: [7.0, 22.0], to: [7.0, 22.35], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [7.0, 24.15], to: [7.0, 24.5], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Cocina y Sala (Z=11.0, X: 7.0 a 19.0)
    // Puerta en X=13.0 (ancho 2.2 -> hueco X: 11.9 a 14.1)
    { from: [7.0, 11.0], to: [11.9, 11.0], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [14.1, 11.0], to: [19.0, 11.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Cocina/Sala y Pasillo Vertical (X=19.0, Z: -3.0 a 22.0)
    // Puerta Cocina en Z=4.0 (ancho 2.0 -> hueco Z: 3.0 a 5.0)
    { from: [19.0, -3.0], to: [19.0, 3.0], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [19.0, 5.0], to: [19.0, 16.0], thickness: 0.15, height: 2.6, type: 'partition' },
    // Entrada Principal a la Sala en Z=17.0 (ancho 2.0 -> hueco Z: 16.0 a 18.0)
    { from: [19.0, 18.0], to: [19.0, 22.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro Sur de la Sala (Z=22.0, X: 7.0 a 19.0)
    // MURO SÓLIDO CONTINUO DE CARGA (30cm) — NO TIENE PUERTA DIRECTA AL PASILLO
    { from: [7.0, 22.0], to: [19.0, 22.0], thickness: 0.3, height: 2.6, type: 'load' },

    // Muro entre Pasillo Vertical y Habitación/Comedor (X=21.5, Z: -3.0 a 22.0)
    // Puerta Habitación en Z=4.0 (ancho 2.0 -> hueco Z: 3.0 a 5.0)
    { from: [21.5, -3.0], to: [21.5, 3.0], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [21.5, 5.0], to: [21.5, 15.0], thickness: 0.15, height: 2.6, type: 'partition' },
    // Puerta Comedor en Z=16.0 (ancho 2.0 -> hueco Z: 15.0 a 17.0)
    { from: [21.5, 17.0], to: [21.5, 22.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Habitación y Comedor (Z=11.0, X: 21.5 a 36.5)
    { from: [21.5, 11.0], to: [36.5, 11.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Habitación y Baño de Habitación (X=36.5, Z: -3.0 a 6.0)
    // Puerta en Z=1.0 (ancho 2.0 -> hueco Z: 0.0 a 2.0)
    { from: [36.5, -3.0], to: [36.5, 0.0], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [36.5, 2.0], to: [36.5, 6.0], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro entre Comedor y Pasillo Central (Z=22.0, X: 21.5 a 36.5)
    // MURO SÓLIDO CONTINUO DE CARGA (30cm) — SIN ACCESO DIRECTO DESDE EL PASILLO CENTRAL
    { from: [21.5, 22.0], to: [36.5, 22.0], thickness: 0.3, height: 2.6, type: 'load' },

    // ─── MUROS ZONA SUR (Librería y Departamento Vecino) ─────

    // Muro entre Pasillo Central y Librería/Vecino (Z=24.5, X: 7.0 a 39.0)
    // Puerta Librería en X=13.0 (ancho 2.2 -> hueco X: 11.9 a 14.1)
    { from: [7.0, 24.5], to: [11.9, 24.5], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [14.1, 24.5], to: [19.0, 24.5], thickness: 0.15, height: 2.6, type: 'partition' },
    // Puerta Vecino en X=29.0 (ancho 2.2 -> hueco X: 27.9 a 30.1)
    { from: [19.0, 24.5], to: [27.9, 24.5], thickness: 0.15, height: 2.6, type: 'partition' },
    { from: [30.1, 24.5], to: [39.0, 24.5], thickness: 0.15, height: 2.6, type: 'partition' },

    // Muro divisorio entre Librería y Vecino (X=19.0, Z: 24.5 a 38.5)
    { from: [19.0, 24.5], to: [19.0, 38.5], thickness: 0.3, height: 2.6, type: 'load' },
  ],
};
