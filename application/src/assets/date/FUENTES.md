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
