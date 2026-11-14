#!/usr/bin/env node
/* check_defined.js — Harness de verificación de las hojas definidas (v3.1).
   Esta base no tiene tests; este script compensa cargando data.js y
   defined-sheets.js en Node y afirmando el contrato que el motor espera:

   1. Todo personaje de G.CHARS existe en DEFINED_META (pollito = el gato).
   2. Toda animación requerida por la máquina de animación de world.js
      tiene >= 1 frame (humanos: idle, idle_up, idle_right, walk_down,
      walk_up, walk_right, run_down, run_up, run_right, act; Jose además
      sneak y celebrate; el gato: idle, walk, pounce y su vista trasera
      back_idle/back_jump para la escalada de repisas). Los 7 ROOMIES
      además carried y carrywalk_down/up/right (carga de partners en la
      recolección: portador con carrywalk_*, pasajero con carried).
   3. Todo rect de celda cae dentro de su hoja (cols/filas vs sw/sh) y el
      dataURL decodifica a un PNG de esas dimensiones exactas.
   4. Ojos: >= 90% de los frames frontales (idle, walk_down, run_down, act)
      de cada humano tienen ojos registrados (detectados o cristales en
      Jose); el resto debe estar marcado como fallback 'avg'.
   5. Manos de la carga: todo roomie registra en la metadata el apoyo de
      sus manos levantadas (hands, px sobre el piso por frame carrywalk_*,
      rango plausible 140–220): es el ancla donde descansa el pasajero.
      Y su carriedRest (px que el torso carried debe hundirse desde su
      línea base para apoyar sobre esas manos, 0–55).

   Uso: node tools/check_defined.js   (exit 0 = OK, 1 = fallos)
*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'application', 'src');
// data.js y defined-sheets.js son IIFEs que cuelgan de window: les damos uno.
global.window = {};
for (const f of ['js/defined-sheets.js', 'js/data.js']) {
  new Function(fs.readFileSync(path.join(SRC, f), 'utf8'))();
}
const G = global.window.G;

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : ' FAIL ') + msg); if (!cond) fails++; };

const META = G.DEFINED_META, DATA = G.DEFINED_DATA;
ok(!!META && !!DATA, 'DEFINED_META y DEFINED_DATA presentes');

const HUMANS = ['alan', 'fatima', 'itzel', 'majo', 'natalia', 'samantha', 'saulo', 'ximena', 'jose'];
const ROOMIES = ['alan', 'fatima', 'itzel', 'majo', 'natalia', 'samantha', 'saulo'];
const REQ_HUMAN = ['idle', 'idle_up', 'idle_right', 'walk_down', 'walk_up', 'walk_right', 'run_down', 'run_up', 'run_right', 'act'];
const REQ_CARRY = ['carried', 'carrywalk_down', 'carrywalk_up', 'carrywalk_right'];
const FRONT = ['idle', 'walk_down', 'run_down', 'act'];

// 1. todo personaje de data.js existe
for (const id of Object.keys(G.CHARS)) {
  ok(!!META.chars[id], `personaje ${id} (de data.js) tiene hoja`);
  ok(typeof DATA[id] === 'string' && DATA[id].startsWith('data:image/png;base64,'), `personaje ${id} tiene dataURL PNG`);
}

// 3 (parcial): dimensiones reales del PNG contra la metadata
function pngSize(buf) {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
for (const [id, m] of Object.entries(META.chars)) {
  const buf = Buffer.from(DATA[id].split(',')[1], 'base64');
  const sz = pngSize(buf);
  ok(!!sz && sz.w === m.sw && sz.h === m.sh, `${id}: PNG ${sz ? sz.w + 'x' + sz.h : '?'} == metadata ${m.sw}x${m.sh}`);
  const rows = Math.ceil(Math.max(...Object.values(m.anims).flat(), 0) / m.cols) + 1;
  ok((rows) * m.fh <= m.sh + m.fh && m.cols * m.fw >= m.sw - m.fw, `${id}: rejilla de celdas coherente (cols=${m.cols}, fw=${m.fw}, fh=${m.fh})`);
  for (const [anim, cells] of Object.entries(m.anims)) {
    for (const c of cells) {
      const x = (c % m.cols) * m.fw, y = Math.floor(c / m.cols) * m.fh;
      if (!(x + m.fw <= m.sw && y + m.fh <= m.sh)) { ok(false, `${id}/${anim}: celda ${c} fuera de la hoja`); }
    }
  }
}

// 2 + 4. animaciones requeridas y cobertura de ojos
for (const id of HUMANS) {
  const m = META.chars[id]; if (!m) continue;
  let req = id === 'jose' ? REQ_HUMAN.concat(['sneak', 'celebrate']) : REQ_HUMAN;
  if (ROOMIES.includes(id)) req = req.concat(REQ_CARRY);
  for (const a of req) ok(Array.isArray(m.anims[a]) && m.anims[a].length >= 1, `${id}: animación ${a} con frames`);
  let total = 0, det = 0, avgBad = 0;
  for (const a of FRONT) for (const c of (m.anims[a] || [])) {
    total++;
    const src = (m.eyesSrc || {})[c];
    if (src === 'det' || src === 'lens') det++;
    else if (src !== 'avg' || !(m.eyes || {})[c]) avgBad++;
  }
  ok(total > 0 && det / total >= 0.9, `${id}: ojos detectados en frontales ${det}/${total} (${(det / total * 100).toFixed(0)}% >= 90%)`);
  ok(avgBad === 0, `${id}: todo frontal sin detectar usa fallback 'avg' con ojos`);
}
// 5. ancla de manos de la carga en los 7 roomies
for (const id of ROOMIES) {
  const m = META.chars[id]; if (!m) continue;
  for (const a of ['carrywalk_down', 'carrywalk_up', 'carrywalk_right']) {
    const hv = (m.hands || {})[a];
    ok(Array.isArray(hv) && hv.length === (m.anims[a] || []).length && hv.every((v) => v >= 140 && v <= 220),
      `${id}: manos registradas en ${a} (${Array.isArray(hv) ? hv.join('/') : 'sin hands'})`);
  }
  ok(typeof m.carriedRest === 'number' && m.carriedRest >= 0 && m.carriedRest <= 55,
    `${id}: carriedRest registrado (${m.carriedRest})`);
}

const cat = META.chars.pollito;
if (cat) for (const a of ['idle', 'walk', 'pounce']) ok(Array.isArray(cat.anims[a]) && cat.anims[a].length >= 1, `pollito: animación ${a} con frames`);
// Vista TRASERA del gato (escalada de repisas: trepa de espaldas como el
// jugador): back_idle sentado (>= 1) y back_jump saltando/trepando (>= 2:
// estirado hacia arriba y recogido). Sin esto el duelo no puede mostrarlo
// de espaldas y caería en el frontal de siempre.
if (cat) {
  ok(Array.isArray(cat.anims.back_idle) && cat.anims.back_idle.length >= 1, `pollito: animación back_idle (trasera quieto) con frames (${(cat.anims.back_idle || []).length})`);
  ok(Array.isArray(cat.anims.back_jump) && cat.anims.back_jump.length >= 2, `pollito: animación back_jump (trasera saltando) con >= 2 frames (${(cat.anims.back_jump || []).length})`);
}

console.log(fails ? `\n${fails} FALLOS` : '\nTODO OK');
process.exit(fails ? 1 : 0);
