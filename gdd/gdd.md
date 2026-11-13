# GAME DESIGN DOCUMENT MAESTRO
# 1 MINUTO PARA LA FIESTA

**Versión:** 0.2 — Documento Consolidado  
**Propósito:** Documento base de diseño para desarrollo narrativo, gameplay, sistemas, arte e implementación.

---

# 1. VISIÓN GENERAL

## 1.1 Concepto

**1 Minuto para la Fiesta** es un juego narrativo de estrategia, gestión y minijuegos que combina:

- Una fase inicial de recolección caótica en tiempo real.
- Gestión de recursos y personajes.
- Minijuegos competitivos y cooperativos.
- Narrativa ramificada.
- Eventos aleatorios y eventos en cadena.
- Decisiones con consecuencias.
- Progreso visual del escenario.
- Múltiples finales normales, malos, secretos y atípicos.

La premisa central es sencilla:

> Un grupo de siete roomies debe preparar una fiesta sorpresa para Ximena, una estudiante de medicina agotada después de una noche de guardia.

El problema es que Ximena está a punto de llegar.

Los jugadores tendrán aproximadamente un minuto para conseguir todo lo posible.

Cuando Ximena finalmente llega, está tan agotada que decide irse a dormir.

Entonces comienza la verdadera misión:

> Preparar la fiesta perfecta sin despertarla, sin levantar sus sospechas y sin permitir que el novio, el gato o el caos destruyan el plan.

---

# 2. LOS TRES PILARES DEL JUEGO

## PILAR 1 — CAOS

El jugador debe sentir constantemente que:

- Falta tiempo.
- Faltan recursos.
- Algo está a punto de salir mal.
- Un personaje puede generar un problema inesperado.
- El gato puede arruinar cualquier plan.
- Ximena puede despertarse.
- El novio puede aparecer.

El caos no debe significar únicamente castigo.

Debe producir situaciones divertidas y nuevas rutas narrativas.

---

## PILAR 2 — AMISTAD

La fiesta existe porque los personajes quieren hacer algo especial por Ximena.

A través de:

- Chats.
- Eventos.
- Conflictos.
- Recuerdos.
- Decisiones.

El jugador irá descubriendo las relaciones entre los roomies.

La historia debe mostrar progresivamente que Ximena es una persona que dedica gran parte de su vida a cuidar a otros.

La fiesta representa la oportunidad de que:

> Por una noche, sean sus amigos quienes cuiden de ella.

---

## PILAR 3 — IMPROVISACIÓN

El objetivo no es ejecutar un plan perfecto.

El objetivo es sobrevivir a las consecuencias de un plan imperfecto.

Cada problema debe permitir:

- Resolverlo correctamente.
- Resolverlo de manera improvisada.
- Fallar parcialmente.
- Convertir el fracaso en una nueva ruta.

---

# 3. ESTRUCTURA GENERAL DE LA PARTIDA

La partida se divide en cinco actos.

```text
ACTO 0
RECOLECCIÓN DE 1 MINUTO
        ↓
ACTO 1
LLEGADA DE XIMENA
        ↓
ACTO 2
OPERACIÓN: NO LA DESPIERTEN
        ↓
ACTO 3
ESCALADA DEL CAOS
        ↓
ACTO 4
LA GRAN REVELACIÓN
        ↓
FINAL
```

---

# 4. ACTO 0 — 1 MINUTO PARA LA FIESTA

## Objetivo

Durante una fase inicial de aproximadamente 60 segundos, los jugadores recorren el departamento recolectando:

- Objetos.
- Comida.
- Decoraciones.
- Herramientas.
- Recursos.
- Posibles ayudantes.

El tiempo es limitado.

No es posible conseguir todo.

Por lo tanto, cada partida comienza con una estrategia diferente.

---

## 4.1 Principio de diseño

Los objetos conseguidos durante este minuto deben afectar el resto de la partida.

Ejemplos:

```text
CONSIGUIÓ PASTEL
→ Desbloquea opciones de final estándar.

NO CONSIGUIÓ PASTEL
→ Debe improvisar comida posteriormente.

CONSIGUIÓ HERRAMIENTAS
→ Facilita eventos técnicos.

CONSIGUIÓ COMIDA
→ Permite resolver eventos sociales.

CONSIGUIÓ DECORACIÓN
→ Aumenta la calidad final de la fiesta.
```

---

# 5. ACTO 1 — LLEGADA DE XIMENA

Cuando termina el temporizador:

Ximena llega al departamento.

El estado de la fase inicial determina la escena.

Posibles situaciones:

- Todo parece relativamente normal.
- Hay objetos sospechosos.
- La decoración está mal escondida.
- Alguien está atrapado en una habitación.
- El gato está jugando con algo importante.

Ximena está agotada después de su guardia.

Finalmente decide irse a su habitación.

> Ximena se duerme.

Esta escena marca el cambio del gameplay.

---

# 6. ACTO 2 — OPERACIÓN: NO LA DESPIERTEN

A partir de este momento comienza el loop principal.

```text
CHAT
↓
EVENTO
↓
DECISIÓN
↓
ASIGNACIÓN DE PERSONAJES
↓
MINIJUEGO O RESOLUCIÓN
↓
CONSECUENCIA
↓
DECORACIÓN / RECOMPENSA
↓
NUEVO EVENTO
```

---

# 7. SISTEMA NARRATIVO — CHAT GRUPAL

La narrativa principal se desarrolla mediante un chat ficticio del grupo de amigos.

Nombre provisional:

# 🎂 OPERACIÓN: NO LA DESPIERTEN

El chat cumple tres funciones:

## 1. Narrativa

Los personajes hablan y desarrollan sus relaciones.

## 2. Información

Se anuncian amenazas y eventos.

## 3. Decisiones

El jugador toma decisiones mediante conversaciones.

---

## Ejemplo

**Majo:**  
¿Quién dejó las cajas en el pasillo?

**Natalia:**  
Yo no fui.

**Alan:**  
Hay literalmente una caja que dice "FIESTA SORPRESA".

**Saulo:**  
Artísticamente, representa nuestra fragilidad como grupo.

**Majo:**  
SAULO.

### DECISIÓN

A) Esconder las cajas.  
B) Culpar al gato.  
C) Llevarlas al balcón.

Cada decisión modifica variables.

---

# 8. SISTEMA DE VARIABLES PRINCIPALES

El juego utilizará variables globales.

## 8.1 SOSPECHA DE XIMENA

Representa cuánto sospecha Ximena que está ocurriendo algo.

```text
0% — No sospecha nada.
25% — Pequeñas dudas.
50% — Sospecha activamente.
75% — Busca respuestas.
100% — La Ruina.
```

La sospecha puede aumentar por:

- Ruido.
- Mensajes mal respondidos.
- Fotos filtradas.
- Objetos descubiertos.
- Visitas inesperadas.
- Eventos fallidos.

---

## 8.2 SUEÑO DE XIMENA

Representa su estado físico inmediato.

```text
DORMIDA PROFUNDAMENTE
↓
DORMIDA
↓
SUEÑO LIGERO
↓
INQUIETA
↓
CASI DESPIERTA
↓
DESPIERTA
```

Importante:

**Sospecha y Sueño son sistemas diferentes.**

Ximena puede:

- Estar dormida sin sospechar nada.
- Estar despierta pero no haber descubierto la fiesta.
- Sospechar algo sin saber exactamente qué ocurre.

Esto permite situaciones narrativas más interesantes.

---

## 8.3 ÁNIMO DEL GRUPO

Representa la moral general.

Puede disminuir por:

- Fallos.
- Discusiones.
- Eventos personales.
- Falta de recursos.

Puede aumentar por:

- Minijuegos ganados.
- Eventos resueltos.
- Saulo usando su habilidad.
- Progreso exitoso.

Si llega a 0:

> El grupo puede abandonar la misión.

---

## 8.4 NIVEL DE RUIDO

Representa el peligro ambiental.

Puede provocar:

- Despertar a Ximena.
- Quejas de vecinos.
- Visitas inesperadas.
- Clausura policial en situaciones extremas.

---

## 8.5 CALIDAD DE LA FIESTA

Representa el resultado acumulado.

Depende de:

- Decoración.
- Comida.
- Invitados.
- Regalos.
- Estado emocional del grupo.
- Calidad de la sorpresa.

Esta variable determina la presentación del final.

---

# 9. ATRIBUTOS DE LOS PERSONAJES

Todos los personajes jugables utilizan cuatro atributos principales:

## VELOCIDAD

Capacidad para:

- Moverse rápidamente.
- Recolectar objetos.
- Reaccionar.
- Resolver eventos físicos.

## SIGILO

Capacidad para:

- Esconder evidencias.
- Reducir ruido.
- Evitar sospechas.
- Resolver situaciones discretamente.

## CARISMA

Capacidad para:

- Convencer personas.
- Resolver conflictos.
- Responder mensajes.
- Negociar.

## LÓGICA

Capacidad para:

- Reparar.
- Administrar recursos.
- Resolver problemas técnicos.
- Preparar estrategias.

---

# 10. DIRECCIÓN ARTÍSTICA

## Estilo general

El juego utiliza:

> Pixel Art Chibi de alta definición sobre entornos tridimensionales minimalistas.

Los personajes son sprites de Pixel Art que funcionan visualmente como elementos billboard dentro de escenarios 3D.

El diseño debe combinar:

- Estética retro.
- Expresividad moderna.
- Proporciones chibi.
- Legibilidad inmediata.

Los personajes utilizan:

- Rasgos visuales distintivos.
- Accesorios reconocibles.
- Siluetas diferenciadas.
- Un borde blanco característico.

---

## 10.1 Especificación de sprites

Cada frame base utiliza:

```text
64 × 64 píxeles
```

La arquitectura inicial de Sprite Sheet considera:

```text
FILA 1
Frontal
Idle + Caminata + Acción

FILA 2
Espalda
Idle + Caminata

FILA 3
Perfiles
Izquierda + Derecha

FILA 4
Expresiones
Neutral
Enojado
Sospechoso
Sorprendido
```

---

# 11. PERSONAJES PRINCIPALES

# 11.1 XIMENA — LA CUMPLEAÑERA

## Rol

Amenaza principal.

Temporizador dinámico.

Boss narrativo.

## Personalidad funcional

Ximena no debe sentirse como una villana.

Es el personaje que todos intentan proteger de la sorpresa.

Pero, desde la perspectiva del gameplay:

> Ximena es la amenaza más importante.

Su presencia afecta:

- Sospecha.
- Sueño.
- Ruido.
- Eventos.
- Minijuegos.

## Diseño visual

- Cabello castaño liso.
- Peinado hacia los lados.
- Sin flequillo.
- Moño descuidado.
- Lentes redondos grandes.
- Bata médica blanca.
- Blusa morada.
- Scrubs grises.
- Zapatos clínicos oscuros.

Rasgo distintivo:

> Cintillo con orejas de Bonnie.

---

# 12. LOS SIETE ROOMIES

---

## 12.1 NATALIA — LA ATLETA IMPACIENTE

### Estadísticas

```text
VELOCIDAD: 9
SIGILO: 3
CARISMA: 5
LÓGICA: 5
```

### Habilidad

Recolecta objetos rápidamente.

Especialmente poderosa durante:

- La fase inicial.
- Eventos físicos.
- Situaciones de persecución.

### Defecto

Es terca e impaciente.

Puede fallar o generar consecuencias negativas en decisiones que requieren:

- Esperar.
- Ser paciente.
- Actuar con discreción.

### Rol de gameplay

> Especialista en velocidad.

---

## 12.2 SAULO — EL ARTISTA DRAMÁTICO

### Estadísticas

```text
VELOCIDAD: 5
SIGILO: 4
CARISMA: 8
LÓGICA: 3
```

### Habilidad

Puede mejorar la moral grupal durante situaciones de crisis.

### Defecto

Los dramas románticos o emocionales pueden afectarlo negativamente.

Puede generar una:

> Crisis Existencial de Saulo.

### Rol de gameplay

> Especialista emocional y social.

---

## 12.3 ITZEL — LA CONFIDENTE CELOSA

### Estadísticas

```text
VELOCIDAD: 5
SIGILO: 8
CARISMA: 7
LÓGICA: 4
```

### Habilidad

Excelente reduciendo la sospecha de Ximena.

Es particularmente útil para:

- Esconder evidencias.
- Resolver interrogatorios.
- Justificar situaciones sospechosas.

### Defecto

Puede comportarse de manera infantil o celosa.

En determinadas rutas:

> Puede sabotear al grupo.

### Rol de gameplay

> Especialista en sospecha y control social.

---

## 12.4 FÁTIMA — LA COCINERA

### Estadísticas

```text
VELOCIDAD: 4
SIGILO: 5
CARISMA: 4
LÓGICA: 9
```

### Habilidad

Mejora la duración y efectividad de los recursos de comida.

### Defecto

Su desorden puede generar eventos de limpieza.

### Rol de gameplay

> Especialista en recursos y cocina.

---

## 12.5 SAMANTHA — LA INFLUENCER

### Estadísticas

```text
VELOCIDAD: 6
SIGILO: 2
CARISMA: 10
LÓGICA: 3
```

### Habilidad

Puede conseguir recursos externos mediante:

- Favores.
- Contactos.
- Persuasión.

### Defecto

Tiene riesgo de filtrar accidentalmente información.

Ejemplo:

- Foto.
- Historia.
- Video.
- Publicación.

### Rol de gameplay

> Especialista en recursos sociales.

---

## 12.6 MAJO — LA SUPERVISORA ESTRICTA

### Estadísticas

```text
VELOCIDAD: 4
SIGILO: 9
CARISMA: 3
LÓGICA: 8
```

### Habilidad

Sus acciones de gestión pueden realizarse sin generar ruido.

### Defecto

Sus fallos incrementan fuertemente su estrés.

### Rol de gameplay

> Especialista en control, sigilo y planificación.

---

## 12.7 ALAN — EL DJ / TÉCNICO

### Estadísticas

```text
VELOCIDAD: 7
SIGILO: 3
CARISMA: 8
LÓGICA: 5
```

### Habilidad

Resuelve problemas técnicos y eléctricos.

### Defecto

Sus acciones pueden generar ruido y problemas con los vecinos.

### Rol de gameplay

> Especialista técnico.

---

# 13. LOS ANTAGONISTAS DINÁMICOS

Los antagonistas no deben funcionar necesariamente como villanos tradicionales.

Son:

> Fuerzas que compiten contra el objetivo de preparar la fiesta.

---

# 13.1 JOSÉ — EL NOVIO

José representa una amenaza estratégica externa.

Su objetivo puede variar según la ruta.

Puede:

- Intentar llevarse a Ximena.
- Intentar despertarla.
- Organizar otro plan de cumpleaños.
- Interferir accidentalmente.
- Convertirse en aliado.

## Diseño visual

- Camiseta verde con rayas.
- Pantalones negros.
- Lentes de sol.
- Auriculares de cable.

## Rol de diseño

José debe tener rutas narrativas variables.

No debe ser automáticamente "el malo".

Variables posibles:

```text
JOSE_NO_SABE_DEL_PLAN
JOSE_DESCONFIA_DEL_GRUPO
JOSE_ES_RIVAL
JOSE_ES_ALIADO
JOSE_AYUDA_EN_LA_FIESTA
```

---

# 13.2 POLLITO — EL GATO

Pollito es:

> Una fuerza del caos.

No tiene una motivación racional.

Puede ayudar o perjudicar al jugador.

## Diseño

- Gato calicó.
- Muy energético.
- Animaciones expresivas.

## Funciones

Pollito puede:

- Robar objetos.
- Derribar decoración.
- Activar aparatos.
- Entrar en habitaciones prohibidas.
- Participar contra los roomies.
- Interrumpir minijuegos.

---

# 14. EVENTOS DE AMENAZA — SISTEMA XIMENA

Estos eventos incrementan directamente la Sospecha o afectan el Sueño.

---

## 14.1 EL INTERROGATORIO DE WHATSAPP

Ximena envía un mensaje inesperado.

Pregunta por:

- Un gasto.
- Un ruido.
- Una actividad sospechosa.

### Mecánica

El jugador asigna un personaje para responder.

### Resolución

- Alto Carisma/Lógica → Reduce o controla la sospecha.
- Mala elección → Incrementa la sospecha.

### Ejemplo de riesgo

Natalia puede responder impulsivamente.

Itzel puede manejar mejor la conversación.

---

## 14.2 LA VISITA RELÁMPAGO

Ximena necesita regresar temporalmente porque olvidó algo.

### Ejemplos

- Llaves.
- Cuaderno.
- Cargador.
- Material médico.

### Mecánica

Evento crítico de tiempo.

El jugador debe:

- Esconder evidencias.
- Cerrar zonas.
- Reorganizar objetos.

Puede requerir:

- Recursos defensivos.
- Sigilo.
- Un minijuego.

---

## 14.3 EL SEXTO SENTIDO

Ximena comienza a conectar pistas.

Puede activarse por:

- Una publicación de Samantha.
- Una conversación.
- Un objeto encontrado.
- Un fallo anterior.

El jugador debe sacrificar acciones o utilizar personajes sociales para convencerla.

---

# 15. EVENTOS DE GESTIÓN

Estos eventos mantienen la presión sobre los recursos.

---

## EL APAGÓN

Un problema eléctrico afecta el departamento.

### Soluciones

- Lógica.
- Alan.
- Recursos técnicos.

### Fallo

El grupo pierde acciones o queda temporalmente limitado.

---

## INVASIÓN DE HORMIGAS

Puede ocurrir especialmente después de problemas de limpieza.

### Soluciones

- Utilizar agua.
- Limpiar.
- Actuar rápidamente.

---

## CRISIS EXISTENCIAL DE SAULO

Saulo entra en una crisis emocional.

### Soluciones

- Carisma.
- Interacción social.
- Recursos narrativos específicos.

### Fallo

Disminuye la moral.

---

## VISITA INESPERADA

Padres, suegros u otros visitantes llegan buscando a Ximena.

El jugador debe decidir:

- Fingir que no hay nadie.
- Abrir.
- Dar explicaciones.
- Utilizar recursos.

---

# 16. NUEVA CATEGORÍA — EVENTOS DE SUEÑO

Estos eventos conectan directamente con la premisa original.

---

## 16.1 LA VUELTA

Ximena se mueve en la cama.

El jugador tiene pocos segundos para:

- Reducir ruido.
- Detener actividades.
- Ocultar sonidos.

---

## 16.2 EL VASO DE AGUA

Ximena sale parcialmente dormida.

Debe llegar a la cocina sin descubrir la fiesta.

Se activa un minijuego de:

> Esconde Todo.

---

## 16.3 SONAMBULISMO

Ximena comienza a caminar dormida.

Los roomies deben:

- Evitar que vea decoración.
- Guiarla.
- Evitar obstáculos.
- Llevarla nuevamente a su habitación.

Ximena se convierte temporalmente en:

> Competidora involuntaria.

---

# 17. SISTEMA DE MINIJUEGOS

Los minijuegos deben ser cortos.

Duración recomendada:

```text
30 segundos
a
2 minutos
```

Cada uno debe tener consecuencias narrativas.

---

## 17.1 DECORACIÓN EXPRESS

Objetivo:

Decorar una zona antes del tiempo límite.

Variables:

- Velocidad.
- Precisión.
- Ruido.

---

## 17.2 PIZZA SILENCIOSA

Transportar comida sin:

- Caer.
- Hacer ruido.
- Llamar la atención.

---

## 17.3 ESCONDE TODO

Ximena se acerca.

Los jugadores deben esconder:

- Globos.
- Regalos.
- Pastel.
- Decoraciones.

---

## 17.4 POLLITO ROBÓ EL REGALO

Competencia para localizar al gato.

Pollito puede cambiar de zona y generar rutas impredecibles.

---

## 17.5 BATALLA DE MENSAJES

Minijuego basado en:

- Timing.
- Elección de respuestas.
- Lectura del contexto.

Ideal para:

- Interrogatorio de WhatsApp.
- Conversaciones con José.
- Vecinos.

---

## 17.6 NO HAGAS RUIDO

Minijuego cooperativo.

Los jugadores deben coordinar acciones.

Un error puede aumentar:

- Ruido.
- Sueño.
- Sospecha.

---

# 18. EVENTOS DE CADENA — FINALES ATÍPICOS

Las cadenas especiales deben funcionar como rutas raras.

Cada cadena requiere varias decisiones consecutivas.

La estructura base es:

```text
EVENTO 1
↓
DECISIÓN CORRECTA
↓
EVENTO 2
↓
DECISIÓN CORRECTA
↓
EVENTO 3
↓
FINAL ATÍPICO
```

---

# 19. CADENA 1 — EL CONTACTO ESPACIAL

## DESTINO: WASP-103b

### Evento 1 — La Transmisión

La televisión se enciende mostrando el Canal 94.

Aparecen patrones extraños.

### Decisión

- Descifrar el patrón mediante Lógica.
- Apagar la televisión.

Apagarla cancela la cadena.

---

### Evento 2 — El Artefacto

Los patrones revelan planos para construir un transmisor.

El jugador debe sacrificar recursos.

---

### Evento 3 — La Coordenada Final

El transmisor genera una fuerte perturbación.

El jugador debe mantenerlo funcionando sin destruir el plan principal.

### Final

El departamento es transportado.

La fiesta termina celebrándose en gravedad cero orbitando WASP-103b.

---

# 20. CADENA 2 — EL FOLCLORE CINEMATOGRÁFICO

## DESTINO: PELÍCULA DE LEYENDAS

### Evento 1 — El Guion Perdido

Los roomies encuentran un libreto antiguo.

Contiene elementos aparentemente sobrenaturales.

### Evento 2 — Efectos Especiales Reales

Los objetos comienzan a moverse.

Natalia puede utilizar su velocidad para controlar la situación.

### Evento 3 — El Director Fantasma

Aparece una oportunidad para convertir el departamento en una producción cinematográfica.

### Final

Los personajes terminan formando parte de una película fantástica de folclore.

---

# 21. CADENA 3 — EL DESAFÍO DE LAS CUERDAS

## DESTINO: HERMANOS CALAVERA

### Evento 1 — La Máscara

Llega una máscara equivocada.

Un personaje puede utilizarla temporalmente.

### Evento 2 — El Reto

Una amenaza sobrenatural propone un desafío.

### Evento 3 — El Ring Improvisado

El grupo transforma recursos del departamento en un escenario.

### Final

La fiesta termina convertida en un evento de lucha.

Ximena es coronada como campeona.

---

# 22. SISTEMA DE PROGRESO VISUAL

El departamento debe cambiar físicamente.

## NIVEL 0

Departamento normal.

## NIVEL 1

Primeros elementos decorativos.

## NIVEL 2

Varias zonas transformadas.

## NIVEL 3

Fiesta prácticamente preparada.

## NIVEL 4

Fiesta espectacular.

La progresión debe ser visible durante toda la partida.

---

# 23. FINALES

## 23.1 FINALES MALOS

### LA RUINA

Sospecha de Ximena llega al 100%.

Descubre los preparativos antes del momento adecuado.

---

### EL ABANDONO

El ánimo llega a 0.

El grupo abandona la misión.

---

### CLAUSURA

El ruido y el caos provocan una intervención externa.

La fiesta termina antes de comenzar.

---

### DESERCIÓN

El grupo se queda sin recursos suficientes y abandona el plan.

---

# 24. FINAL ESTÁNDAR

# ¡SORPRESA!

Los roomies consiguen mantener la operación hasta el momento adecuado.

La calidad de la fiesta depende de:

- Recursos restantes.
- Decoración.
- Comida.
- Invitados.
- Estado emocional del grupo.

El mismo final puede tener múltiples versiones visuales.

---

# 25. FINALES ESPECIALES ADICIONALES

## LA FIESTA PERFECTA

Alta calidad.

Baja sospecha.

Ximena no descubre nada.

---

## EL CAOS PERFECTO

La fiesta está llena de errores.

Pero termina siendo memorable.

---

## NOS DESCUBRIÓ

Ximena descubre el plan antes de tiempo.

El grupo debe improvisar la revelación.

---

## JOSÉ SE LA LLEVA

José consigue interrumpir el plan.

La fiesta queda preparada sin su protagonista.

---

## JOSÉ SE UNE

El novio descubre el plan.

En lugar de arruinarlo:

> Decide ayudar.

---

## EL PLAN DE POLLITO

Final secreto.

El gato provoca accidentalmente la revelación perfecta.

---

## ELLA LO SABÍA

Final secreto.

Ximena descubre que estaban preparando la fiesta desde el principio.

Pero decide fingir que no sabe nada.

---

# 26. REGLA DE DISEÑO MÁS IMPORTANTE

El fracaso no debe terminar automáticamente la partida.

La estructura ideal es:

```text
ÉXITO
→ Recompensa.

FALLO PARCIAL
→ Nueva complicación.

FALLO IMPORTANTE
→ Cambio de ruta.

FALLO CRÍTICO
→ Final.
```

Ejemplo:

```text
SE ROMPE EL PASTEL
↓
NO GAME OVER
↓
SE ACTIVA EVENTO
"CONSIGAN UN NUEVO PASTEL"
↓
NUEVO MINIJUEGO
↓
NUEVA HISTORIA
```

---

# 27. ARQUITECTURA CONCEPTUAL

```text
GAME MANAGER
│
├── COLLECTION PHASE
│
├── CHARACTER SYSTEM
│   ├── Stats
│   ├── Skills
│   └── Defects
│
├── RESOURCE SYSTEM
│
├── NARRATIVE SYSTEM
│   ├── Chat
│   ├── Decisions
│   ├── Flags
│   └── Events
│
├── XIMENA SYSTEM
│   ├── Suspicion
│   ├── Sleep
│   └── Threat Events
│
├── THREAT SYSTEM
│   ├── José
│   ├── Pollito
│   └── Environmental Threats
│
├── MINIGAME SYSTEM
│
├── DECORATION SYSTEM
│
└── ENDING SYSTEM
```

---

# 28. PRINCIPIO DE IMPLEMENTACIÓN

Los eventos no deben estar hardcodeados individualmente dentro de la lógica principal.

Deben funcionar como contenido basado en datos.

Conceptualmente:

```text
EVENTO
│
├── ID
├── Condiciones de activación
├── Personajes involucrados
├── Recursos necesarios
├── Opciones
├── Pruebas de atributos
├── Minijuego opcional
├── Consecuencias
└── Flags resultantes
```

Ejemplo:

```text
EVENT_ID: interrogatorio_whatsapp

CONDICIÓN:
ximena_suspicion > 20

OPCIÓN A:
Asignar Itzel

RESULTADO:
sigilo + carisma

ÉXITO:
suspicion - 10

FALLO:
suspicion + 5
```

---

# 29. VERTICAL SLICE RECOMENDADO

La primera versión implementable debe contener:

## PERSONAJES

- Ximena.
- Natalia.
- Itzel.
- Alan.
- Pollito.

## FASE INICIAL

- 3 habitaciones.
- 10 objetos.
- 60 segundos.

## SISTEMAS

- Inventario.
- Sospecha.
- Sueño.
- Ruido.
- Calidad de fiesta.

## EVENTOS

1. Llegada de Ximena.
2. Interrogatorio de WhatsApp.
3. Apagón.
4. Ximena busca agua.
5. Pollito roba un objeto.

## MINIJUEGOS

1. Decoración Express.
2. Esconde Todo.
3. Pollito Robó el Regalo.

## FINALES

- ¡Sorpresa!
- La Ruina.
- El Caos Perfecto.

---

# 30. OBJETIVO DEL VERTICAL SLICE

La primera versión no debe demostrar cantidad de contenido.

Debe demostrar que funciona esta secuencia:

> RECOLECTAR → DECIDIR → RESOLVER → JUGAR → SUFRIR CONSECUENCIAS → MEJORAR LA FIESTA → CONTINUAR LA HISTORIA.

Si ese loop es divertido:

> El resto del contenido puede crecer alrededor de él.

---

# 31. VISIÓN FINAL

**1 Minuto para la Fiesta** debe sentirse como una mezcla de:

- Un plan de supervivencia absurdo.
- Una fiesta que nunca sale como estaba planeada.
- Un juego de amigos compitiendo y cooperando.
- Una historia que cambia según los errores del jugador.

La pregunta central del juego es:

> ¿Podrá este grupo de roomies organizar una noche inolvidable antes de que Ximena descubra todo?

La respuesta nunca debe ser completamente predecible.

# FIN DEL DOCUMENTO MAESTRO — VERSIÓN 0.2