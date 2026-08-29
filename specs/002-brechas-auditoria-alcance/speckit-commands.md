# Lo que se le pidió a Spec Kit en esta feature

Registro de los comandos y de los mensajes que se les envió, en el orden en que se ejecutaron.
Mismo propósito que `speckit-commands.md` de la raíz, que guarda los de la feature 001: sirve para
el informe, para repetir el flujo, y para que quede constancia de que el detalle se puso **antes**
de generar nada.

Cada bloque lleva además una nota de **cómo se ejecutó realmente**, porque dos de los tres comandos
no se pudieron lanzar tal cual sobre un proyecto ya construido. Esa es información útil, no una
excusa: es la diferencia entre usar Spec Kit para arrancar un proyecto y usarlo para corregirlo.

---

## 1 · `/speckit-constitution`

**Ejecutado como skill, con este mensaje:**

```
Enmienda mínima y quirúrgica a `.specify/memory/constitution.md`. NO reescribas el documento:
conserva intacto todo lo demás (los siete principios, restricciones técnicas, integración de
aportes, las nueve compuertas y Governance).

CONTENIDO DE LA ENMIENDA — un solo cambio:

En el Principio I "Alcance Cerrado y Trazable", en la lista que empieza con "El alcance
implementado incluye explícitamente...", añade un punto en el mismo estilo y tono que los dos
existentes: la configuración del tope de reservas activas de RN-06. El alcance pide que el límite
sea "configurable" (§3.4, RN-06) pero no lo nombra en §3.1 ni le da pantalla en §3.2. Se resuelve
como alcance por traza a la regla: el valor vive en la tabla `configuracion` de `reservas_db`, se
lee y se escribe por un endpoint de `ms-reservas` restringido a ADMINISTRADOR, y se edita desde
`mf-administracion`. Un tope que solo se cambia con un UPDATE a mano deja la palabra "configurable"
sin respaldo demostrable en la defensa.

MOTIVO (para el Sync Impact Report): una auditoría del sistema contra el documento de alcance
(`docs/AUDITORIA-ALCANCE.md`, 29-ago-2026) encontró que RN-06 se aplica correctamente en
`BookingService.verificarTope`, pero que el valor no se puede cambiar desde ninguna interfaz ni
endpoint. Este punto es borderline bajo el Principio I —traza a una RN, no a una fila de §3.1—, y
el documento ya resuelve ese tipo de ambigüedad enumerando el caso explícitamente, que es el
precedente que se sigue aquí.

VERSIONADO: 1.2.0 → 1.3.0 (MINOR). Sigue el precedente declarado para la enmienda 1.1.0: es MINOR
y no PATCH porque añade una obligación nueva y verificable —una feature puede ahora fallar la
compuerta 1 por dejar el tope sin forma de configurarse—. Actualiza el bloque SYNC IMPACT REPORT y
la línea final Version / Last Amended con fecha 2026-08-29. La ratificación no cambia.

NO INCLUIR (decisiones ya tomadas):
- No añadas ni modifiques ninguna compuerta de calidad. Se evaluó endurecer la compuerta 8 para
  detectar "capacidad que §3.1 atribuye a un rol, servida por la API pero sin pantalla para ese
  rol" y se decidió dejarlo para un cambio posterior y separado.
- No toques nada por la consulta de disponibilidad del administrador: ese hueco ya está cubierto
  por el Principio I y por FR-007 del spec de 001, y no necesita enmienda.

INTENCIONES DIFERIDAS (recógelas en Next Actions, no las ejecutes):
1. Añadir el escenario de aceptación del administrador consultando disponibilidad.
2. Especificar el endpoint y la pantalla de configuración del tope de RN-06.
```

**Cómo se ejecutó**: tal cual, con la skill. Es el único comando de Spec Kit que funciona sin
reservas sobre un proyecto ya construido, porque su trabajo es enmendar un documento que ya existe.
Resultado: constitución **1.3.0**, 31 líneas añadidas y 2 modificadas, con los siete principios,
las nueve compuertas y las cinco secciones intactos.

---

## 2 · `/speckit-specify`

**Mensaje que define la feature:**

```
Cerrar las dos brechas de la auditoría de alcance (docs/AUDITORIA-ALCANCE.md, 29-ago-2026), en una
feature propia y no como enmienda a 001.

Historia 1 — El administrador consulta disponibilidad. Cierra FR-007 de la feature 001, que exigía
la consulta "para usuarios autenticados de ambos roles" y nunca se implementó: faltó el escenario
de aceptación en la historia del administrador y por eso ninguna tarea lo recogió; las tres tareas
que implementan FR-007 —T064, T072, T079— quedaron todas bajo la historia del usuario final. Dilo
explícitamente en el spec en vez de esconderlo. El backend ya cumple: GET /api/reservas/
disponibilidad no comprueba rol. La pantalla es de solo lectura: §3.1 no atribuye al administrador
la creación de reservas, así que no puede ofrecer acción de reservar.

Historia 2 — Configurar el tope de reservas activas de RN-06. Alcance nuevo, declarado por la
enmienda 1.3.0 de la constitución. Hoy el valor solo se cambia con un UPDATE a mano sobre la tabla
`configuracion` de reservas_db. Tiene que poder leerse y cambiarse desde la interfaz de
administración, y el valor nuevo debe regir sin reiniciar ni redesplegar. Decide y escribe qué pasa
cuando el tope se baja por debajo de lo que un usuario ya tiene: no es retroactivo, las reservas
confirmadas se conservan y el tope se evalúa al crear.

Continúa la numeración de 001 en FR y SC —FR-049 en adelante, SC-011 en adelante— para que no haya
identificadores repetidos en el proyecto. Sin entidades ni migraciones nuevas: la tabla
`configuracion` y su fila existen desde V2__configuracion.sql.

No toques las cuatro historias de 001 ni sus 134 tareas cerradas.
```

**Cómo se ejecutó**: `create-new-feature.sh` sí se lanzó, y creó `specs/002-brechas-auditoria-alcance/`
con el `spec.md` de plantilla y el apuntador en `.specify/feature.json`. El **spec se escribió a
mano** sobre esa plantilla.

La skill completa **no** se lanzó, y conviene saber por qué: su flujo copia la plantilla en blanco
sobre `spec.md` de la feature que tenga apuntada. Lanzarla apuntando a 001 —que fue el primer
intento— habría borrado un spec de 473 líneas con cuatro historias, 48 requisitos y su
trazabilidad. `/speckit-specify` crea features; no enmienda las que ya existen.

---

## 3 · `/speckit-plan`

**Mensaje del plan:**

```
Planifica la implementación de las dos historias. Casi todo el contexto técnico ya está decidido en
001, así que no investigues de nuevo el stack: Java 21, Spring Boot 4.0.8, React 19 con Rsbuild y
Module Federation, PostgreSQL 16. Sin dependencias nuevas en ninguno de los dos lados.

Lo que sí hay que decidir y dejar escrito en research.md, continuando la numeración de 001 que
llegó a R-009:

- La forma del endpoint de configuración del tope. Recurso propio con cuerpo tipado, no el par
  clave/valor crudo. Caso de uso separado de BookingService, que ya concentra RN-01 a RN-06 y
  RN-08. Deja constancia de que no hay caché que invalidar —BookingService lee la clave en cada
  creación— y de que si algún día la hay, el requisito pasa a exigir su invalidación.
- Dónde vive la pantalla de disponibilidad del administrador. Pantalla propia en mf-administracion,
  no la de mf-reservas abierta a dos roles. Escribe las tres razones: el Principio V prohíbe
  importar entre remotes, esa pantalla lleva un botón Reservar contra un endpoint que devuelve 403
  al administrador, y su barra muestra "Mis Reservas", que para un administrador está siempre vacía.

El contrato del recurso nuevo va en un archivo propio de esta feature declarado como extensión del
de 001, no como copia: dos documentos completos del contrato de /api/reservas serían dos fuentes de
verdad que divergen.

Evalúa el Constitution Check contra la v1.3.0 y sé explícito con la compuerta 9: la Historia 1 no
toca el DSL —la vista 11 usa capas genéricas, no una caja por pantalla— y la Historia 2 sí, porque
añade tres componentes a la vista 03, que es la que el informe reproduce como Figura 3.

No hace falta data-model.md: no se crea ni se altera ninguna entidad. Ni quickstart.md propio: se
verifica con los escenarios de 001 más los que añada /speckit-tasks.
```

**Cómo se ejecutó**: `setup-plan.sh` sí se lanzó y copió la plantilla —al ser 002 una feature nueva,
no había plan que pisar—. Los artefactos de la Fase 0 y la Fase 1 se escribieron a mano siguiendo
esa plantilla, en vez de dejar que la skill los generase de cero, para reutilizar el análisis de la
auditoría en lugar de repetirlo.

---

## 4 · `/speckit-tasks`

**Ejecutado como skill, con este mensaje:**

```
Genera las tareas de las dos historias, agrupadas por historia y en rebanadas verticales, con la
ruta exacta de cada archivo. Continúa la numeración de 001, que llegó a T134.

La Historia 1 es solo frontend: cliente de API, pantalla de solo lectura, ruta y entrada de
navegación en mf-administracion. Sin trabajo de backend.

La Historia 2 va backend primero y pantalla después, en ese orden, porque el Principio VI exige el
contrato publicado antes de que la pantalla lo consuma. Incluye la prueba del caso de uso con el
puerto mockeado, y una que verifique que bajar el tope no cancela reservas ya confirmadas.

Cierra con las tareas de la compuerta 9 de la Historia 2: los tres componentes nuevos en la vista
03 del workspace.dsl, la reexportación de componentes-reservas.pdf y el puerto de configuración en
§4 del informe.
```

**Cómo se ejecutó**: tal cual, con la skill, y esta vez sin reservas. La skill genera `tasks.md`
desde plantilla, que sobre 002 es lo correcto porque el archivo no existía. Sobre 001 habría borrado
los 134 tasks cerrados — exactamente la razón por la que este trabajo acabó en una feature propia.

Resultado: 25 tareas, **T135 a T159**, sin ninguna colisión con las 134 de 001.
