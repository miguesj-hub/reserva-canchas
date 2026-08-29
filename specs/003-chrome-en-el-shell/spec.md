# Feature Specification: El chrome del frontend vive en el shell

**Feature Branch**: `003-chrome-en-el-shell`

**Created**: 2026-08-29

**Status**: Draft

**Input**: Hallazgo posterior a `docs/AUDITORIA-ALCANCE.md`: el menú lateral y la
cabecera viven duplicados en el layout de cada microfrontend, y cuatro artefactos
del proyecto —constitución, informe, modelo C4 y la propia rúbrica implícita del
patrón— describen lo contrario.

## Qué se construye, en una frase

Los botones de navegación pasan a vivir **una sola vez, en el shell**. Al pulsar
uno cambia únicamente el contenido central, que el shell monta desde el
microfrontend que corresponda mediante Module Federation.

## Por qué, con los números que lo justifican

Hoy cada microfrontend pinta su propio menú y su propia cabecera:

- El menú de administración está **duplicado** en `mf-administracion` (95 líneas)
  y `mf-reportes` (119). Ya falló: las dos pantallas de la feature 002 se
  añadieron a una copia y no a la otra, y las entradas desaparecían al entrar en
  Reportes.
- Cambiar de sección **dentro** de un remote tarda 155–232 ms y solo repinta el
  centro. Cambiar **entre** remotes tarda **2 592 ms** y remonta la interfaz
  entera, menú incluido.
- La cortina de transición de 800 ms existía para encubrir ese remontado. Es un
  parche a este problema, no una decisión de diseño.

Además, la **constitución (Principio V)** ya exige que «la autenticación y la
navegación de nivel superior vivan en el shell», el **informe §4** lo afirma, y el
**modelo C4** dibuja un componente `Layout` en el shell descrito como *«Shared
visual structure (header, navigation) that wraps the active remote»*. Esta feature
no cambia ninguno de esos tres documentos: **hace que sean ciertos**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar sin que se remonte la aplicación (Priority: P1)

Quien usa el sistema pulsa una opción del menú y solo cambia el contenido de la
pantalla. El menú no parpadea, no se recarga y no desaparece, sin importar si la
sección que pide la sirve el mismo microfrontend u otro distinto.

**Why this priority**: es el objetivo de la feature y lo que el patrón de Module
Federation propone: un contenedor que aporta el marco y remotos que aportan solo
el contenido. Sin esto, las demás historias no tienen sentido.

**Independent Test**: entrar como administrador, ir de *Canchas* a *Reportes* —que
cruza de `mf-administracion` a `mf-reportes`— y comprobar que el menú lateral no
se remonta, que la opción activa cambia, y que el tiempo hasta ver el contenido
nuevo es del orden del que hoy tarda un cambio dentro del mismo remote.

**Acceptance Scenarios**:

1. **Given** un administrador en *Canchas*, **When** pulsa *Reportes*, **Then** ve
   el contenido de reportes y el menú lateral permanece montado, con *Reportes*
   marcado como activo.
2. **Given** un administrador en cualquier sección, **When** recorre las siete
   opciones del menú, **Then** las siete cargan su contenido y en ninguna
   desaparece una opción del menú.
3. **Given** un usuario final, **When** navega entre *Mis Reservas* y
   *Disponibilidad*, **Then** ve su propio menú —el del socio, no el de
   administración— y solo cambia el centro.
4. **Given** un usuario final en móvil, **When** navega, **Then** conserva la
   barra inferior con su acción de *Nueva*, y el administrador conserva su
   cabecera con el menú desplegable.
5. **Given** cualquier usuario, **When** entra a *Perfil*, **Then** el menú sigue
   visible: hoy desaparece, porque `/perfil` es una ruta del shell y el chrome
   vivía en los remotes.

### User Story 2 - Una sola copia del menú (Priority: P2)

Quien añade, quita o renombra una entrada del menú toca **un solo archivo**, y el
cambio se ve en todas las secciones.

**Why this priority**: es el fallo concreto que esta feature elimina. Depende de
la Historia 1 y se verifica sola.

**Independent Test**: buscar en todo `frontend/` las definiciones de la lista de
navegación; debe haber exactamente una, en el shell.

**Acceptance Scenarios**:

1. **Given** el código del frontend, **When** se busca dónde se define el menú,
   **Then** aparece una sola definición, en `frontend/shell/src/`.
2. **Given** los tres microfrontends, **When** se revisa su código, **Then**
   ninguno contiene menú, cabecera ni barra lateral: solo sus páginas.
3. **Given** los tres microfrontends, **When** se revisa su código, **Then** no
   queda ninguna cortina de transición, porque ya no hay remontado que encubrir.

### User Story 3 - El modelo y el informe describen esto (Priority: P3)

El modelo C4 y el informe siguen siendo ciertos después del cambio, y donde antes
adelantaban lo que debía ser, ahora describen lo que es.

**Why this priority**: es la compuerta 9 de la constitución. Va al final porque
solo se puede cerrar cuando el código ya está.

**Independent Test**: leer §4 del informe y la vista 09 del modelo, y contrastar
con `frontend/shell/src/`.

**Acceptance Scenarios**:

1. **Given** la vista 09 del modelo C4, **When** se compara con el código del
   shell, **Then** cada componente dibujado existe y hace lo que la caja dice.
2. **Given** §4 del informe, **When** se lee el reparto de responsabilidades entre
   shell y remotos, **Then** describe el sistema tal como queda tras esta feature.

### Edge Cases

- **`/reservas/nueva`**: sigue abriéndose a pantalla completa, sin menú, porque es
  un flujo transaccional y así está diseñado. El shell mantiene una lista
  explícita de rutas sin chrome, hoy con esa única entrada.
- **`/login`**: sin menú, como ahora. No hay sesión y por tanto no hay menú que
  pintar.
- **Un remote que no carga**: el shell mantiene el menú y degrada solo el centro
  con su `ErrorBoundary`. Hoy se pierde la pantalla entera, porque el menú venía
  dentro del remote que falló. Es una mejora derivada, no buscada.
- **Un rol sin sesión llega a una ruta con chrome**: el guardia de rol lo redirige
  antes de pintar nada, igual que hoy.

## Requirements *(mandatory)*

La numeración continúa la de 002, que llegó a FR-056.

- **FR-057**: El shell MUST renderizar el menú de navegación y la cabecera, una
  sola vez, y mantenerlos montados mientras cambia la sección.
- **FR-058**: El shell MUST elegir el menú según el rol de la sesión: el del socio
  para `USUARIO_FINAL` y el de administración para `ADMINISTRADOR`, conservando en
  móvil la barra inferior del socio y la cabecera desplegable del administrador.
- **FR-059**: Al pulsar una entrada del menú, el sistema MUST reemplazar
  únicamente el contenido central, incluso cuando la sección de destino la sirva
  un microfrontend distinto del que sirve la actual.
- **FR-060**: Ningún microfrontend MUST contener menú, cabecera ni barra lateral;
  cada uno expone únicamente sus páginas y sigue siendo dueño de sus rutas
  internas.
- **FR-061**: La definición de las entradas del menú MUST existir en un único
  lugar del código.
- **FR-062**: El shell MUST mantener una lista explícita de rutas que se muestran
  sin chrome, y `/reservas/nueva` MUST estar en ella para conservar su diseño a
  pantalla completa.
- **FR-063**: El sistema MUST NOT conservar ninguna transición que encubra el
  remontado de la interfaz, por haber dejado de existir el remontado.
- **FR-064**: El modelo C4 y §4 del informe MUST describir el reparto resultante,
  y las figuras afectadas MUST regenerarse.

### Key Entities

Ninguna. No se toca backend, ni esquema, ni contratos de API.

## Success Criteria *(mandatory)*

La numeración continúa la de 002, que llegó a SC-013.

- **SC-014**: Ir de una sección a otra servida por un microfrontend distinto no
  remonta el menú, y el contenido nuevo aparece en un tiempo del mismo orden que
  un cambio dentro del mismo microfrontend, frente a los 2 592 ms actuales.
- **SC-015**: Existe **una sola** definición de las entradas del menú en todo
  `frontend/`, y está en el shell.
- **SC-016**: Los cuatro paquetes del frontend compilan por separado y cada
  microfrontend sigue desplegándose de forma independiente, sin compilar el shell
  ni los otros.
- **SC-017**: Las siete opciones del administrador y las dos del socio llegan a su
  pantalla, con el menú completo en todas y sin errores de consola.
- **SC-018**: No queda ninguna cortina de transición en el código del frontend.

## Trazabilidad

| Historia | Origen | Artefactos |
| --- | --- | --- |
| US1 — Navegar sin remontar (P1) | Principio V; patrón de Module Federation | `frontend/shell/`, los tres remotes |
| US2 — Una sola copia del menú (P2) | El fallo de la feature 002 | `frontend/*/src/components/` |
| US3 — Modelo e informe ciertos (P3) | Compuerta 9 | `diagramas/workspace.dsl`, `informe/`, `diapositivas/` |

**La constitución no se enmienda.** Su Principio V ya exige lo que esta feature
construye; hasta ahora el código no lo cumplía.

## Assumptions

- **El shell puede pintar el chrome con el mismo diseño**: ya carga Tailwind y
  define exactamente los mismos tokens de color que los remotes, verificado
  comparando ambos `App.css`. No hay que mover estilos.
- **La sesión ya está en el shell**: `useAuth()` le da identidad, rol y `logout`,
  que es todo lo que el menú necesita. El `Layout` actual de los remotes recibe
  `sesion` y ni siquiera la usa.
- **Cada remote sigue siendo dueño de sus rutas**: el shell monta el `App` del
  remote y este resuelve sus subrutas, como hoy.
- **No cambia ningún contrato de API, ni el backend, ni el compose.**
