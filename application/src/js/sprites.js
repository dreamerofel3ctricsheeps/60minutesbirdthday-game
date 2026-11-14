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
    // Scale2x (EPX): duplica la resolución suavizando diagonales, para igualar el detalle de los personajes
    scale2x() {
      const o = new Buf(this.w * 2, this.h * 2), w = this.w, h = this.h, d = new Uint32Array(this.d.buffer), q = new Uint32Array(o.d.buffer);
      const g = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const P = g(x, y), A = g(x, y - 1), B = g(x + 1, y), C = g(x - 1, y), D = g(x, y + 1), i = y * 2 * o.w + x * 2;
        q[i] = C === A && C !== D && A !== B ? A : P; q[i + 1] = A === B && A !== C && B !== D ? B : P;
        q[i + o.w] = D === C && D !== B && C !== A ? C : P; q[i + o.w + 1] = B === D && B !== A && D !== C ? D : P;
      }
      return o;
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
    cactus(b) {
      b.ell(16, 17, 9, 9, '#3f8f4f'); b.ell(13, 14, 4, 4, '#58b56a'); b.ell(16, 23, 7, 2, '#2f7a45');
      for (let a = 0; a < 12; a++) { const t = (a / 12) * 6.2832, x = 16 + Math.cos(t) * 11, y = 17 + Math.sin(t) * 11; b.line(16 + Math.cos(t) * 8, 17 + Math.sin(t) * 8, x, y, '#f4efe2'); }
      [[12, 12], [19, 14], [15, 19], [21, 20], [11, 20]].forEach(([x, y]) => b.set(x, y, '#f4efe2')); b.ell(16, 7, 2, 2, '#f08cc0');
    },
    dron(b) {
      b.rect(10, 14, 12, 6, '#2a2c36'); b.rect(12, 16, 8, 2, '#e23b4e'); b.rect(4, 12, 24, 2, '#444757');
      [[5, 9], [27, 9]].forEach(([x, y]) => { b.rect(x - 4, y, 9, 2, '#c9ced8'); b.rect(x, y, 1, 4, '#444757'); });
      b.rect(13, 20, 6, 3, '#ffd23f'); b.rect(14, 23, 4, 4, '#f4efe2'); b.set(15, 24, '#e23b4e'); b.set(16, 25, '#e23b4e');
    },
    velas(b) {
      [9, 15, 21].forEach((x, i) => { b.rect(x, 12, 3, 14, ['#ffd84a', '#7fd3ff', '#f08cc0'][i]); b.rect(x, 16, 3, 1, '#fff'); b.rect(x, 21, 3, 1, '#fff'); b.rect(x + 1, 9, 1, 3, '#2b1d24'); b.ell(x + 1, 7, 1, 2, '#ff9a2e'); });
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
  function toCanvas(buf, scale) {
    const c = document.createElement('canvas');
    c.width = buf.w; c.height = buf.h;
    c.getContext('2d').putImageData(new ImageData(buf.d, buf.w, buf.h), 0, 0);
    c._scale = scale || 1;      // unidades de mundo por píxel (lo usa el render 3D)
    return c;
  }
  function flipCanvas(src) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c._scale = src._scale;
    const x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c;
  }

  // ---------- Personajes: hojas generadas desde los borradores (js/sheets.js) ----------
  const M = root.G.SHEET_META, CHAR_SCALE = 0.33, imgs = {};
  const FRAME = { idle: 0, walkA: 1, walkB: 2, act: 3, backIdle: 4, backA: 5, backB: 6 };
  const INKC = [43, 29, 36];
  const ready = typeof Image === 'undefined' ? Promise.resolve() : Promise.all(Object.keys(root.G.SHEET_DATA).map((id) => new Promise((res) => { const im = new Image(); im.onload = () => { imgs[id] = im; res(); }; im.onerror = res; im.src = root.G.SHEET_DATA[id]; })));

  // repinta los ojos para cada expresión usando la posición detectada en el borrador
  function paintExpr(ctx, id, expr) {
    const meta = M.chars[id]; if (!meta.eyes.length || !expr || expr === 'neutral') return;
    const im = ctx.getImageData(0, 0, M.fw, M.fh), d = im.data, skin = meta.skin;
    const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= M.fw || y >= M.fh) return; const i = (y * M.fw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    meta.eyes.forEach((e, k) => {
      const r = e.r, s = k === 0 ? 1 : -1;
      const disc = (rad, c, test) => { for (let y = -Math.ceil(rad); y <= rad; y++) for (let x = -Math.ceil(rad); x <= rad; x++) if (x * x + y * y <= rad * rad && (!test || test(x, y))) put(e.x + x, e.y + y, c); };
      if (expr === 'sleep' || expr === 'happy') {
        disc(r + 0.6, skin);
        for (let x = -r * 0.75; x <= r * 0.75; x++) { const t = x / (r * 0.75), yy = expr === 'happy' ? 2 - (1 - t * t) * r * 0.45 : 1 + (1 - t * t) * r * 0.3; put(e.x + x, e.y + yy, INKC); put(e.x + x, e.y + yy + 1, INKC); }
      } else if (expr === 'surprised') { disc(r - 0.4, [255, 255, 255]); disc(r * 0.3, [10, 10, 14]); }
      else if (expr === 'angry') {
        const edge = (x) => -r * 0.25 + s * x * 0.55;
        disc(r + 0.6, skin, (x, y) => y < edge(x));
        for (let x = -r; x <= r; x++) { put(e.x + x, e.y + edge(x), INKC); put(e.x + x, e.y + edge(x) + 1, INKC); put(e.x + x, e.y + edge(x) - 1, INKC); }
      } else if (expr === 'suspicious' || expr === 'tired') {
        const lid = expr === 'tired' ? r * 0.15 : -r * 0.1;
        disc(r + 0.6, skin, (x, y) => y < lid);
        for (let x = -r; x <= r; x++) { put(e.x + x, e.y + lid, INKC); put(e.x + x, e.y + lid + 1, INKC); }
      }
    });
    ctx.putImageData(im, 0, 0);
  }

  const cache = {};
  const Sprites = {
    Buf, drawCat, drawItem, ready, CHAR_SCALE, META: M,
    // alto del personaje en unidades de mundo (para colocar cosas sobre la cabeza)
    charTop(id) { const m = M.chars[id]; return m ? (M.base - m.top) * CHAR_SCALE : 46; },
    // dir: 'down' | 'up' | 'left' | 'right'.  frame: 0 idle, 1 y 2 caminata, 3 acción
    char(id, dir, frame, expr) {
      const back = dir === 'up', fi = back ? [4, 5, 6, 4][frame] : frame, ex = back ? '' : expr || '';
      const key = `c:${id}:${fi}:${ex}:${dir === 'left' ? 1 : 0}`;
      if (!cache[key]) {
        if (dir === 'left') cache[key] = flipCanvas(this.char(id, 'right', frame, expr));
        else {
          const c = document.createElement('canvas'); c.width = M.fw; c.height = M.fh; c._scale = CHAR_SCALE;
          const x = c.getContext('2d'); if (imgs[id]) x.drawImage(imgs[id], fi * M.fw, 0, M.fw, M.fh, 0, 0, M.fw, M.fh);
          if (ex) paintExpr(x, id, ex);
          cache[key] = c;
        }
      }
      return cache[key];
    },
    cat(pose, left) {
      const key = `cat:${pose}:${left ? 1 : 0}`;
      if (!cache[key]) { let b = drawCat(pose); if (left) b = b.flipX(); cache[key] = toCanvas(b.scale2x(), 0.5); }
      return cache[key];
    },
    item(id) {
      const key = 'i:' + id;
      if (!cache[key]) cache[key] = toCanvas(drawItem(id).scale2x(), 0.5);
      return cache[key];
    },
    // retrato (recorte de la cabeza): canvas para dibujar y dataURL para el chat
    portraitC(id, expr) {
      const key = `pc:${id}:${expr || ''}`;
      if (!cache[key]) {
        const c = document.createElement('canvas'); c.width = 96; c.height = 96;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
        if (id === 'pollito') x.drawImage(this.cat('sit'), 32, 52, 64, 64, 0, 0, 96, 96);
        else { const m = M.chars[id], h = m.neck - m.top, s = Math.max(64, Math.min(96, h * 0.82)); const cy = m.eyes.length ? m.eyes[0].y : m.top + h * 0.6; x.drawImage(this.char(id, 'down', 0, expr), M.fw / 2 - s / 2, cy - s * 0.5, s, s, 0, 0, 96, 96); }
        cache[key] = c;
      }
      return cache[key];
    },
    // cabeza suelta como sprite (Ximena dormida)
    headC(id, expr) {
      const key = `h:${id}:${expr || ''}`;
      if (!cache[key]) { const m = M.chars[id], h = m.neck - m.top + 8; const c = document.createElement('canvas'); c.width = M.fw; c.height = h; c._scale = CHAR_SCALE; c.getContext('2d').drawImage(this.char(id, 'down', 0, expr), 0, m.top - 4, M.fw, h, 0, 0, M.fw, h); cache[key] = c; }
      return cache[key];
    },
    portrait(id, expr) {
      const key = `p:${id}:${expr || ''}`;
      if (!cache[key]) cache[key] = this.portraitC(id, expr).toDataURL();
      return cache[key];
    },
    full(id, expr) { const key = `f:${id}:${expr || ''}`; if (!cache[key]) cache[key] = (id === 'pollito' ? this.cat('sit') : this.char(id, 'down', 0, expr)).toDataURL(); return cache[key]; },
    itemURL(id) {
      const key = 'iu:' + id;
      if (!cache[key]) cache[key] = this.item(id).toDataURL();
      return cache[key];
    },
  };
  G.Sprites = Sprites;
})(typeof window !== 'undefined' ? window : globalThis);
