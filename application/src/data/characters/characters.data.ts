import { CharacterDefinition } from '@/types/game.types';

export const CHARACTERS_DATA: Record<string, CharacterDefinition> = {
  natalia: {
    id: 'natalia',
    name: 'Natalia',
    role: 'La Atleta Impaciente',
    description: 'Rápida y atlética. Recolecta objetos velozmente en la fase de 60 segundos.',
    attributes: { speed: 9, stealth: 3, charisma: 5, logic: 5 },
    passiveAbility: {
      id: 'athletic_sprint',
      name: 'Sprint Atleta',
      description: 'Velocidad de movimiento aumentada un 20% en fase de recolección.',
    },
    tags: ['runner', 'impatient'],
    spriteSet: 'natalia',
  },
  saulo: {
    id: 'saulo',
    name: 'Saulo',
    role: 'El Artista Dramático',
    description: 'Sube la moral del grupo ante crisis con sus dramas creativos.',
    attributes: { speed: 5, stealth: 4, charisma: 8, logic: 3 },
    passiveAbility: {
      id: 'dramatic_boost',
      name: 'Discurso Inspirador',
      description: 'Reduce la pérdida de moral grupal en eventos negativos.',
    },
    tags: ['artist', 'dramatic'],
    spriteSet: 'saulo',
  },
  itzel: {
    id: 'itzel',
    name: 'Itzel',
    role: 'La Confidente Celosa',
    description: 'Maneja el sigilo y la relación con Ximena para desviar sospechas.',
    attributes: { speed: 5, stealth: 8, charisma: 7, logic: 4 },
    passiveAbility: {
      id: 'alibi_expert',
      name: 'Coartada Perfecta',
      description: 'Reduce el incremento de sospecha en un 25%.',
    },
    tags: ['stealth', 'jealous'],
    spriteSet: 'itzel',
  },
  fatima: {
    id: 'fatima',
    name: 'Fátima',
    role: 'La Cocinera',
    description: 'Especialista en raciones y cocina. Duplica el rendimiento de la comida.',
    attributes: { speed: 4, stealth: 5, charisma: 4, logic: 9 },
    passiveAbility: {
      id: 'master_chef',
      name: 'Ración Eficiente',
      description: 'El consumo de comida por turno se reduce.',
    },
    tags: ['cook', 'logic'],
    spriteSet: 'fatima',
  },
  samantha: {
    id: 'samantha',
    name: 'Samantha',
    role: 'La Influencer',
    description: 'Gran carisma en redes. Consigue recursos externos gratis mediante favores.',
    attributes: { speed: 6, stealth: 2, charisma: 10, logic: 3 },
    passiveAbility: {
      id: 'viral_favor',
      name: 'Contacto en Redes',
      description: 'Alta probabilidad de éxito en chequeos de Carisma.',
    },
    tags: ['influencer', 'social'],
    spriteSet: 'samantha',
  },
  majo: {
    id: 'majo',
    name: 'Majo',
    role: 'La Supervisora Estricta',
    description: 'Sigilosa y metódica. Sus acciones de gestión no alertan al vecino.',
    attributes: { speed: 4, stealth: 9, charisma: 3, logic: 8 },
    passiveAbility: {
      id: 'silent_operator',
      name: 'Paso Silencioso',
      description: 'No genera ruido al ejecutar tareas durante la gestión.',
    },
    tags: ['supervisor', 'stealth'],
    spriteSet: 'majo',
  },
  alan: {
    id: 'alan',
    name: 'Alan',
    role: 'El DJ / Técnico',
    description: 'Repara fallas eléctricas y cables al instante, pero sus acciones pueden hacer ruido.',
    attributes: { speed: 7, stealth: 3, charisma: 8, logic: 5 },
    passiveAbility: {
      id: 'soundcheck',
      name: 'Genio Eléctrico',
      description: 'Resuelve eventos de fallas eléctricas sin gastar herramientas.',
    },
    tags: ['technician', 'dj'],
    spriteSet: 'alan',
  },
};

export const getCharacterById = (id: string): CharacterDefinition | undefined =>
  CHARACTERS_DATA[id];
