# Personajes, Estilo Gráfico y Características: "1 minuto para la fiesta"

Este documento consolida la información técnica, las especificaciones del estilo visual **Pixel Art 2.5D**, estadísticas, habilidades y la indumentaria detallada de cada personaje (la Cumpleañera y los 7 Roomies) para el juego.

---

## 1. Dirección Artística y Estilo Técnico (Pixel Art sobre Entorno 3D / 2.5D)

Para lograr la identidad visual del juego, hemos optado por un estilo de **Pixel Art Chibi de alta definición**, inspirado en las proporciones de juegos clásicos y modernos con entornos tridimensionales minimalistas.

*   **Estilo Visual:** Personajes renderizados como sprites de pixel art detallado (conservando rasgos clave como lentes grandes, proporciones cabezonas y accesorios precisos).
*   **Entorno:** Escenarios 3D limpios donde los personajes actúan como elementos *billboard* (sprites 2D orientados en el espacio tridimensional).
*   **Especificaciones Técnicas de los Sprites:**
    *   **Tamaño por Frame (Cuadro):** $64 \times 64$ píxeles por celda en la cuadrícula (*grid*), lo que permite conservar la legibilidad de los rostros, los lentes de Ximena, audífonos y texturas de ropa sin perder la esencia retro.
    *   **Arquitectura de la Hoja de Sprites (*Sprite Sheet*):** 
        *   *Fila 1:* Movimientos hacia el frente (Idle + Ciclo de caminata + Acción).
        *   *Fila 2:* Movimientos de espaldas (Idle + Ciclo de caminata).
        *   *Fila 3:* Perfil lateral izquierdo y derecho.
        *   *Fila 4:* Expresiones faciales y estados de alerta (Neutral, Enojado, Sospechoso, Sorprendido).

---

## 2. Atributos Principales (Escala $1 - 10$)

*   **Velocidad:** Rapidez en los 60 segundos iniciales y capacidad de carga de objetos.
*   **Sigilo:** Capacidad de limpiar evidencias y reducir la barra de sospecha de Ximena.
*   **Carisma:** Manejo de interacciones sociales, persuasión y eventos con vecinos o invitados.
*   **Lógica:** Administración eficiente de recursos, reparaciones técnicas y preparación de comida.

---

## 3. La Cumpleañera (El "Boss")

### Ximena - La Estudiante de Medicina Fan de FNAF

*   **Rol:** Amenaza principal / Temporizador dinámico del juego.
*   **Silueta y Estilo:** Chibi en pixel art, cabello castaño liso peinado hacia los lados (sin flequillo) con un moño descuidado en la parte trasera. Lentes redondos grandes de marco clásico. Expresión neutra estándar en reposo.
*   **Indumentaria en Pixel Art:**
    *   Bata médica blanca abierta y ligeramente holgada.
    *   Blusa morada casual por debajo.
    *   Pantalón médico (*scrubs*) gris holgado y zapatos clínicos cómodos oscuros.
    *   **Rasgo distintivo clave:** Su cintillo con las orejas de **Bonnie** (*Five Nights at Freddy's*).

---

## 4. Los Roomies (Personajes Jugables)

### Matriz de Estadísticas

| Personaje | Arquetipo | Velocidad | Sigilo | Carisma | Lógica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Natalia** | La Atleta Impaciente | 9 | 3 | 5 | 5 |
| **Saulo** | El Artista Dramático | 5 | 4 | 8 | 3 |
| **Itzel** | La Confidente Celosa | 5 | 8 | 7 | 4 |
| **Fátima** | La Cocinera | 4 | 5 | 4 | 9 |
| **Samantha** | La Influencer | 6 | 2 | 10 | 3 |
| **Majo** | La Supervisora Estricta| 4 | 9 | 3 | 8 |
| **Alan** | El DJ / Técnico | 7 | 3 | 8 | 5 |

### Detalle de Indumentaria, Habilidades y Estilo Pixel Art por Personaje

#### 1. Natalia (La Atleta Impaciente)
*   **Habilidades:** Recolecta objetos más rápido al inicio / **Defectos:** Terca e impaciente (falla opciones que requieran esperar).
*   **Indumentaria y Estilo:** Complexión enérgica, postura inclinada hacia adelante. Ropa deportiva urbana (playera *oversize* deportiva), shorts o pants de *running*, tenis deportivos de colores llamativos y audífonos de *gaming* al cuello.
*   **Paleta:** Tonos deportivos vibrantes (neón, azul eléctrico, gris oscuro).

#### 2. Saulo (El Artista Dramático)
*   **Habilidades:** Sube la moral grupal ante crisis / **Defectos:** Miagajero/llorón (entra en depresión si hay dramas románticos).
*   **Indumentaria y Estilo:** Postura expresiva. Sudadera holgada con manchas de pintura o tinta, pantalón de mezclilla relajado, tenis casuales. Lleva un pequeño morral o libreta de dibujo.
*   **Paleta:** Tonos cálidos y bohemios (terracota, ocre, marrón, verde olivo).

#### 3. Itzel (La Confidente Celosa)
*   **Habilidades:** Reduce la sospecha de Ximena excelentemente / **Defectos:** Infantil y celosa (puede sabotear al grupo).
*   **Indumentaria y Estilo:** Silueta compacta y adorable. Suéter tejido de punto con mangas largas que cubren parte de las manos, falda casual con mallas largas y flats sencillos. Coletas cortas.
*   **Paleta:** Tonos pasteles contrastados con oscuros (rosa pastel, morado lavanda, negro).

#### 4. Fátima (La Cocinera)
*   **Habilidades:** Duplica la duración y efecto de la comida / **Defectos:** Desordenada (genera eventos de limpieza obligatoria).
*   **Indumentaria y Estilo:** Postura firme. Delantal de cocina clásico sobre camiseta cómoda, pantalón de mezclilla resistente y zapatos antideslizantes. Paño de cocina en la cintura.
*   **Paleta:** Tonos limpios y hogareños (blanco, rojo cuadros vichy, beige).

#### 5. Samantha (La Influencer)
*   **Habilidades:** Consigue recursos externos gratis mediante favores / **Defectos:** 30% de riesgo de filtrar historias por accidente.
*   **Indumentaria y Estilo:** Postura estilizada y moderna. Ropa de tendencia (*streetwear*), accesorios llamativos y smartphone en mano listo para grabar.
*   **Paleta:** Tonos modernos y llamativos (magenta, blanco perla, negro, dorado sutil).

#### 6. Majo (La Supervisora Estricta)
*   **Habilidades:** Sus acciones de gestión no generan ruido (Sigilo 9) / **Defectos:** Su estrés sube el doble si falla un evento.
*   **Indumentaria y Estilo:** Postura rígida y recta. Blusa formal o camisa de cuello cerrado, pantalón de vestir recto y zapatos cerrados de suela baja. Porta libreta de notas.
*   **Paleta:** Tonos sobrios y profesionales (azul marino, gris plomo, blanco formal).

#### 7. Alan (El DJ / Técnico)
*   **Habilidades:** Resuelve fallas eléctricas y técnicas gratis / **Defectos:** Acciones ruidosas que alteran a los vecinos.
*   **Indumentaria y Estilo:** Postura relajada pero alerta. Camiseta gráfica de banda o geek, pantalón cargo multibolsillos y tenis urbanos. Audífonos de estudio grandes al cuello.
*   **Paleta:** Tonos oscuros y urbanos (negro, verde militar, acentos en amarillo neón).