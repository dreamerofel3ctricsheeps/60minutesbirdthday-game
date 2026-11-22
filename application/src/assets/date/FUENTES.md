# Fuentes de los recortes de foto — Easter egg «La Cita»

## catedral.png — Catedral Metropolitana de la Ciudad de México
- **Foto original:** «Catedral Metropolitana México.JPG» (4496 × 3000)
- **Autor:** Guillermo Calva Márquez
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Catedral_Metropolitana_M%C3%A9xico.JPG
- **Licencia:** CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)
- **Procesado:** recorte de fondo con `tools/mkcutout.py` (rembg) sobre la
  versión de 1920 px, borde blanco horneado y sombra suave, como los
  sprites definidos del juego. Recorte aplicado: x 0–0,945 (fuera los
  edificios ajenos de la derecha); se conserva el Sagrario, que es parte
  del conjunto de la Catedral.

## avion.png — Avión de pasajeros cruzando el cielo de la plaza
- **Foto original:** «Alaska Airlines 737 MAX 9 (N913AK).jpg» (4788 × 3192)
- **Autor:** Sam Almo-Milkin
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Alaska_Airlines_737_MAX_9_(N913AK).jpg
- **Licencia:** CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte y 0,22–0,72,
  borde blanco horneado y sombra suave. **Espejado horizontal** para
  que vuele hacia la derecha (en la foto el morro apunta a la
  izquierda); el rótulo de la aerolínea queda espejado, irrelevante a
  la escala lejana a la que se dibuja. Salida: 760 × 227.
- **Reuso (escena 3, «Aeropuerto»):** el mismo recorte, sin
  procesado nuevo, se dibuja grande (~420 px de ancho) FUERA del
  ventanal continuo de la terminal, rodando lento por la pista
  (taxiing: capa con parallax 0,15, deriva de 18 px/s y ciclo de
  140 s con espera fuera de escena). El interior de la terminal
  se dibuja por código sobre él, de modo que se ve «a través»
  de los ventanales.

## vocho.png — El vocho que maneja Pollito
- **Foto original:** «Blue Volkswagen Beetle side view.jpg» (2888 × 1392)
- **Autor:** Renée Kools
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Blue_Volkswagen_Beetle_side_view.jpg
- **Licencia:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte y 0,03–0,97,
  borde blanco horneado y sombra suave. El morro ya apuntaba a la
  izquierda (su dirección de viaje en la escena): sin espejo.
  Salida: 950 × 441. Pollito se dibuja por código sobre la
  ventanilla del conductor (recorte de su frame idle definido).

## tacos.png — Puesto de tacos de fondo
- **Foto original:** «Vista de puesto de tacos - taqueria mexicana.jpg» (4128 × 3096)
- **Autor:** Zijun93
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Vista_de_puesto_de_tacos_-_taqueria_mexicana.jpg
- **Licencia:** CC0 (dominio público)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** ni rembg ni GrabCut segmentan el puesto entero
  (u2net solo salienta el letrero y al taquero; el frente de acero
  del carrito no es saliente para ninguno de los dos), así que la
  máscara es la **silueta poligonal del puesto** trazada sobre la
  foto (letrero + postes + carrito con su mesa lateral), con el
  mismo acabado de `mkcutout.py`: erosión de 1 px, borde blanco
  por dilatación y sombra suave. Salida: 900 × 660.

## parroquia.png — Parroquia de la Purísima Concepción, Mineral del Chico (Hidalgo)
- **Foto original:** «Iglesia de Mineral Del Chico.jpg» (1632 × 1224)
- **Autor:** JafethJia
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Iglesia_de_Mineral_Del_Chico.jpg
- **Licencia:** CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
- **Descargada:** 2026-11-21 (versión de 1200 px; el original es de 1632)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte
  x 0,17–0,89 / y 0,01–0,75, borde blanco horneado y sombra suave.
  Borrado manual del triángulo del techo de la casa vecina que
  invadía la silueta por la derecha (a la altura del óculo); se
  conserva el kiosco de la plaza real frente a la iglesia.
  Salida: 932 × 693.

## bellasartes.png — Palacio de Bellas Artes (Ciudad de México)
- **Foto original:** «Bellas Artes 01.jpg» (4140 × 2760)
- **Autor:** Xavier Quetzalcoatl Contreras Castillo
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Bellas_Artes_01.jpg
- **Licencia:** CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte
  x 0,115–0,88 / y 0,08–0,86 (fuera los Pegasos de las esquinas
  y el edificio vecino de la derecha), borde blanco horneado y
  sombra suave. Vista frontal desde su explanada: en la foto —
  y en el recorte — quedan las dos astas con águila y las
  luminarias de la explanada, delante de la fachada.
  Salida: 1200 × 797.

## angel.png — El Ángel de la Independencia (Ciudad de México)
- **Foto original:** «ANGEL DE LA INDEPENDENCIA FOTO1.jpg» (3456 × 5184)
- **Autor:** Marcoantonio0074
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:ANGEL_DE_LA_INDEPENDENCIA_FOTO1.jpg
- **Licencia:** CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** rembg (u2net e isnet) solo segmenta la columna
  contra el cielo — el pedestal se pierde entero —, así que la
  máscara final es la **unión del alfa de rembg con la silueta
  poligonal del monumento completo trazada a mano** sobre la
  foto (precedente: la máscara poligonal de `tacos.png`), con
  limpieza cromática de los píxeles de cielo que solo el
  polígono reclamaba y borrado manual de las intrusiones de los
  edificios de atrás (la estatua parcial de la esquina
  izquierda, las lamas del edificio tras la estatua derecha y
  una esquirla de techo abajo). Acabado de `tools/mkcutout.py`:
  erosión de 1 px, borde blanco horneado y sombra suave.
  Salida: 642 × 2247. Nota: tras las estatuas de la esquina
  izquierda del pedestal se asoma un fragmento de la torre de
  vidrios de Reforma que se ve en la foto original; a la escala
  del juego son unos pocos píxeles.

## sanangel-vista.png — Vista lejana de San Ángel (NO versionado)
- Vista de San Ángel (El Libro de la Vida) — imagen aportada por
  Jose, uso personal, **asset solo-local no incluido en el
  repositorio** (está en `.gitignore`, como la canción del easter
  egg: es arte de una película con derechos).
- **Procesado local:** recorte del pueblo + la iglesia sobre la
  colina (x 0,17–1,0 / y 0,04–0,605 del original de 1025 × 1280 →
  851 × 723), fuera casi todo el lago y el primer plano de
  cactus/agave. Sin borde blanco: en la escena se dibuja como
  paisaje lejano, con velo de distancia aplicado por código.
  Si el archivo no está en la copia local, el juego simplemente
  no dibuja la vista.

## sanangel/ — Recortes de la escena de San Ángel (NO versionados)
- Recortes de imágenes de El Libro de la Vida aportadas por Jose,
  uso personal, **assets solo-locales no incluidos en el
  repositorio** (la carpeta `sanangel/` está en `.gitignore`, como
  la canción y la vista de arriba): las casas del pueblo
  (`casas-full.png`, `casas-a.png`, `casas-b.png`), la pileta con
  la estatua del general a caballo (`pileta.png`), Manolo con su
  guitarra (`manolo.png`), María de espaldas (`maria.png`), el
  chancho de María, Chuy (`chuy.png`), el árbol gigante de las
  velas (`arbol.png`) y dos velas del suelo (`vela-a.png`,
  `vela-b.png`).
- **Procesado local:** segmentación pieza a pieza (rembg, GrabCut,
  croma contra el cielo turquesa y máscaras a mano según la pieza),
  borde blanco horneado y sombra suave en las piezas-sticker
  (pileta, Manolo, María, Chuy); las casas, el árbol y las velas
  van sin borde (son paisaje). Todo verificado sobre fondo
  magenta. La María del cameo caminante es la de espaldas: en la
  imagen lateral del pueblo las figuras miden ~20–30 px, muy por
  debajo de los ~92 px a los que se dibuja el cameo.
- Si la carpeta no está en la copia local, la escena de San Ángel
  se juega igual: cada elemento se dibuja solo si su imagen
  cargó, y el cielo y el piso se dibujan por código.

## bola-paja.png — La bola de paja que rueda por San Ángel
- **Foto original:** «Tumbleweed on W Lone Mtn Rd.jpg» (4272 × 2848)
- **Autor:** Noah Wulf
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Tumbleweed_on_W_Lone_Mtn_Rd.jpg
- **Licencia:** CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte
  x 0,36–0,63 / y 0,16–0,52 sobre la versión de 1920 px,
  borde blanco horneado y sombra suave, verificado sobre
  fondo magenta. Salida: 370 × 259. En la escena 2 es el
  obstáculo de la calle: el viento la arrastra de derecha a
  izquierda rodando, y al chocar con el personaje controlado
  estalla en pajitas y lo frena un instante (×0,4 por 0,7 s).

## castillo.png — El castillo ambulante, a lo lejos y al final de las praderas (NO versionado)
- El castillo ambulante, del póster de la película — imagen
  aportada por Jose, uso personal, **asset solo-local no
  incluido en el repositorio** (protegido en `.gitignore`,
  como la canción y la vista de San Ángel: es arte de una
  película con derechos).
- **Procesado local:** recorte SOLO del castillo del póster
  vertical de Jose (1200 × 2598; el castillo ocupa aprox.
  x 0,07–0,82 / y 0,25–0,76): rembg (u2net) con conservación
  del componente mayor, exclusión poligonal del parche de
  cielo y montaña atrapado entre los cañones de la derecha y
  la aleta, y fundido suave en la base (en el póster la base
  se pierde en la niebla, así que el fundido es fiel al
  original y además disimula el corte). SIN borde blanco:
  en sus dos usos es paisaje lejano, no un sticker. Salida:
  793 × 1097. Los personajes del póster (Howl, Sophie,
  Markl, el espantapájaros Cabeza de Nabo, el perro y
  Calcifer) NO entran en el recorte.
- **Usos:** (1) desde el aeropuerto (escena 3) se ve a lo
  lejos, quieto en el horizonte tras el ventanal, con velo
  de distancia — es el anuncio del destino; (2) corona la
  escena 4, las praderas: de pie en grande al final de la
  franja, con el humo de sus chimeneas dibujado por código,
  una banda de niebla dibujada en su base y la Puerta de
  salida frente a él. Si el archivo no está en la copia
  local, ninguna de las dos escenas lo dibuja y ambas se
  juegan igual.

## calcifer.png — Calcifer, el obstáculo de fuego de las praderas (NO versionado)
- Calcifer, el demonio de fuego de la película del castillo
  ambulante, en su chimenea — imagen aportada por Jose, uso
  personal, **asset solo-local no incluido en el
  repositorio** (protegido en `.gitignore`, como el
  castillo: es arte de una película con derechos).
- **Procesado local:** recorte SOLO de Calcifer (el cuerpo
  de llama con su cara y sus dos brazos de fuego; SIN las
  figurillas de piedra ni la chimenea de la imagen). Las
  llamas son luminosas, así que la máscara se construyó por
  puntuación de fuego por color (calidez y brillo) sobre
  rembg, con exclusiones medidas para los ojos brillantes
  de la cara de piedra del fondo y fundido suave en la
  base. SIN borde blanco. Salida: 800 × 326. Verificado
  sobre magenta y sobre verde oscuro: el borde de la llama
  se lee sobre ambos, sin halo oscuro ni cuadrado.
- **Uso:** es el obstáculo de la escena 4: ~7 Calcifers
  estáticos sentados sobre tronquitos dibujados, repartidos
  por la vereda, parpadeando. Chocar con uno (solo el
  personaje controlado) da un fogonazo con chispas y frena
  un instante (×0,4 por 0,7 s), y ese Calcifer queda
  apagado unos segundos antes de reavivarse. Si el archivo
  no está en la copia local, cada Calcifer se dibuja por
  código (una llamita con ojos) y el obstáculo funciona
  igual.

## mononoke.png — San y la loba Moro observando desde la arboleda (NO versionado)
- San junto a la cabeza de la loba Moro, de La princesa
  Mononoke — imagen aportada por Jose, uso personal,
  **asset solo-local no incluido en el repositorio**
  (protegido en `.gitignore`, como el castillo: es arte de
  una película con derechos).
- **Procesado local:** recorte de San + la cabeza de Moro
  como una sola composición (con parte del pelaje del
  cuello; SIN el bosque de fondo ni el arbusto del primer
  plano, salvo lo que el propio encuadre mezcla con el
  vestido de San). La máscara une rembg (que solo
  segmentaba a San) con una máscara de color «claro y
  desaturado» para el pelaje gris de Moro, con relleno de
  huecos entre mechones, limpieza de las hojas verdes del
  arbusto en la parte baja y fundido suave en la base.
  SIN borde blanco: es una presencia lejana, no un sticker.
  Salida: 760 × 839.
- **Uso:** observa desde el fondo de la escena 4, dentro
  de una arboleda dibujada por código (copas verdes oscuras)
  en el tramo del paseo hacia el castillo: asoma entre los
  árboles a ~218 px de alto, con velo de distancia, quieta,
  sin colisión ni interacción. Si el archivo no está en la
  copia local, la arboleda se dibuja igual, sin el recorte.

## abrazo.png — Ximena y Jose abrazándose (escena 2, «San Ángel»)
- **Arte original del juego** (no es foto ni material de
  película): sprite nuevo de la pareja abrazándose en perfil,
  generado para el juego usando como referencia de identidad
  los sprites definidos de Ximena y de Jose (ella: pelo largo
  castaño, orejas de conejo moradas, bata blanca sobre polo
  morado; él: lentes redondos oscuros, audífonos con cable,
  camisa verde a rayas sobre polo blanco, jeans claros).
- **Procesado:** fondo magenta retirado por clave de color,
  limpieza del fleco por erosión de la máscara y borde blanco
  Paper Mario re-horneado por dilatación, como en los sprites
  definidos. Verificado sobre fondo magenta y sobre el tono
  de la calle de San Ángel, y a tamaño de juego (96 px de
  alto). Salida: 400 × 384.
- **Uso:** la acción «ESPACIO: abrazarse» de la escena 2:
  con los dos personajes cerca, la secuencia acerca a la
  pareja, oculta los sprites individuales y dibuja este
  sprite en el punto medio con balanceo suave, pétalos y
  corazoncitos dibujados por código. Si el archivo no
  cargara, la escena usa el respaldo de los dos sprites
  individuales frente a frente.

## door-close.ogg — La puerta real que se cierra al cruzar las Puertas (audio, en assets/audio/)
- **Grabación original:** «Closing an old door» (5,5 s) — una
  puerta vieja que se cierra, grabada en 2008.
- **Autor:** ezwa
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Closing_an_old_door.ogg
  (original de pdsounds.org, registro #661: http://www.pdsounds.org/sounds/closing_an_old_door)
- **Licencia:** DOMINIO PÚBLICO — el autor la liberó al
  dominio público vía pdsounds.org (plantilla
  {{PD-pdsounds.org}} de Commons: usable para cualquier fin,
  sin condiciones). Por eso SÍ se versiona, como los recortes
  CC: no es la canción.
- **Descargada:** 2026-11-21 (el .ogg de Commons, 82 KB).
- **Procesado:** la grabación es casi silencio con el golpe
  del cierre al final: recorte al golpe (3,78–4,38 s del
  original → 0,60 s), normalización de pico a −2,1 dB,
  fundidos de 5 ms (entrada) y 120 ms (salida) contra clics,
  mono 44,1 kHz Vorbis q4. Salida: 0,60 s, ~9,5 KB.
- **Uso:** suena UNA vez por cruce de Puerta dentro de la
  cita, cuando la Puerta se cierra tras la pareja (en las
  escenas de franja y el depa final, al iniciar el fundido de
  salida; en la salida del depa de apertura, al llegar a la
  plaza). Reemplaza en DateMode al blip sintetizado del juego
  principal (dos tonos de sierra), que Jose describió como
  «sonido de pixel»; el juego principal no se tocó. Respeta
  el silencio de la cita (botón/M) y usa un elemento <audio>
  propio que no toca la canción ni el reloj.

## auto-rojo.png — El descapotable rojo de la calaverita clásica (obstáculo de la plaza)
- **Foto original:** «Red Saab 900 Turbo side view.jpg» (3512 × 1324)
  — un Saab 900 Turbo descapotable rojo con la capota negra,
  en perfil puro mirando a la izquierda (su dirección de viaje
  en la escena: sin espejo).
- **Autor:** Renée Kools
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Red_Saab_900_Turbo_side_view.jpg
- **Licencia:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg) con recorte
  x 0–0,965 (fuera la rueda de bicicleta del borde derecho),
  borde blanco horneado y sombra suave. Salida: 1100 × 368.
- **Uso:** uno de los dos AUTOS CON CALAVERITA de la escena 1:
  cruza por la banda caminable en un carril y frena un
  instante (×0,4 por 0,7 s) al personaje controlado si lo
  alcanza con solape real. Lo conduce la calaverita clásica
  (vestido rojo, a juego con el auto), cuyo busto se dibuja
  sobre la ventanilla del conductor.

## auto-blanco.png — El compacto blanco de la calaverita morada (obstáculo de la plaza)
- **Foto original:** «White Opel Karl side view.jpg» — un Opel
  Karl blanco, en perfil puro mirando a la izquierda (su
  dirección de viaje en la escena: sin espejo).
- **Autor:** Renée Kools (ReneeWrites)
- **Fuente:** Wikimedia Commons — https://commons.wikimedia.org/wiki/File:White_Opel_Karl_side_view.jpg
- **Licencia:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- **Descargada:** 2026-11-21 (versión de 1920 px)
- **Procesado:** `tools/mkcutout.py` (rembg), borde blanco
  horneado y sombra suave. Salida: 1100 × 502.
- **Uso:** el otro AUTO CON CALAVERITA de la escena 1 (misma
  mecánica de carril y trastabilleo que el rojo). Lo conduce
  la calaverita morada (la del corazón en la frente), cuyo
  busto se dibuja sobre la ventanilla del conductor. Nota: se
  probó primero un Dodge Challenger blanco de la misma
  autora, pero su foto trae otro auto pegado tras el techo y
  el recorte salía sucio; el Opel es el perfil limpio.

## calaverita-clasica-busto.png y calaverita-morada-busto.png — Las conductoras
- **Arte original del juego** (no es foto ni material de
  película): los bustos son recortes de los sprites definidos
  de las dos calaveritas del juego (las que sostienen la soga
  en el final de Leyendas): la clásica de vestido rojo y la
  morada del corazón rosa en la frente. Recorte de cabeza y
  hombros (la parte alta del sprite: clásica 295 × 262 desde
  su PNG de 295 × 440; morada 336 × 255 desde el suyo de
  336 × 440), con su borde blanco horneado intacto.
- **Uso:** cada una conduce su auto de la plaza (la clásica,
  el rojo; la morada, el blanco): el busto se dibuja sobre la
  ventanilla del conductor con su base en el marco inferior
  de la ventana, compuesto como el busto de Pollito en el
  vocho.

## alebrije-calle.png — El Alebrije cruzando la calle de la plaza (encuentro)
- **Arte original del juego** (no es foto ni material de
  película): el perfil `alb_side` de su hoja de diseño
  (turnaround v2, generada desde la adaptación de Jose: ojos
  negros enormes, lengua roja rizada fuera, mancha roja con
  puntos en el flanco, aleta dorsal amarilla, cola anillada).
- **Procesado:** segmentación de la figura sobre el fondo
  crema de la hoja (flood-fill desde los bordes) y borde
  blanco Paper Mario re-horneado por dilatación, como en los
  sprites definidos. Salida: 761 × 580.
- **Uso:** ENCUENTRO de la escena 1: cruza la calle caminando
  de derecha a izquierda, sin colisión ni interacción. El
  perfil de diseño mira a la derecha, así que al dibujarlo se
  espeja SOLO el perfil para que mire a su dirección de viaje
  (la convención del proyecto para perfiles caminantes).

## teodora-calle.png — Teodora flotando sobre la calle de la plaza (encuentro)
- **Arte original del juego** (no es foto ni material de
  película): su pose de flotación hacia la izquierda, generada
  para su diseño (pelo naranja cobrizo, sombrero rosa con
  banda a cuadros y moño lila en SU lado izquierdo, vestido en
  capas morado/rosa, medias a rayas, botas magenta).
- **Procesado:** fondo magenta retirado por clave de color,
  conservando su borde blanco horneado; los bolsillos de
  fondo que se ven entre el pelo, el brazo y el cuerpo quedan
  transparentes (no se rellenan). Salida: 900 × 727.
- **Uso:** ENCUENTRO de la escena 1: cruza la calle FLOTANDO
  de derecha a izquierda (la pose ya mira a la izquierda: no
  se espeja, jamás se espeja a Teodora), con el bob de
  flotación por motor. Sin colisión ni interacción.
