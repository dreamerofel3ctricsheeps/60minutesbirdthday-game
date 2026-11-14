/* ============================================================
   RENDER 3D (WebGL puro, sin dependencias)
   Entornos 3D minimalistas hechos de cajas con color por vértice
   + sprites pixel art como billboards (GDD §10).
   Unidades del mundo = píxeles lógicos del juego: X derecha,
   Z hacia la cámara (sur), Y arriba.
   ============================================================ */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const R = (G.R = {});
  let gl, pM, pS, cam = null, VP = null, quadBuf, dynBuf, texCache = new WeakMap();
  let sprites = [], flats = [];
  const colCache = {};
  function rgb(c) {
    if (typeof c !== 'string') return c;
    if (colCache[c]) return colCache[c];
    const n = parseInt(c.slice(1), 16);
    return (colCache[c] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]);
  }
  R.rgb = rgb;

  // ---------- Matrices ----------
  function perspective(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]; }
  function lookAt(e, c, u) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let l = Math.hypot(...z); z = z.map((v) => v / l);
    let x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(...x); x = x.map((v) => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  }
  function mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }

  // ---------- Constructor de mallas ----------
  class MB {
    constructor() { this.a = []; }
    reset() { this.a.length = 0; }
    tri(p, n, c) { const a = this.a; for (let i = 0; i < 3; i++) a.push(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], c[0], c[1], c[2]); }
    quad(p0, p1, p2, p3, n, c) { c = rgb(c); this.tri([p0, p1, p2], n, c); this.tri([p0, p2, p3], n, c); }
    // caja alineada a los ejes; (x,z) esquina mínima, y base.  o: {top,s,n,e,w} colores por cara, emit: sin iluminación
    box(x, y, z, w, h, d, c, o) {
      o = o || {};
      const X = x + w, Y = y + h, Z = z + d, e = o.emit;
      const N = (v) => (e ? [0, 0, 0] : v);
      this.quad([x, Y, Z], [X, Y, Z], [X, Y, z], [x, Y, z], N([0, 1, 0]), o.top || c);
      this.quad([x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z], N([0, 0, 1]), o.s || c);
      this.quad([X, y, Z], [X, y, z], [X, Y, z], [X, Y, Z], N([1, 0, 0]), o.e || c);
      this.quad([x, y, z], [x, y, Z], [x, Y, Z], [x, Y, z], N([-1, 0, 0]), o.w || c);
      if (!o.noBack) this.quad([X, y, z], [x, y, z], [x, Y, z], [X, Y, z], N([0, 0, -1]), o.n || c);
      return this;
    }
    // plano horizontal
    flat(x, z, w, d, y, c, emit) { this.quad([x, y, z + d], [x + w, y, z + d], [x + w, y, z], [x, y, z], emit ? [0, 0, 0] : [0, 1, 0], c); return this; }
    // plano vertical mirando al sur (cuadros, pantallas)
    wallQuad(x, y, z, w, h, c, emit) { this.quad([x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z], emit ? [0, 0, 0] : [0, 0, 1], c); return this; }
    // prisma de 8 lados (macetas, lámparas, taburetes)
    cyl(cx, y, cz, r, h, c, o) {
      o = o || {}; c = rgb(c); const top = rgb(o.top || c), r2 = o.r2 == null ? r : o.r2, n = 8, e = o.emit;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832, am = (a0 + a1) / 2;
        const p0 = [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r];
        const q0 = [cx + Math.cos(a0) * r2, y + h, cz + Math.sin(a0) * r2], q1 = [cx + Math.cos(a1) * r2, y + h, cz + Math.sin(a1) * r2];
        const nn = e ? [0, 0, 0] : [Math.cos(am), 0.2, Math.sin(am)];
        this.tri([p1, p0, q0], nn, c); this.tri([p1, q0, q1], nn, c);
        this.tri([[cx, y + h, cz], q1, q0], e ? [0, 0, 0] : [0, 1, 0], top);
      }
      return this;
    }
    upload() {
      const m = { vbo: gl.createBuffer(), n: this.a.length / 9 };
      gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.a), gl.STATIC_DRAW);
      return m;
    }
  }
  R.MB = MB;

  // ---------- Shaders ----------
  const LIGHTS = `uniform vec3 uAmb, uSun, uSunDir; uniform vec4 uL[8]; uniform vec3 uLC[8];
    vec3 points(vec3 p){ vec3 l=vec3(0.); for(int i=0;i<8;i++){ float a=clamp(1.-distance(p,uL[i].xyz)/uL[i].w,0.,1.); l+=uLC[i]*a*a; } return l; }`;
  const VS_M = `attribute vec3 aPos,aNor,aCol; uniform mat4 uVP; varying vec3 vP,vN,vC; void main(){ vP=aPos; vN=aNor; vC=aCol; gl_Position=uVP*vec4(aPos,1.); }`;
  const FS_M = `precision mediump float; ${LIGHTS} varying vec3 vP,vN,vC;
    void main(){ vec3 l; if(dot(vN,vN)<0.25) l=vec3(1.); else l=uAmb+uSun*max(dot(normalize(vN),uSunDir),0.)+points(vP)*(0.6+0.4*max(vN.y,0.)); gl_FragColor=vec4(vC*l,1.); }`;
  const VS_S = `attribute vec3 aPos; attribute vec2 aUV; uniform mat4 uVP; varying vec2 vUV; varying vec3 vP; void main(){ vP=aPos; vUV=aUV; gl_Position=uVP*vec4(aPos,1.); }`;
  const FS_S = `precision mediump float; ${LIGHTS} uniform sampler2D uTex; uniform vec4 uTint; uniform float uLit; uniform vec3 uFlash; varying vec2 vUV; varying vec3 vP;
    void main(){ vec4 c=texture2D(uTex,vUV); if(uLit>=0. && c.a<0.5) discard;
      vec3 l=mix(vec3(1.), min(uAmb*1.3+uSun*0.45+points(vP), vec3(1.25)), max(uLit,0.));
      gl_FragColor=vec4(c.rgb*l*uTint.rgb+uFlash*c.a, c.a*uTint.a); }`;
  function prog(vs, fs) {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([t, s]) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); });
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  }

  R.init = function (canvas) {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    R.gl = gl; R.w = canvas.width; R.h = canvas.height;
    pM = prog(VS_M, FS_M); pS = prog(VS_S, FS_S);
    quadBuf = gl.createBuffer(); dynBuf = gl.createBuffer();
    R.dyn = new MB();
    // textura de sombra (disco difuso)
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 2, 16, 16, 15); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.7, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); R.shadowTex = c;
    const w = document.createElement('canvas'); w.width = w.height = 32; const y = w.getContext('2d');
    const g2 = y.createRadialGradient(16, 16, 1, 16, 16, 15); g2.addColorStop(0, 'rgba(255,255,255,1)'); g2.addColorStop(0.6, 'rgba(255,255,255,.5)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    y.fillStyle = g2; y.fillRect(0, 0, 32, 32); R.glowTex = w;
    return true;
  };

  function tex(canvas) {
    let t = texCache.get(canvas);
    if (!t) {
      t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      const soft = canvas === R.shadowTex || canvas === R.glowTex;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, soft ? gl.LINEAR : gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, soft ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texCache.set(canvas, t);
    }
    return t;
  }

  /* cam: { x, y, z (objetivo), dist, pitch (rad), fov (grados) }
     light: { amb:[r,g,b], sun:[r,g,b], sky:'#hex', points:[{x,y,z,r,c:[r,g,b]}] } */
  R.begin = function (c, light) {
    cam = c; R.light = light;
    // lente larga (26°) para un look de maqueta; las distancias de cámara están pensadas para 34°
    const D = c.dist * 1.324;
    const eye = [c.x, (c.y || 0) + Math.sin(c.pitch) * D, c.z + Math.cos(c.pitch) * D];
    VP = mul(perspective((26 * Math.PI) / 180, R.w / R.h, 30, 6000), lookAt(eye, [c.x, c.y || 0, c.z], [0, 1, 0]));
    R.stretch = Math.min(1.4, 1 / Math.cos(c.pitch)); // los billboards se estiran para compensar la inclinación
    const s = rgb(light.sky || '#15121f');
    gl.viewport(0, 0, R.w, R.h); gl.clearColor(s[0], s[1], s[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    sprites.length = 0; flats.length = 0; R.dyn.reset();
  };
  function setLights(P) {
    const L = R.light, u = P.u, pts = L.points || [];
    gl.uniform3fv(u.uAmb, L.amb); gl.uniform3fv(u.uSun, L.sun); gl.uniform3fv(u.uSunDir, [0.33, 0.78, 0.53]);
    const a = new Float32Array(32), b = new Float32Array(24);
    for (let i = 0; i < 8; i++) { const p = pts[i]; a[i * 4 + 3] = 1; if (p) { a[i * 4] = p.x; a[i * 4 + 1] = p.y; a[i * 4 + 2] = p.z; a[i * 4 + 3] = p.r; b.set(p.c, i * 3); } }
    gl.uniform4fv(u.uL, a); gl.uniform3fv(u.uLC, b);
  }
  function drawBuf(vbo, n) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const P = pM.p, loc = (nm) => gl.getAttribLocation(P, nm);
    [['aPos', 0], ['aNor', 12], ['aCol', 24]].forEach(([nm, off]) => { const l = loc(nm); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 36, off); });
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
  R.mesh = function (m) { gl.useProgram(pM.p); gl.uniformMatrix4fv(pM.u.uVP, false, VP); setLights(pM); drawBuf(m.vbo, m.n); };

  /* Billboard vertical que mira a la cámara.  (x,y,z) = centro de la base.
     o: { w,h, flip, roll, sx, sy, lit(0..1), alpha, flash:[r,g,b], feet (px bajo los pies), nostretch } */
  R.sprite = function (canvas, x, y, z, o) { sprites.push({ canvas, x, y, z, o: o || {} }); };
  // disco plano en el suelo (sombras, marcadores, brillos)
  R.flat = function (canvas, x, y, z, r, o) { flats.push({ canvas, x, y, z, r, o: o || {} }); };
  R.shadow = function (x, z, r, a) { flats.push({ canvas: R.shadowTex, x, y: 0.6, z, r, o: { alpha: a == null ? 1 : a, tint: [0, 0, 0] } }); };

  R.end = function () {
    // cajas dinámicas
    if (R.dyn.a.length) { gl.useProgram(pM.p); gl.uniformMatrix4fv(pM.u.uVP, false, VP); setLights(pM); gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(R.dyn.a), gl.DYNAMIC_DRAW); drawBuf(dynBuf, R.dyn.a.length / 9); }
    gl.useProgram(pS.p); gl.uniformMatrix4fv(pS.u.uVP, false, VP); setLights(pS); gl.uniform1i(pS.u.uTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const aP = gl.getAttribLocation(pS.p, 'aPos'), aU = gl.getAttribLocation(pS.p, 'aUV');
    gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aU);
    gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(aU, 2, gl.FLOAT, false, 20, 12);
    gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const v = new Float32Array(20);
    const put = (i, p, u, w) => { v[i * 5] = p[0]; v[i * 5 + 1] = p[1]; v[i * 5 + 2] = p[2]; v[i * 5 + 3] = u; v[i * 5 + 4] = w; };
    // planos en el suelo
    gl.depthMask(false);
    for (const f of flats) {
      const o = f.o, t = o.tint || [1, 1, 1];
      gl.bindTexture(gl.TEXTURE_2D, tex(f.canvas)); gl.uniform4f(pS.u.uTint, t[0], t[1], t[2], o.alpha == null ? 1 : o.alpha); gl.uniform1f(pS.u.uLit, -1); gl.uniform3f(pS.u.uFlash, 0, 0, 0);
      const rz = f.r * (o.ry || 1);
      put(0, [f.x - f.r, f.y, f.z + rz], 0, 1); put(1, [f.x + f.r, f.y, f.z + rz], 1, 1); put(2, [f.x - f.r, f.y, f.z - rz], 0, 0); put(3, [f.x + f.r, f.y, f.z - rz], 1, 0);
      gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.depthMask(true);
    // billboards
    for (const s of sprites) {
      const o = s.o, c = s.canvas, k = o.nostretch ? 1 : R.stretch;
      const w = (o.w || c.width) * (o.sx || 1), h = (o.h || c.height) * (o.sy || 1) * k, fy = (o.feet || 0) * (o.sy || 1) * k;
      const roll = o.roll || 0, cs = Math.cos(roll), sn = Math.sin(roll);
      const P = (dx, dy) => [s.x + dx * cs - dy * sn, s.y - fy + dx * sn + dy * cs, s.z];
      const u0 = o.flip ? 1 : 0, u1 = o.flip ? 0 : 1;
      gl.bindTexture(gl.TEXTURE_2D, tex(c));
      gl.uniform4f(pS.u.uTint, 1, 1, 1, o.alpha == null ? 1 : o.alpha); gl.uniform1f(pS.u.uLit, o.lit == null ? 1 : o.lit);
      const fl = o.flash || [0, 0, 0]; gl.uniform3f(pS.u.uFlash, fl[0], fl[1], fl[2]);
      put(0, P(-w / 2, 0), u0, 1); put(1, P(w / 2, 0), u1, 1); put(2, P(-w / 2, h), u0, 0); put(3, P(w / 2, h), u1, 0);
      gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };

  // mundo → coordenadas lógicas de la capa 2D (640x360)
  R.project = function (x, y, z) {
    const m = VP, w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return { x: ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w * 0.5 + 0.5) * 640, y: (1 - ((m[1] * x + m[5] * y + m[9] * z + m[13]) / w * 0.5 + 0.5)) * 360, ok: w > 0 };
  };
})();
