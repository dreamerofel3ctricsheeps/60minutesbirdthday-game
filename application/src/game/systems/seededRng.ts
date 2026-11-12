/**
 * RNG determinista con seed (mulberry32) para la fase de recolección.
 * Misma seed → misma secuencia: el spawn de ítems y la distribución de
 * roomies son reproducibles por partida (útil para debug y tests).
 */
export type SeededRng = () => number;

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates con el RNG dado; no muta el array original. */
export function shuffled<T>(values: readonly T[], rng: SeededRng): T[] {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
