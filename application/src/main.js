/* Punto de entrada (Vite). Carga los módulos heredados en el orden original;
   cada uno es un IIFE que cuelga de window.G. Migración incremental a módulos
   ES en fases posteriores sin romper la fachada. */
import './css/style.css';
import './js/defined-sheets.js';
import './js/rocket-sheets.js';
import './js/belt-sheets.js';
import './js/alebrije-sheets.js';
import './js/teodora-sheets.js';
import './js/jump-sheets.js';
import './js/sprites.js';
import './js/data.js';
import './js/music.js';
import './js/gl3d.js';
import './js/world.js';
import './js/scenes.js';
import './js/date.js';
import './js/game.js';
