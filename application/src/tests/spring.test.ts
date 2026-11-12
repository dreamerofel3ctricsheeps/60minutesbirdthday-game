import { describe, it, expect } from 'vitest';
import {
  createSpring,
  stepSpring,
  carrySwayTarget,
  carrySwayFrequency,
} from '@/game/systems/spring';

/**
 * Física secundaria de la carga (segunda corrección de arte): el resorte
 * que hace que el roomie al hombro y los ítems NO vayan pegados al
 * portador — rebotan con retardo y se asientan al detenerse.
 */
describe('stepSpring', () => {
  it('converge al objetivo y se asienta (≈ sin velocidad residual)', () => {
    const s = createSpring(0);
    for (let i = 0; i < 300; i++) stepSpring(s, 1, 90, 8, 1 / 60);
    expect(s.value).toBeCloseTo(1, 2);
    expect(Math.abs(s.velocity)).toBeLessThan(0.05);
  });

  it('con poco amortiguamiento SOBREpasa el objetivo (rebote)', () => {
    const s = createSpring(0);
    let overshot = false;
    for (let i = 0; i < 120; i++) {
      stepSpring(s, 1, 120, 1.5, 1 / 60);
      if (s.value > 1.05) overshot = true;
    }
    expect(overshot).toBe(true);
  });

  it('dt=0 o negativo no mueve el estado; dt enorme se clampa', () => {
    const s = createSpring(0.5);
    stepSpring(s, 2, 90, 8, 0);
    expect(s.value).toBe(0.5);
    stepSpring(s, 2, 90, 8, -1);
    expect(s.value).toBe(0.5);
    const big = createSpring(0);
    stepSpring(big, 1, 90, 8, 10); // se clampa a 50ms: avance finito
    expect(Number.isFinite(big.value)).toBe(true);
    expect(big.value).toBeLessThan(1);
  });

  it('persigue un objetivo móvil sin explotar (señal senoidal acotada)', () => {
    const s = createSpring(0);
    let t = 0;
    for (let i = 0; i < 600; i++) {
      t += 1 / 60;
      stepSpring(s, Math.sin(t * 9) * 0.06, 90, 7, 1 / 60);
      expect(Number.isFinite(s.value)).toBe(true);
      expect(Math.abs(s.value)).toBeLessThan(0.2);
    }
  });
});

describe('carrySwayTarget', () => {
  it('en idle el objetivo es reposo (la carga se asienta)', () => {
    expect(carrySwayTarget('idle', 1.3)).toEqual({ y: 0, rotZ: 0 });
  });

  it('al correr el balanceo es mayor que al caminar', () => {
    let maxWalk = 0;
    let maxRun = 0;
    for (let p = 0; p < Math.PI * 2; p += 0.1) {
      maxWalk = Math.max(maxWalk, Math.abs(carrySwayTarget('walk', p).rotZ));
      maxRun = Math.max(maxRun, Math.abs(carrySwayTarget('run', p).rotZ));
    }
    expect(maxRun).toBeGreaterThan(maxWalk);
    expect(maxRun).toBeCloseTo(0.085, 3);
  });

  it('la frecuencia de carrera supera a la de caminata', () => {
    expect(carrySwayFrequency('run')).toBeGreaterThan(carrySwayFrequency('walk'));
  });
});
