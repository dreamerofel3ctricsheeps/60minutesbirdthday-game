/* ============================================================
   1 MINUTO PARA LA FIESTA — Generador de sprites pixel art
   Todo el arte se dibuja por código sobre buffers de píxeles
   (frames de 64x64, estilo chibi con borde blanco, GDD §10).
   Los diseños parten de los borradores en assets/drafts/v1.2.
   ============================================================ */
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});

  // ---------- Buffer de píxeles ----------
  const colorCache = {};
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (colorCache[c]) return colorCache[c];
    const n = parseInt(c.slice(1), 16);
    return (colorCache[c] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  function shade(c, f) {
    const [r, g, b] = rgb(c);
    const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return [k(r), k(g), k(b)];
  }

  class Buf {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.d = new Uint8ClampedArray(w * h * 4);
    }
    set(x, y, c) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const p = rgb(c), i = (y * this.w + x) * 4;
      this.d[i] = p[0]; this.d[i + 1] = p[1]; this.d[i + 2] = p[2]; this.d[i + 3] = 255;
    }
    clear(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.d[(y * this.w + x) * 4 + 3] = 0;
    }
    has(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      return this.d[(y * this.w + x) * 4 + 3] > 0;
    }
    rect(x, y, w, h, c) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    }
    // elipse rellena; test(x,y) opcional para recortar
    ell(cx, cy, rx, ry, c, test) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
          if (dx * dx + dy * dy <= 1 && (!test || test(x, y))) this.set(x, y, c);
        }
    }
    line(x0, y0, x1, y1, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) this.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
    }
    // contorno de 1px alrededor de la silueta
    outline(c, diag) {
      const marks = [];
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          if (this.has(x, y)) continue;
          let n = this.has(x - 1, y) || this.has(x + 1, y) || this.has(x, y - 1) || this.has(x, y + 1);
          if (!n && diag) n = this.has(x - 1, y - 1) || this.has(x + 1, y - 1) || this.has(x - 1, y + 1) || this.has(x + 1, y + 1);
          if (n) marks.push(x, y);
        }
      for (let i = 0; i < marks.length; i += 2) this.set(marks[i], marks[i + 1], c);
      return this;
    }
    flipX() {
      const o = new Buf(this.w, this.h);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const a = (y * this.w + x) * 4, b = (y * this.w + (this.w - 1 - x)) * 4;
          o.d[b] = this.d[a]; o.d[b + 1] = this.d[a + 1]; o.d[b + 2] = this.d[a + 2]; o.d[b + 3] = this.d[a + 3];
        }
      return o;
    }
  }

  const INK = '#2b1d24';
  const WHITE = '#ffffff';

  // ---------- Definición visual de personajes ----------
  // Basado en los borradores: ojos enormes blancos, cabeza grande, cuerpo pequeño.
  const LOOKS = {
    ximena:   { skin: '#eaa67e', hair: '#7a4a2c', style: 'long_bunny', top: '#f2f2f7', sleeves: 'long', bottom: '#3a4150', shoes: '#22242c', glasses: true },
    natalia:  { skin: '#dd9a6f', hair: '#8a5230', style: 'bun_top', top: '#1e7bff', sleeves: 'short', bottom: '#2b3440', shorts: true, shoes: '#ff5bd1' },
    itzel:    { skin: '#e9a47c', hair: '#7b4a2e', style: 'pigtails', top: '#f3a6d0', sleeves: 'long', bottom: '#1d1d24', shoes: '#33333d', frown: true },
    alan:     { skin: '#eaa283', hair: '#4a2c1c', style: 'cap_back', top: '#1c1c21', sleeves: 'short', bottom: '#5d7a3a', shoes: '#c8f02a' },
    fatima:   { skin: '#e3a078', hair: '#8b4f2d', style: 'side_bun', hat: 'chef', top: '#dcc6a2', sleeves: 'long', bottom: '#4f77a8', shoes: '#5b3b2a' },
    majo:     { skin: '#e6a27a', hair: '#8b4f2d', style: 'side_bun', top: '#27345e', sleeveColor: '#eeeef4', sleeves: 'long', bottom: '#6d6f7c', shoes: '#26262c' },
    samantha: { skin: '#dc9b72', hair: '#6e4028', style: 'ponytail', top: '#d01fb0', sleeves: 'long', bottom: '#1b1b20', shoes: '#f4f4f8' },
    saulo:    { skin: '#e5a57e', hair: '#7a4b2c', style: 'curly', top: '#c47a55', sleeves: 'long', bottom: '#6f8fb0', shoes: '#b9b2a6', stubble: true },
    jose:     { skin: '#dc9a72', hair: '#17171c', style: 'short', top: '#2f5a3c', sleeves: 'long', bottom: '#7fa3c9', shoes: '#f4f4f8', sunglasses: true },
  };

  const HCX = 32, HCY = 27, HRX = 13, HRY = 12; // cabeza

  function inHead(x, y, grow) {
    const dx = (x - HCX) / (HRX + (grow || 0) + 0.35), dy = (y - (HCY - (grow ? 1 : 0))) / (HRY + (grow || 0) + 0.35);
    return dx * dx + dy * dy <= 1;
  }

  // ----- pelo: capa trasera (se ve detrás de cabeza/hombros) -----
  function hairBack(b, L, view, oy) {
    const c = L.hair, d = shade(c, 0.8);
    const len = { long_bunny: 49, bun_top: 45, ponytail: 36, pigtails: 0, side_bun: 0, curly: 0, cap_back: 0, short: 0 }[L.style];
    if (len && view !== 'back') {
      if (view === 'front') {
        for (let y = 24 + oy; y <= len + oy; y++) {
          const wob = L.style === 'long_bunny' ? 0 : ((y >> 2) & 1);
          b.rect(18 - wob, y, 28 + wob * 2, 1, y > len + oy - 2 ? d : c);
        }
      } else { // side (mirando a la derecha): melena hacia atrás
        for (let y = 24 + oy; y <= len + oy; y++) b.rect(18 - ((y >> 2) & 1), y, 12, 1, y > len + oy - 2 ? d : c);
      }
    }
    if (L.style === 'pigtails') {
      if (view === 'side') b.ell(20, 19 + oy, 5, 6, c);
      else { b.ell(16, 20 + oy, 5, 6, c); b.ell(48, 20 + oy, 5, 6, c); b.ell(15, 24 + oy, 3, 3, d); b.ell(49, 24 + oy, 3, 3, d); }
    }
    if (L.style === 'ponytail') {
      if (view === 'front') { b.ell(42, 11 + oy, 5, 5, c); for (let y = 12; y < 36; y++) b.rect(44 + ((y >> 2) & 1), y + oy, 5, 1, c); }
      else if (view === 'side') { b.ell(22, 11 + oy, 5, 5, c); for (let y = 12; y < 38; y++) b.rect(14 + ((y >> 2) & 1), y + oy, 6, 1, c); }
    }
    if (L.style === 'side_bun') {
      if (view === 'front') b.ell(45, 34 + oy, 4, 4, d);
      else if (view === 'side') b.ell(19, 32 + oy, 4, 4, d);
    }
    if (L.style === 'bun_top') {
      if (view === 'front') b.ell(40, 13 + oy, 5, 4, c);
      else if (view === 'side') b.ell(27, 12 + oy, 5, 4, c);
    }
    if (L.style === 'long_bunny') ears(b, view, oy);
  }

  function ears(b, view, oy) {
    const p = '#8f5fd6', pl = '#b48cf0', pd = '#6d43ad';
    const one = (x, tilt) => {
      for (let y = 3; y <= 16; y++) {
        const xx = x + Math.round(((16 - y) * tilt) / 13);
        b.rect(xx, y + oy, 5, 1, y < 5 ? pl : p);
        if (y > 5 && y < 14) b.set(xx + 2, y + oy, pl);
        if (y === 9) b.rect(xx, y + oy, 5, 1, pd); // doblez de la oreja de Bonnie
      }
    };
    if (view === 'side') { one(27, -2); one(31, 2); }
    else { one(23, -3); one(37, 3); }
  }

  // ----- pelo: capa frontal sobre la cabeza -----
  function hairFront(b, L, view, oy) {
    const c = L.hair, d = shade(c, 0.8), l = shade(c, 1.22);
    const st = L.style;
    const long = st === 'long_bunny' || st === 'bun_top' || st === 'ponytail';
    for (let y = 10; y <= 52; y++)
      for (let x = 12; x <= 52; x++) {
        const yy = y - oy;
        if (!inHead(x, yy, 1)) continue;
        let on = false;
        const dx = Math.abs(x - HCX);
        if (view === 'back') on = true;
        else if (view === 'front') {
          let hl = 18 + dx * 0.45; // raya al medio, frente despejada
          if (st === 'pigtails') hl = 20 + (x < 32 ? 0 : -1) + ((x >> 1) & 1); // flequillo
          if (st === 'curly') hl = 19 + ((x >> 1) & 1) * 2;
          if (st === 'short') hl = 20 + ((x + 1) % 3 === 0 ? 2 : 0);
          if (st === 'cap_back') hl = 22 + ((x % 3 === 0) ? 2 : 0);
          on = yy <= hl || (dx >= 12 && yy <= (long ? 40 : st === 'cap_back' ? 29 : 31));
        } else { // side →
          on = yy <= 19 + Math.max(0, (36 - x)) * 0.2 || x <= 28 - Math.max(0, yy - 30) * (long ? 0 : 0.8);
          if (st === 'cap_back') on = yy <= 21 || x <= 26;
        }
        if (on) b.set(x, y, c);
      }
    // brillo
    if (view !== 'back' && st !== 'cap_back') { b.rect(24, 16 + oy, 5, 1, l); b.rect(23, 17 + oy, 2, 1, l); }
    if (view === 'back') { b.rect(26, 17 + oy, 6, 1, l); for (let x = 22; x <= 42; x += 4) b.rect(x, 33 + oy, 1, 4, d); }

    if (view === 'back' && long) {
      const len = st === 'long_bunny' ? 49 : st === 'bun_top' ? 45 : 30;
      for (let y = 30 + oy; y <= len + oy; y++) b.rect(18 - ((y >> 2) & 1), y, 28 + ((y >> 2) & 1) * 2, 1, y > len + oy - 2 ? d : c);
      for (let x = 22; x <= 42; x += 5) b.rect(x, 36 + oy, 1, len - 38, d);
    }
    if (st === 'bun_top' && view === 'back') b.ell(32, 12 + oy, 5, 4, c);
    if (st === 'ponytail' && view === 'back') { b.ell(32, 11 + oy, 5, 5, c); for (let y = 14; y < 40; y++) b.rect(29 + ((y >> 2) & 1), y + oy, 6, 1, y < 16 ? d : c); }
    if (st === 'side_bun' && view === 'back') b.ell(32, 36 + oy, 5, 4, d);
    if (st === 'pigtails' && view === 'back') { b.ell(16, 20 + oy, 5, 6, c); b.ell(48, 20 + oy, 5, 6, c); }
    if (st === 'pigtails') {
      const tie = '#a070e0';
      if (view === 'front') { b.rect(19, 19 + oy, 2, 3, tie); b.rect(44, 19 + oy, 2, 3, tie); b.rect(39, 21 + oy, 4, 2, '#c9a2ff'); b.rect(40, 21 + oy, 2, 1, '#8f5fd6'); }
      if (view === 'back') { b.rect(19, 19 + oy, 2, 3, tie); b.rect(44, 19 + oy, 2, 3, tie); }
    }
    if (st === 'ponytail' && view === 'front') b.rect(39, 20 + oy, 4, 2, '#f2c230');
    if (st === 'curly') {
      const pts = view === 'side' ? [[20, 22], [21, 16], [26, 12], [32, 11], [38, 13], [42, 17], [19, 28]] : [[19, 22], [21, 16], [26, 12], [32, 11], [38, 12], [43, 16], [45, 22], [19, 27], [45, 27]];
      pts.forEach(([x, y], i) => b.ell(x, y + oy, 4, 4, i % 2 ? c : shade(c, 0.92)));
      if (view === 'back') for (let y = 20; y < 38; y += 5) for (let x = 22; x < 44; x += 6) b.ell(x + ((y / 5) & 1) * 3, y + oy, 2, 2, d);
      else { b.rect(25, 15 + oy, 2, 1, l); b.rect(35, 14 + oy, 2, 1, l); }
    }
    if (st === 'long_bunny') {
      const p = '#8f5fd6';
      if (view === 'front' || view === 'back') { for (let x = 20; x <= 44; x++) { const y = 15 + Math.round(Math.pow(Math.abs(x - 32) / 12, 2) * 5); b.rect(x, y + oy, 1, 2, p); } }
      else for (let y = 14; y <= 30; y++) b.rect(29 + Math.round((y - 14) * 0.12), y + oy, 2, 1, p);
      if (view === 'front') b.ell(46, 23 + oy, 2, 3, d);
    }
    if (st === 'cap_back') {
      const cap = '#5a6468', capD = '#434c50', capL = '#77848a';
      for (let y = 10; y <= 30; y++) for (let x = 14; x <= 50; x++) {
        const yy = y - oy;
        if (!inHead(x, yy, 2)) continue;
        if (view === 'front' && yy <= 20) b.set(x, y, yy >= 19 ? capD : cap);
        if (view === 'back' && yy <= 27) b.set(x, y, yy >= 26 ? capD : cap);
        if (view === 'side' && yy <= 20) b.set(x, y, yy >= 19 ? capD : cap);
      }
      if (view === 'front') { b.rect(28, 14 + oy, 8, 4, c); b.rect(30, 12 + oy, 4, 2, c); b.rect(27, 13 + oy, 1, 5, capD); b.rect(36, 13 + oy, 1, 5, capD); b.rect(22, 15 + oy, 3, 1, capL); }
      if (view === 'back') { b.rect(23, 27 + oy, 18, 3, capD); b.rect(24, 30 + oy, 16, 1, '#2f3538'); b.rect(26, 15 + oy, 5, 1, capL); for (let x = 20; x <= 44; x++) if (x % 3) b.rect(x, 31 + oy, 1, 3 + (x & 1), c); }
      if (view === 'side') { b.rect(11, 19 + oy, 9, 3, capD); b.rect(24, 15 + oy, 5, 1, capL); }
    }
    if (L.hat === 'chef') {
      const w = '#fbfbfd', g = '#d5d5e0';
      b.rect(27, 9 + oy, 11, 7, w); b.ell(32, 7 + oy, 7, 4, w); b.ell(27, 8 + oy, 3, 3, w); b.ell(37, 8 + oy, 3, 3, w);
      b.rect(27, 14 + oy, 11, 1, g); b.rect(31, 6 + oy, 1, 4, g);
    }
  }

  function eye(b, cx, cy, expr, look, L) {
    if (L.sunglasses) { b.ell(cx, cy, 5, 5, '#15151a'); b.ell(cx, cy, 3, 3, '#3a3138'); b.set(cx - 2, cy - 2, '#77707a'); return; }
    if (expr === 'sleep' || expr === 'happy') {
      for (let i = -3; i <= 3; i++) b.set(cx + i, cy + (expr === 'happy' ? Math.abs(i) > 1 ? 1 : 0 : Math.abs(i) > 1 ? -1 : 0), INK);
      return;
    }
    b.ell(cx, cy, 5, 5, L.glasses ? '#1b1b22' : INK);
    b.ell(cx, cy, 4, 4, WHITE);
    const pr = expr === 'surprised' ? 1 : 2;
    const px = cx + (expr === 'suspicious' ? 2 : 0) + (look || 0);
    b.ell(px, cy + (expr === 'suspicious' ? 1 : 0), pr, pr, '#0b0b10');
    if (expr === 'suspicious') { b.rect(cx - 5, cy - 5, 11, 5, L.skin); b.rect(cx - 5, cy - 1, 11, 1, INK); }
    if (expr === 'angry') {
      const s = cx < 32 ? 1 : -1;
      for (let i = -5; i <= 5; i++) { const yy = cy - 3 + Math.round((i * s) / 3); b.rect(cx + i, cy - 6, 1, yy - (cy - 6), L.skin); b.set(cx + i, yy, INK); b.set(cx + i, yy - 1, INK); }
    }
    if (expr === 'tired') { b.rect(cx - 5, cy - 5, 11, 4, L.skin); b.rect(cx - 5, cy - 2, 11, 1, INK); b.rect(cx - 3, cy + 6, 7, 1, shade(L.skin, 0.78)); }
  }

  // view: 'front' | 'back' | 'side' (derecha).  frame: 0 idle, 1 y 2 caminata, 3 acción
  function drawCharacter(id, view, frame, expr) {
    const L = LOOKS[id];
    const b = new Buf(64, 64);
    expr = expr || 'neutral';
    const walk = frame === 1 || frame === 2;
    const oy = walk ? -1 : 0; // rebote
    const skin = L.skin, skinD = shade(skin, 0.82);
    const top = L.top, topD = shade(top, 0.78);
    const slv = L.sleeveColor || top, slvD = shade(slv, 0.8);
    const bot = L.bottom, botD = shade(bot, 0.78);

    hairBack(b, L, view, oy);

    // ---- piernas y zapatos ----
    const leg = (x, w, lift, fwd) => {
      const y0 = 50 + oy, y1 = 57 - lift;
      for (let y = y0; y <= y1; y++) {
        const isShort = L.shorts && y > y0 + 2;
        b.rect(x, y, w, 1, isShort ? skin : bot);
      }
      b.rect(x - (view === 'side' ? 0 : 0), y1, w, 1, isNaN(0) ? bot : (L.shorts ? skinD : botD));
      const sh = L.shoes;
      if (view === 'side') b.rect(x, y1 + 1, w + 2, 2, sh);
      else b.rect(x - (fwd < 0 ? 1 : 0), y1 + 1, w + 1, 2, sh);
      b.rect(x, y1 + 2, w + (view === 'side' ? 2 : 1) - (fwd < 0 ? 0 : 0), 1, shade(sh, 0.7));
      if (id === 'natalia') { b.set(x + 1, y1 + 1, '#ffe14a'); b.set(x + 3, y1 + 1, '#3bd0ff'); }
      if (id === 'samantha') b.set(x + 2, y1 + 1, '#d01fb0');
      if (id === 'alan') b.set(x + 1, y1 + 1, '#1c1c21');
    };
    if (view === 'side') {
      if (frame === 1) { leg(26, 4, 1, 1); leg(33, 4, 0, 1); }
      else if (frame === 2) { leg(30, 4, 0, 1); }
      else leg(29, 5, 0, 1);
    } else {
      leg(26, 5, frame === 1 ? 2 : 0, -1);
      leg(33, 5, frame === 2 ? 2 : 0, 1);
    }

    // ---- torso ----
    const ty = 39 + oy;
    if (view === 'side') {
      b.rect(27, ty, 10, 12, top); b.rect(27, ty + 10, 10, 2, topD);
    } else {
      b.rect(25, ty, 14, 12, top);
      b.rect(25, ty, 1, 12, topD); b.rect(38, ty, 1, 12, topD); b.rect(25, ty + 11, 14, 1, topD);
    }
    outfit(b, id, L, view, ty, frame);

    // ---- brazos ----
    const arm = (x, dy, up) => {
      const y0 = ty + 2 + dy, h = 8;
      if (up) { // acción: brazo arriba
        b.rect(x, ty - 4, 3, 7, slv); if (L.sleeves === 'short') b.rect(x, ty - 4, 3, 4, skin); b.rect(x, ty - 6, 3, 2, skin);
        return;
      }
      for (let y = 0; y < h; y++) {
        const c = L.sleeves === 'short' && y > 2 ? skin : y === h - 1 && L.sleeves !== 'short' ? slvD : slv;
        b.rect(x, y0 + y, 3, 1, c);
      }
      b.rect(x, y0 + h, 3, 2, skin); b.rect(x, y0 + h + 1, 3, 1, skinD);
    };
    if (view === 'side') {
      const sx = frame === 1 ? 2 : frame === 2 ? -2 : 0;
      arm(30 + sx, 0, frame === 3);
    } else {
      arm(22, frame === 1 ? 1 : frame === 2 ? -1 : 0, frame === 3);
      arm(39, frame === 2 ? 1 : frame === 1 ? -1 : 0, frame === 3);
    }

    // ---- cabeza ----
    if (view !== 'back') {
      b.ell(HCX, HCY + oy, HRX, HRY, skin);
      for (let x = 24; x <= 40; x++) b.set(x, HCY + oy + HRY - (Math.abs(x - 32) > 5 ? 1 : 0), skinD); // sombra del mentón
      if (view === 'front') { b.rect(18, 28 + oy, 2, 4, skin); b.rect(45, 28 + oy, 2, 4, skin); b.set(45, 30 + oy, skinD); b.set(19, 30 + oy, skinD); }
    } else {
      b.ell(HCX, HCY + oy, HRX, HRY, L.hair);
      b.rect(18, 28 + oy, 2, 4, skin); b.rect(45, 28 + oy, 2, 4, skin);
    }
    hairFront(b, L, view, oy);

    // ---- cara ----
    if (view === 'front') {
      eye(b, 26, 29 + oy, expr, 0, L); eye(b, 38, 29 + oy, expr, 0, L);
      if (L.glasses) { b.rect(31, 28 + oy, 3, 1, '#1b1b22'); b.set(20, 28 + oy, '#1b1b22'); b.set(44, 28 + oy, '#1b1b22'); }
      if (L.sunglasses) b.rect(31, 28 + oy, 3, 1, '#15151a');
      if (L.frown || expr === 'angry') { b.rect(31, 36 + oy, 3, 1, INK); b.set(30, 37 + oy, INK); b.set(34, 37 + oy, INK); }
      if (expr === 'surprised') { b.rect(31, 36 + oy, 2, 2, INK); }
      if (expr === 'happy') { b.rect(30, 35 + oy, 5, 1, INK); b.rect(31, 36 + oy, 3, 1, '#b5434a'); }
      if (L.stubble) for (let x = 25; x <= 39; x += 2) b.set(x, 37 + oy + ((x >> 1) & 1), shade(skin, 0.7));
      if (id === 'samantha') { [[19, 34], [45, 34]].forEach(([x, y]) => { b.rect(x, y + oy, 2, 3, '#f2c230'); b.set(x, y + 1 + oy, skin); }); }
      if (id === 'jose') { b.line(19, 32 + oy, 22, 41 + oy, '#f4f4f8'); b.line(45, 32 + oy, 41, 41 + oy, '#f4f4f8'); }
    } else if (view === 'side') {
      eye(b, 39, 29 + oy, expr, 1, L);
      if (L.glasses) b.rect(29, 28 + oy, 5, 1, '#1b1b22');
      b.rect(30, 29 + oy, 2, 3, skinD); // oreja
      if (L.stubble) for (let x = 34; x <= 42; x += 2) b.set(x, 37 + oy, shade(skin, 0.7));
    }

    b.outline(INK).outline(WHITE, true);
    return b;
  }

  // Detalles de ropa por personaje
  function outfit(b, id, L, view, ty, frame) {
    const f = view === 'front', s = view === 'side', k = view === 'back';
    switch (id) {
      case 'ximena': { // bata blanca abierta, blusa morada, estetoscopio
        const g = '#cfcfdc';
        if (f) { b.rect(30, ty, 4, 10, '#8f5fd6'); b.rect(30, ty + 10, 4, 2, '#3a4150'); b.set(29, ty + 1, g); b.set(34, ty + 1, g); b.rect(27, ty + 8, 2, 2, g); b.rect(35, ty + 8, 2, 2, g); b.rect(25, ty + 12, 5, 3, L.top); b.rect(34, ty + 12, 5, 3, L.top); b.rect(25, ty + 14, 5, 1, g); b.rect(34, ty + 14, 5, 1, g); }
        if (k) { b.rect(25, ty + 12, 14, 3, L.top); b.rect(25, ty + 14, 14, 1, g); b.rect(32, ty + 6, 1, 9, g); }
        if (s) { b.rect(27, ty + 12, 10, 3, L.top); b.rect(27, ty + 14, 10, 1, g); b.rect(35, ty, 2, 10, '#8f5fd6'); }
        break;
      }
      case 'natalia': { // polo azul, audífonos rojos al cuello
        const r = '#e5343a';
        if (f) { b.rect(26, ty, 12, 2, '#2a2a30'); b.rect(24, ty - 1, 3, 4, r); b.rect(37, ty - 1, 3, 4, r); b.set(25, ty, '#2a2a30'); b.set(38, ty, '#2a2a30'); }
        if (k) { b.rect(26, ty, 12, 2, r); }
        if (s) { b.rect(28, ty, 8, 2, '#2a2a30'); b.rect(31, ty - 1, 3, 4, r); }
        break;
      }
      case 'itzel': { // suéter rosa tejido, falda negra
        const d = shade(L.top, 0.86);
        const x0 = s ? 27 : 25, w = s ? 10 : 14;
        for (let y = 2; y < 8; y += 2) for (let x = x0 + 1 + (y & 2 ? 1 : 0); x < x0 + w - 1; x += 3) b.set(x, ty + y, d);
        b.rect(x0 - 1, ty + 9, w + 2, 3, '#1d1d24'); b.rect(x0 - 1, ty + 11, w + 2, 1, '#0f0f14');
        if (f) b.rect(29, ty, 6, 1, '#1d1d24');
        break;
      }
      case 'alan': { // polera negra con onda neón, audífonos, pantalón cargo
        const n = '#c8f02a';
        if (f) { [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => { const h = [1, 2, 1, 3, 4, 2, 3, 1][i]; b.rect(28 + i, ty + 6 - (h >> 1), 1, h, n); }); b.rect(26, ty, 12, 2, '#2a2a30'); b.rect(24, ty - 1, 3, 4, n); b.rect(37, ty - 1, 3, 4, n); b.set(25, ty + 1, '#1c1c21'); b.set(38, ty + 1, '#1c1c21'); b.rect(25, ty + 14, 2, 3, shade(L.bottom, 0.8)); b.rect(37, ty + 14, 2, 3, shade(L.bottom, 0.8)); }
        if (k) b.rect(26, ty, 12, 2, n);
        if (s) { b.rect(28, ty, 8, 2, '#2a2a30'); b.rect(31, ty - 1, 3, 4, n); }
        break;
      }
      case 'fatima': { // delantal blanco + mandil a cuadros
        if (!k) {
          const x0 = s ? 32 : 27, w = s ? 5 : 10;
          b.rect(x0 + (s ? 0 : 1), ty + 1, w - (s ? 0 : 2), 6, '#fbfbfd'); b.rect(x0 + (s ? 1 : 3), ty + 3, s ? 3 : 4, 2, '#d5d5e0');
          for (let y = 7; y < 15; y++) for (let x = 0; x < w + (s ? 0 : 2); x++) b.set(x0 - (s ? 0 : 1) + x, ty + y, ((x >> 1) + (y >> 1)) & 1 ? '#d8404a' : '#fbe9e9');
        } else { b.rect(31, ty + 1, 2, 2, '#fbfbfd'); b.rect(25, ty + 7, 14, 1, '#fbfbfd'); }
        break;
      }
      case 'majo': { // chaleco azul marino, camisa blanca, corbata
        if (f) { b.rect(30, ty, 4, 4, '#eeeef4'); b.set(30, ty + 3, L.top); b.set(33, ty + 3, L.top); b.rect(31, ty + 1, 2, 5, '#3c4f8f'); b.set(31, ty + 6, '#3c4f8f'); b.set(31, ty + 8, '#c9c9d6'); b.set(31, ty + 10, '#c9c9d6'); }
        if (s) b.rect(35, ty, 2, 3, '#eeeef4');
        break;
      }
      case 'samantha': { // hoodie corto magenta, cintura visible, cadena
        const x0 = s ? 27 : 25, w = s ? 10 : 14;
        b.rect(x0, ty + 8, w, 2, L.skin); b.rect(x0, ty + 10, w, 2, L.bottom); b.rect(x0, ty + 7, w, 1, shade(L.top, 0.75));
        if (f) { b.rect(30, ty + 1, 1, 5, '#f4f4f8'); b.rect(33, ty + 1, 1, 5, '#f4f4f8'); b.rect(29, ty, 6, 1, '#f2c230'); b.set(36, ty + 12, '#f2c230'); b.set(37, ty + 13, '#f2c230'); }
        break;
      }
      case 'saulo': { // hoodie terracota manchado de pintura
        const x0 = s ? 27 : 25;
        if (f) { b.rect(29, ty, 6, 2, shade(L.top, 0.8)); b.rect(28, ty + 7, 8, 3, shade(L.top, 0.86)); b.set(30, ty + 2, '#f4e9d8'); b.set(33, ty + 2, '#f4e9d8'); }
        [[2, 4, '#f2c230'], [9, 6, '#4aa3df'], [5, 9, '#f4f4f8'], [11, 3, '#e8553f'], [7, 5, '#7dc96b']].forEach(([x, y, c]) => { if (x < (s ? 10 : 14)) b.set(x0 + x, ty + y, c); });
        b.set(x0 + 2, ty + 14, '#f2c230'); b.set(x0 + 9, ty + 16, '#f4f4f8');
        break;
      }
      case 'jose': { // sobrecamisa verde a rayas, polo blanco
        const x0 = s ? 27 : 25, w = s ? 10 : 14;
        for (let x = 0; x < w; x += 2) b.rect(x0 + x, ty, 1, 12, shade(L.top, 0.78));
        if (f) b.rect(30, ty, 4, 12, '#f4f4f8');
        if (s) b.rect(35, ty, 2, 12, '#f4f4f8');
        break;
      }
    }
  }

  // ---------- Pollito, el gato calicó ----------
  // pose: 'walk0' | 'walk1' | 'sit' | 'run0' | 'run1'
  function drawCat(pose) {
    const b = new Buf(64, 64);
    const W = '#f7f2e8', O = '#e58a2f', K = '#2b2530', P = '#f2a0a8', WD = '#d9d2c4';
    if (pose === 'sit') {
      b.ell(32, 51, 8, 7, W); b.ell(27, 52, 3, 4, O); b.ell(38, 49, 3, 3, K);
      b.rect(27, 56, 4, 2, W); b.rect(33, 56, 4, 2, W); b.rect(27, 58, 10, 1, WD);
      for (let i = 0; i < 8; i++) b.rect(40 + (i > 4 ? 1 : 0), 56 - i, 3, 1, i < 3 ? K : O); // cola
      b.ell(32, 40, 8, 6, W);
      b.rect(24, 33, 5, 3, O); b.rect(25, 31, 3, 2, O); b.rect(35, 33, 5, 3, K); b.rect(36, 31, 3, 2, K);
      b.ell(27, 37, 3, 2, O); b.ell(37, 37, 3, 2, K);
      b.rect(28, 40, 2, 3, '#3b7d3a'); b.rect(34, 40, 2, 3, '#3b7d3a'); b.set(28, 41, K); b.set(35, 41, K);
      b.rect(31, 43, 2, 1, P); b.set(30, 44, K); b.set(33, 44, K);
    } else {
      const run = pose[0] === 'r', f = pose.endsWith('1');
      const by = run ? 49 : 48;
      // cola
      if (run) b.line(19, by - 1, 10, by - 3, O), b.line(19, by, 10, by - 2, O), b.rect(9, by - 4, 3, 3, K);
      else { b.line(19, by - 1, 15, by - 9, O); b.line(20, by - 1, 16, by - 9, O); b.rect(14, by - 12, 3, 4, K); }
      b.ell(30, by, 11, 5, W);
      b.ell(26, by - 2, 5, 3, O); b.ell(21, by + 1, 3, 3, K); b.ell(34, by + 2, 3, 2, O);
      // patas
      const legs = run ? (f ? [[20, -3], [24, 2], [35, -2], [39, 3]] : [[23, 1], [26, -1], [34, 2], [37, -1]]) : (f ? [[22, 0], [26, 1], [34, 1], [38, 0]] : [[23, 1], [27, 0], [35, 0], [37, 1]]);
      legs.forEach(([x, d], i) => { const h = run ? 4 : 5; b.rect(x + (run ? d : 0), by + 4, 3, h - (run ? 0 : d), i === 1 ? O : W); });
      // cabeza
      const hx = run ? 43 : 42, hy = by - 6;
      b.ell(hx, hy, 6, 5, W);
      b.rect(hx - 5, hy - 7, 3, 3, O); b.set(hx - 4, hy - 8, O); b.rect(hx + 2, hy - 7, 3, 3, K); b.set(hx + 3, hy - 8, K);
      b.ell(hx - 3, hy - 3, 3, 2, O); b.ell(hx + 3, hy - 3, 2, 2, K);
      b.rect(hx + 1, hy - 1, 2, 3, '#3b7d3a'); b.set(hx + 2, hy, K);
      b.set(hx + 5, hy + 1, P); b.set(hx + 4, hy + 2, K);
    }
    b.outline(INK).outline(WHITE, true);
    return b;
  }

  // ---------- Objetos (32x32) ----------
  const ITEM_ART = {
    pastel(b) {
      b.rect(6, 25, 20, 2, '#cfd3dc'); b.rect(7, 16, 18, 9, '#f48fb1'); b.rect(7, 22, 18, 1, '#e0668f');
      b.rect(7, 13, 18, 4, '#fff6f9'); for (let x = 8; x < 25; x += 4) b.rect(x, 17, 2, 2, '#fff6f9');
      [10, 16, 22].forEach((x, i) => { b.rect(x, 8, 2, 5, ['#ffd84a', '#7fd3ff', '#b6f08a'][i]); b.rect(x, 6, 2, 2, '#ff9a2e'); });
    },
    bocaditos(b) {
      b.rect(4, 14, 24, 11, '#c9463d'); b.rect(4, 12, 24, 3, '#e2675c'); b.rect(4, 24, 24, 1, '#96302a');
      b.ell(16, 19, 4, 3, '#ffe9b8'); b.set(15, 18, '#d8404a'); b.set(17, 20, '#d8404a'); b.set(14, 20, '#5e9c4a');
    },
    bebidas(b) {
      [8, 13, 18, 23].forEach((x, i) => { b.rect(x - 1, 9, 3, 8, i % 2 ? '#3f8f4f' : '#8a5a2b'); b.rect(x, 6, 1, 3, i % 2 ? '#3f8f4f' : '#8a5a2b'); b.rect(x - 1, 5, 3, 1, '#f2c230'); });
      b.rect(5, 16, 22, 10, '#3f6fb5'); b.rect(5, 16, 22, 2, '#5b8dd6'); b.rect(5, 25, 22, 1, '#2b4f85'); b.rect(12, 20, 8, 3, '#e9eefb');
    },
    globos(b) {
      b.line(10, 16, 15, 28, '#8a8a99'); b.line(16, 14, 16, 28, '#8a8a99'); b.line(23, 16, 17, 28, '#8a8a99');
      b.ell(9, 11, 5, 6, '#e23b4e'); b.ell(23, 11, 5, 6, '#3fa0f0'); b.ell(16, 8, 5, 6, '#ffd23f');
      b.set(7, 8, '#ffb3bd'); b.set(21, 8, '#bfe2ff'); b.set(14, 5, '#fff3c0');
    },
    guirnalda(b) {
      b.line(3, 9, 16, 13, '#6b5a4a'); b.line(16, 13, 29, 9, '#6b5a4a');
      [[5, 10, '#e23b4e'], [11, 12, '#ffd23f'], [17, 13, '#3fa0f0'], [23, 11, '#58c46a']].forEach(([x, y, c]) => { for (let i = 0; i < 6; i++) b.rect(x + (i >> 1), y + i, 5 - i + (i & 1 ? 0 : 0) - (i >> 1), 1, c); });
    },
    luces(b) {
      for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; b.set(16 + Math.cos(t) * 9, 16 + Math.sin(t) * 7, '#2f5a3c'); b.set(16 + Math.cos(t) * 5, 17 + Math.sin(t) * 4, '#2f5a3c'); }
      ['#ff4f6a', '#ffd23f', '#4fd0ff', '#7dff8a', '#ff8ad6', '#ffa23f'].forEach((c, i) => { const t = (i / 6) * Math.PI * 2 + 0.3; const x = Math.round(16 + Math.cos(t) * 9), y = Math.round(16 + Math.sin(t) * 7); b.rect(x - 1, y - 1, 3, 3, c); });
    },
    herramientas(b) {
      b.rect(11, 9, 10, 2, '#7d8594'); b.rect(11, 9, 2, 5, '#7d8594'); b.rect(19, 9, 2, 5, '#7d8594');
      b.rect(4, 14, 24, 12, '#d6402f'); b.rect(4, 14, 24, 3, '#ee6a55'); b.rect(4, 25, 24, 1, '#992a1e'); b.rect(14, 17, 4, 4, '#f2c230'); b.rect(4, 19, 24, 1, '#992a1e');
    },
    premios(b) {
      b.rect(7, 13, 18, 12, '#3f8fd0'); b.ell(16, 13, 9, 3, '#c9ced8'); b.ell(16, 25, 9, 3, '#3270a6'); b.ell(16, 13, 6, 1, '#eef1f6');
      b.ell(15, 20, 4, 2, '#fff1d6'); b.rect(19, 18, 2, 5, '#fff1d6'); b.set(13, 19, '#222');
    },
    regalo(b) {
      b.rect(5, 13, 22, 14, '#e23b4e'); b.rect(4, 11, 24, 4, '#f25a6b'); b.rect(5, 26, 22, 1, '#a52636');
      b.rect(14, 11, 4, 16, '#ffd23f'); b.rect(5, 18, 22, 2, '#ffd23f'); b.ell(12, 8, 3, 3, '#ffd23f'); b.ell(20, 8, 3, 3, '#ffd23f'); b.rect(15, 8, 2, 3, '#e0a81f');
    },
    parlante(b) {
      b.rect(8, 4, 16, 24, '#2a2c36'); b.rect(8, 4, 16, 2, '#444757'); b.rect(8, 27, 16, 1, '#15161c');
      b.ell(16, 11, 3, 3, '#7b7f92'); b.ell(16, 11, 1, 1, '#15161c'); b.ell(16, 20, 5, 5, '#7b7f92'); b.ell(16, 20, 3, 3, '#3a3d4b'); b.ell(16, 20, 1, 1, '#c8f02a');
    },
    cajas(b) {
      b.rect(4, 12, 15, 14, '#b98a55'); b.rect(4, 12, 15, 3, '#d3a770'); b.rect(10, 12, 3, 14, '#e8d9b8'); b.rect(4, 25, 15, 1, '#7d5a33');
      b.rect(15, 17, 13, 10, '#c79a63'); b.rect(15, 17, 13, 2, '#dcb37c'); b.rect(15, 26, 13, 1, '#7d5a33'); b.rect(18, 21, 7, 2, '#e23b4e');
    },
    cartel(b) {
      b.rect(4, 8, 24, 16, '#fdfdf5'); b.rect(4, 23, 24, 1, '#c9c9bd'); b.rect(15, 24, 2, 5, '#8a6a45');
      ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#b48cf0'].forEach((c, i) => b.rect(7 + i * 4, 11, 3, 4, c));
      ['#3fa0f0', '#e23b4e', '#58c46a', '#ffd23f'].forEach((c, i) => b.rect(9 + i * 4, 17, 3, 4, c));
    },
    bolsas(b) {
      b.rect(5, 13, 11, 14, '#f4efe2'); b.rect(5, 26, 11, 1, '#c9c2ae'); b.rect(7, 10, 1, 4, '#8a6a45'); b.rect(13, 10, 1, 4, '#8a6a45'); b.rect(7, 9, 7, 1, '#8a6a45'); b.rect(8, 17, 5, 5, '#e23b4e');
      b.rect(16, 16, 11, 11, '#ffd9e6'); b.rect(16, 26, 11, 1, '#d9a3b7'); b.rect(18, 13, 1, 4, '#8a6a45'); b.rect(24, 13, 1, 4, '#8a6a45'); b.rect(18, 12, 7, 1, '#8a6a45'); b.ell(20, 9, 2, 3, '#ffd23f');
    },
    manta(b) {
      b.ell(16, 20, 12, 7, '#7c8fb8'); b.ell(16, 17, 9, 5, '#93a6cf'); b.rect(6, 25, 20, 2, '#5f7199');
      for (let x = 8; x < 25; x += 4) b.rect(x, 15 + ((x >> 2) & 1) * 3, 2, 2, '#c5d0ea');
    },
    ovillo(b) {
      b.ell(16, 19, 8, 8, '#f08cc0'); b.line(9, 17, 22, 22, '#d9609e'); b.line(10, 22, 21, 14, '#d9609e'); b.line(13, 12, 19, 26, '#d9609e'); b.set(12, 15, '#ffd0e6'); b.set(13, 14, '#ffd0e6');
      b.line(23, 23, 28, 26, '#f08cc0'); b.line(28, 26, 26, 28, '#f08cc0');
    },
    flores(b) {
      b.rect(14, 16, 4, 12, '#3f8f4f'); b.rect(11, 22, 10, 7, '#f4efe2'); b.rect(11, 22, 10, 2, '#e23b4e');
      [[10, 10, '#e23b4e'], [16, 7, '#ffd23f'], [22, 10, '#f08cc0'], [13, 14, '#b48cf0'], [20, 15, '#ff9a3f']].forEach(([x, y, c]) => { b.ell(x, y, 3, 3, c); b.set(x, y, '#fff6c9'); });
    },
    control(b) {
      b.rect(11, 6, 10, 21, '#2a2c36'); b.rect(11, 6, 10, 2, '#444757'); b.rect(14, 9, 4, 3, '#e23b4e');
      for (let y = 14; y < 25; y += 3) for (let x = 13; x < 20; x += 3) b.rect(x, y, 2, 2, '#9aa0b5');
    },
  };
  function drawItem(id) {
    const b = new Buf(32, 32);
    (ITEM_ART[id] || ITEM_ART.regalo)(b);
    b.outline(INK).outline(WHITE, true);
    return b;
  }

  // ---------- Conversión a canvas (sólo navegador) ----------
  function toCanvas(buf) {
    const c = document.createElement('canvas');
    c.width = buf.w; c.height = buf.h;
    c.getContext('2d').putImageData(new ImageData(buf.d, buf.w, buf.h), 0, 0);
    return c;
  }

  const cache = {};
  const Sprites = {
    LOOKS, Buf, drawCharacter, drawCat, drawItem,
    // devuelve canvas listo para drawImage; dir: 'down' | 'up' | 'left' | 'right'
    char(id, dir, frame, expr) {
      const key = `c:${id}:${dir}:${frame}:${expr || ''}`;
      if (!cache[key]) {
        const view = dir === 'down' ? 'front' : dir === 'up' ? 'back' : 'side';
        let buf = drawCharacter(id, view, frame, expr);
        if (dir === 'left') buf = buf.flipX();
        cache[key] = toCanvas(buf);
      }
      return cache[key];
    },
    cat(pose, left) {
      const key = `cat:${pose}:${left ? 1 : 0}`;
      if (!cache[key]) { let b = drawCat(pose); if (left) b = b.flipX(); cache[key] = toCanvas(b); }
      return cache[key];
    },
    item(id) {
      const key = 'i:' + id;
      if (!cache[key]) cache[key] = toCanvas(drawItem(id));
      return cache[key];
    },
    // retrato (recorte de la cabeza): canvas para dibujar y dataURL para el chat
    portraitC(id, expr) {
      const key = `pc:${id}:${expr || ''}`;
      if (!cache[key]) {
        const src = id === 'pollito' ? this.cat('sit') : this.char(id, 'down', 0, expr);
        const c = document.createElement('canvas');
        c.width = 80; c.height = 80;
        const x = c.getContext('2d');
        x.imageSmoothingEnabled = false;
        if (id === 'pollito') x.drawImage(src, 16, 26, 32, 32, 0, 0, 80, 80);
        else x.drawImage(src, 14, 9, 36, 36, 0, 0, 80, 80);
        cache[key] = c;
      }
      return cache[key];
    },
    // cabeza suelta como sprite (Ximena dormida)
    headC(id, expr) {
      const key = `h:${id}:${expr || ''}`;
      if (!cache[key]) { const c = document.createElement('canvas'); c.width = 48; c.height = 44; c.getContext('2d').drawImage(this.char(id, 'down', 0, expr), 8, 0, 48, 44, 0, 0, 48, 44); cache[key] = c; }
      return cache[key];
    },
    portrait(id, expr) {
      const key = `p:${id}:${expr || ''}`;
      if (!cache[key]) cache[key] = this.portraitC(id, expr).toDataURL();
      return cache[key];
    },
    itemURL(id) {
      const key = 'iu:' + id;
      if (!cache[key]) cache[key] = this.item(id).toDataURL();
      return cache[key];
    },
  };
  G.Sprites = Sprites;
  if (typeof module !== 'undefined') module.exports = Sprites;
})(typeof window !== 'undefined' ? window : globalThis);
