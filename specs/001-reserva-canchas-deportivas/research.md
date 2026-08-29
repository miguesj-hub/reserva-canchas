# Research: Sistema de Reserva de Canchas Deportivas

**Fase 0** · 2026-08-24 · Entrada de [plan.md](./plan.md)

## Lo que no se investigó, porque ya estaba decidido

Esta fase no parte de cero. Las decisiones estructurales del proyecto están tomadas y registradas, y
reabrirlas sería una enmienda a la constitución, no una tarea de planificación:

| Área | Dónde está decidido |
|---|---|
| Versiones, dependencias por servicio, puertos | `backend/STACK.md` |
| Estructura interna de cada microservicio (hexagonal, paquetes, nombres) | `template-backend/ARQUITECTURA.md` |
| Contenedores, relaciones y despliegue | `diagramas/workspace.dsl` |
| Autenticación básica con roles, sin OAuth2 ni JWT | Alcance §4.4 · constitución, Restricciones Técnicas |
| Independencia de datos, `ms-reportes` sin base | Alcance §4.3 · constitución, Principio IV |
| Edge de origen único, aislamiento por credenciales, Flyway con `validate` | Constitución, Restricciones Técnicas |
| El gateway sin arquitectura hexagonal | Constitución, Principio III |

Lo que sí estaba abierto es el **encaje entre el frontend que ya existe y los contratos que todavía
no existen**. Son nueve decisiones y se resuelven todas aquí. Ninguna requiere investigación externa:
son elecciones de diseño sobre código que está a la vista.

---

## R-001 — Vocabulario de roles

**Contexto**: `frontend/shell/src/auth/AuthContext.tsx:12` declara `type Role = 'admin' | 'cliente'`,
y `RoleRoute.tsx` enruta por esos dos valores. El alcance §3.1 habla de **Usuario Final** y
**Administrador**. Hay dos vocabularios para lo mismo.

**Decisión**: el valor canónico, en la base de datos y en el contrato, es `USUARIO_FINAL` y
`ADMINISTRADOR`. El frontend renombra su unión `Role` a esos dos valores. Las rutas del navegador
(`/reservas`, `/administracion`, `/reportes`) no cambian: son rutas, no roles.

**Impacto**: tres archivos del shell —`AuthContext.tsx`, `RoleRoute.tsx`, `App.tsx`— y la cabecera
`X-User-Role` que el gateway propaga.

**Rationale**: el evaluador califica contra §3.1. Que el rol se llame igual en la pantalla, en el
contrato y en la tabla elimina una traducción mental en la defensa y una clase entera de errores
donde un lado compara con `'admin'` y el otro con `'ADMINISTRADOR'`. Es además lo que pide el
Principio I: el vocabulario del alcance es el vocabulario del sistema.

**Alternativas descartadas**:
- *Mantener `cliente`/`admin` en el contrato*: más corto de escribir, pero obliga a explicar en la
  defensa por qué el sistema llama "cliente" a lo que el alcance llama Usuario Final.
- *Traducir en el frontend*: una capa de mapeo que existe solo para sostener dos nombres del mismo
  concepto. Complejidad sin criterio de rúbrica que la respalde.

---

## R-002 — Cómo llega la identidad del shell a los remotes

**Contexto**: `frontend/shell/src/App.tsx` pasa `token={token ?? ''}` como prop a los tres remotes.
Ese token es hoy la cadena `mock-jwt-<rol>-<timestamp>` que fabrica el mock. Al mismo tiempo, la
arquitectura dice que la identidad la propaga el gateway por `X-User-Id` y `X-User-Role`. Hay que
reconciliar las dos cosas.

**Decisión**: separar los dos usos que hoy están mezclados en una sola prop.

1. **Para pintar la pantalla**, el shell pasa a cada remote una prop `sesion` con
   `{ usuarioId, nombre, rol }`. Es lo que el remote necesita para saludar al usuario, filtrar "mis
   reservas" y ocultar controles que su rol no puede usar.
2. **Para autenticar la petición**, ningún remote recibe la credencial como prop. El cliente HTTP
   adjunta la cabecera `Authorization` leyéndola de `localStorage`, donde el shell la dejó al
   iniciar sesión. Los remotes se ejecutan dentro de la página del shell, en el mismo origen que
   unifica el edge, así que comparten `localStorage` sin necesidad de pasarse nada.
3. **La identidad que el backend cree** no es ninguna de las dos: es la que el gateway deduce de la
   credencial y escribe en `X-User-Id` y `X-User-Role`. Lo que el navegador diga sobre quién es no
   llega nunca a un microservicio.

**Rationale**: la prop `token` de hoy invita al error de que un remote la mande en una cabecera y el
backend le crea. Separar "identidad para renderizar" de "credencial para autenticar" hace imposible
esa confusión, y deja explícito que la autoridad sobre la identidad es del gateway. El punto 3 es lo
que sostiene FR-007 del spec: una operación prohibida se rechaza aunque no se pase por la pantalla.

**Alternativas descartadas**:
- *Conservar la prop `token` y que el remote la mande*: acopla cada remote al formato de la
  credencial y rompe el punto 3.
- *Que el shell exponga su `AuthContext` a los remotes por Module Federation*: invierte la dirección
  de la federación (hoy el shell consume, no expone) y crea un acoplamiento de código entre paquetes
  que el Principio V prohíbe.

---

## R-003 — Qué credencial viaja y cómo la verifica el gateway

**Contexto**: §4.4 pide autenticación básica con roles y la constitución prohíbe JWT y OAuth2. El
`AuthenticationFilter` del gateway tiene que identificar al usuario de cada petición.

**Decisión**: autenticación HTTP Basic, verificada por el gateway en cada petición contra
`ms-usuarios`.

- `POST /api/auth/login` recibe las credenciales, `ms-usuarios` las verifica con
  `BCryptPasswordEncoder` y devuelve `{ usuarioId, nombre, rol, estado }`. No emite ningún token: su
  papel es decirle al shell si las credenciales sirven y quién es el usuario, para poder pintar la
  sesión.
- El shell guarda la credencial codificada en `localStorage` y el cliente HTTP la adjunta como
  `Authorization: Basic ...` en cada petición.
- El `AuthenticationFilter` decodifica la cabecera, la verifica contra `ms-usuarios`, y escribe
  `X-User-Id` y `X-User-Role` en la petición que reenvía al microservicio destino.
- **El filtro descarta cualquier cabecera `X-User-*` que venga del cliente antes de escribir la
  suya.** Sin esto, cualquiera se declara administrador con una cabecera y el sistema le cree.
- Una cuenta inactiva falla la verificación: el gateway responde 401 y la petición no llega al
  microservicio (FR-005).

**Rationale**: es la lectura literal de "autenticación básica" de §4.4 y no introduce ninguna pieza
que la rúbrica no pida. No hay almacén de sesiones que mantener ni expiración que gestionar. El
descarte de cabeceras entrantes es la única parte no obvia y es la que hace que la confianza entre
gateway y microservicios sea segura: el microservicio confía en `X-User-Id` porque nadie más puede
escribirla.

**Consecuencia asumida**: cada petición produce una verificación adicional contra `ms-usuarios`. A
la escala de este sistema es irrelevante, pero si SC-008 (disponibilidad en menos de 2 s) no se
cumple por esta causa, la respuesta es una caché en memoria de credenciales verificadas dentro del
gateway, con expiración corta. No se implementa antes de medir.

**Alternativas descartadas**:
- *Token opaco de sesión emitido por `ms-usuarios`*: exige almacenar y expirar sesiones. Más piezas
  para el mismo resultado, y se aleja de la letra de §4.4.
- *JWT*: prohibido por la constitución. No suma en ningún criterio de la rúbrica y sí obliga a
  gestionar firma, expiración y rotación.
- *Que cada microservicio autentique por su cuenta*: multiplica por cuatro la lógica de
  autenticación y contradice el papel del gateway en el DSL.

---

## R-004 — Cómo se representa el bloque horario y cómo RN-02 se vuelve inviolable

**Contexto**: la constitución exige que RN-02 se sostenga en una restricción `EXCLUDE` de PostgreSQL
y no solo en un `if` del servicio. Falta decidir la forma concreta de la columna y de la
restricción, y cómo el 409 llega al usuario sin que el dominio sepa de JPA.

**Decisión**:

- La reserva guarda `cancha_id`, `fecha` (date), `hora_inicio` y `hora_fin` (time) y `estado`.
- La restricción se declara sobre una expresión de rango construida al vuelo, y solo alcanza a las
  reservas confirmadas:

  ```sql
  EXCLUDE USING gist (
      cancha_id WITH =,
      tsrange(fecha + hora_inicio, fecha + hora_fin, '[)') WITH &&
  ) WHERE (estado = 'CONFIRMADA')
  ```

- `tsrange` sin zona horaria, porque `date + time` es inmutable y por tanto indexable; una variante
  con zona no lo sería y la migración fallaría al crearse el índice.
- El límite `'[)'` —inicio incluido, fin excluido— hace que una reserva de 10:00–11:00 y otra de
  11:00–12:00 no se consideren solapadas, que es el comportamiento correcto para bloques contiguos.
- El `WHERE estado = 'CONFIRMADA'` es lo que implementa RN-05: al cancelar, la fila deja de
  participar en la restricción y el bloque queda libre, sin borrar nada y conservando la traza que
  RN-08 pide.
- Requiere la extensión `btree_gist` (para poder mezclar `=` sobre `cancha_id` con `&&` sobre el
  rango). Se crea en `infra/postgres/init/02-extensiones.sql`, antes de que Flyway corra.
- **Traducción del error**: `BookingRepositoryAdapter` captura la violación de la restricción y la
  convierte en `SlotAlreadyBookedException`, que es una excepción de `domain/exception/` y no sabe
  nada de HTTP. El `ErrorHandler` de `adapter/in/web/` la traduce a **409**. El dominio nunca ve la
  excepción de la base de datos, y el `BookingService` conserva además su comprobación previa, que
  es la que da el mensaje amable en el caso normal.

**Rationale**: la comprobación previa del servicio resuelve el 99% de los casos con un buen mensaje;
la restricción resuelve el 1% que ninguna comprobación previa puede cubrir, que es cuando dos
transacciones comprueban a la vez y ambas ven el bloque libre. Es exactamente el escenario 5 de la
Historia 1 y lo que mide SC-004. La traducción en dos saltos —infraestructura a dominio, dominio a
HTTP— es lo que mantiene la regla de dependencia del Principio III.

**Alternativas descartadas**:
- *Solo validación en el servicio*: pierde la carrera bajo concurrencia. La rúbrica señala RN-02
  explícitamente; fallarla en vivo es visible y caro.
- *Bloquear la cancha con `SELECT ... FOR UPDATE`*: funciona, pero serializa todas las reservas de
  una cancha y hay que acordarse de tomarlo en cada camino. La restricción no se puede olvidar.
- *Índice único sobre (cancha, fecha, hora_inicio)*: solo detecta bloques idénticos. Si algún día un
  bloque dura 90 minutos, deja de proteger; y no expresa "solapamiento", que es lo que dice RN-02.

---

## R-005 — El panel de KPIs del administrador

**Contexto**: `frontend/mf-administracion/src/pages/Panel.tsx` es la pantalla de inicio del
administrador y muestra cuatro tarjetas con valores fijos: "Total Reservas (Hoy) 142 · +12% vs
ayer", "Ocupación 85% · Horario Pico 18:00–21:00", "Cancelaciones 8 · +2% vs promedio", "Cancha
Principal: Padel Central". §3.2 no lista ninguna pantalla de panel.

**Decisión**: la pantalla se conserva como página de inicio del administrador, pero sus tarjetas
pasan a mostrar **los indicadores de §3.3.5 acotados al día en curso**, consumidos del mismo
contrato de reportes que usa `mf-reportes`. Se eliminan los elementos que no son ninguno de los
cuatro indicadores: las comparaciones contra período anterior ("+12% vs ayer", "+2% vs promedio") y
el "Horario Pico".

**Rationale**: las cuatro tarjetas son, salvo el adorno, los cuatro indicadores del alcance. Con
datos reales el panel deja de ser alcance nuevo y pasa a ser una vista más de §3.3.5. Las
comparaciones contra período anterior sí son alcance nuevo —no están entre los cuatro indicadores— y
además exigirían calcular un segundo período: se van, según el Principio I.

**Alternativas descartadas**:
- *Borrar la pantalla*: el administrador se quedaría sin página de inicio y habría que reescribir su
  navegación. Coste sin ganancia.
- *Dejar los valores fijos*: un número inventado en pantalla durante la defensa es peor que no tener
  la pantalla, y contradice el criterio de rúbrica de "datos consistentes".

---

## R-006 — La pantalla de perfil

**Contexto**: `frontend/shell/src/pages/Perfil.tsx` (208 líneas) ofrece editar la información
personal, con botones de acción y campos de entrada. El spec deja la edición del perfil propio
explícitamente fuera de alcance: no traza a ninguna pantalla de §3.2 ni a ninguna RN.

**Decisión**: la ruta `/perfil` se conserva en modo **solo lectura**: muestra el nombre, el rol y el
estado de la sesión, tomados de la prop `sesion`. Se retiran los controles de edición y la carga de
foto. No se crea ningún endpoint para sostenerla.

**Rationale**: es la aplicación directa del Principio I. Un formulario de edición necesita un
endpoint de actualización de usuario que no aparece en §3.1 ni en §3.2; construirlo es gastar tiempo
en algo que no puntúa. Mostrar quién está conectado, en cambio, no cuesta nada porque el dato ya
está en la sesión.

**Alternativas descartadas**:
- *Implementar la edición*: alcance nuevo, sin criterio de rúbrica que lo respalde.
- *Eliminar la ruta*: el enlace existe en la navegación; quitarlo es más trabajo que dejar la
  pantalla mostrando datos que ya se tienen.

---

## R-007 — Los estados de la reserva

**Contexto**: `frontend/mf-reservas/src/pages/MisReservas.tsx:4` declara
`type Estado = 'confirmada' | 'pasada' | 'cancelada'`. RN-08 fija tres estados: **Confirmada**,
**Cancelada** y **Finalizada**. "Pasada" no es uno de ellos.

**Decisión**: el valor canónico es `CONFIRMADA` · `CANCELADA` · `FINALIZADA`, en la base, en el
contrato y en el frontend. El estado del frontend `'pasada'` se renombra a `FINALIZADA`, junto con
sus etiquetas y sus filtros.

**Rationale**: RN-08 existe "para efectos de trazabilidad y reportes" y es una de las ocho reglas que
la rúbrica califica. Un tercer estado que se llama distinto en pantalla que en la regla es una
observación gratuita en la defensa. Además `FINALIZADA` es lo que consume el reporte de ocupación:
si el nombre no coincide, la inconsistencia se propaga.

**Alternativas descartadas**: ninguna razonable. Es una corrección de vocabulario, no una elección.

---

## R-008 — Los deportes del catálogo

**Contexto**: dos inconsistencias en el frontend. `mf-administracion/src/pages/GestionCanchas.tsx:15`
declara `const filtros = ['Todas', 'Padel', 'Tenis', 'Fútbol']` —fútbol no está en el alcance— y
`mf-reservas/src/pages/Disponibilidad.tsx:20` declara `['Pádel', 'Tenis', 'Basket']`, con el tercer
deporte en otro idioma.

**Decisión**: el catálogo de deportes es cerrado y tiene exactamente tres valores: `PADEL`, `TENIS`,
`BASQUET`. Se elimina "Fútbol" y "Basket" pasa a "Básquet" en pantalla. El valor viaja en el
contrato como enumeración cerrada, de modo que crear una cancha de un deporte no contemplado se
rechaza con 400.

**Rationale**: el título del alcance es "Pádel · Tenis · Básquet" y los criterios de aceptación §7.1
y SC-010 exigen demostrar los tres. Un filtro de fútbol en la pantalla de administración es una
promesa que el sistema no cumple, y es de las cosas que un evaluador prueba justamente porque están
a la vista.

**Alternativas descartadas**:
- *Deporte como texto libre*: permitiría fútbol y cualquier otra cosa, y rompería el reporte de
  reservas por deporte, que necesita agrupar por un valor estable.

---

## R-009 — La ruta `/api/auth` y el modelo C4

**Contexto**: `diagramas/workspace.dsl` describe el gateway ruteando `/api/usuarios`,
`/api/canchas`, `/api/reservas` y `/api/reportes`. La autenticación que R-003 define necesita
`/api/auth/login` y `/api/auth/registro`, que el DSL no contempla. La vista de despliegue tampoco
refleja todavía cómo se materializan las tres bases.

**Decisión**: `/api/auth/**` se rutea a `ms-usuarios`, que es el dueño de las credenciales. En el
modelo, `AuthController` es un adaptador de entrada más de `ms-usuarios`, hermano de
`UserController`, y no un componente nuevo del gateway.

El DSL se actualiza en el mismo cambio que integre la Historia 1, según la compuerta 8 de la
constitución: la ruta `/api/auth` en `RouteConfig`, el `AuthController` en la vista de componentes de
`ms-usuarios`, y la relación del `AuthenticationFilter` con `ms-usuarios` para verificar la
credencial, que hoy no está dibujada.

**Rationale**: separar la autenticación en un servicio propio sería un quinto microservicio que ni el
alcance ni el DSL contemplan. `ms-usuarios` ya es "registro, autenticación y gestión de usuarios y
roles" en el DSL: la ruta nueva cae exactamente dentro de su responsabilidad declarada.

**Alternativas descartadas**:
- *Autenticar en el gateway contra su propia tabla*: le daría al gateway un dominio y una base
  propios, que es justamente lo que la constitución dice que no tiene.
- *Reutilizar `/api/usuarios/login`*: mezcla en un mismo prefijo la gestión de usuarios, que es solo
  del administrador, con el login, que es público. Complica la regla de autorización del gateway sin
  ganar nada.

---

## R-010 — Forma del endpoint de configuración del tope

**Contexto**: la enmienda 1.3.0 de la constitución declara en alcance la configuración del tope de
RN-06 (FR-049 a FR-053). La tabla `configuracion` de `reservas_db` es clave/valor y hoy solo se
lee, desde `BookingService.verificarTope` a través de `ConfigurationRepositoryPort`.

**Decisión**: un recurso propio, `GET /api/reservas/configuracion` y
`PUT /api/reservas/configuracion`, con cuerpo tipado `{ "maxReservasActivas": 3 }`. En el
microservicio entra por un adaptador de entrada nuevo —`ConfigurationController`— y un caso de uso
propio —`ConfigurationUseCase` / `ConfigurationService`—, no colgando de `BookingService`.
`ConfigurationRepositoryPort` gana un método de escritura.

**No hay caché que invalidar**: `BookingService` lee la clave en cada creación de reserva, así que
un cambio del tope rige para la siguiente petición sin reiniciar ni redesplegar nada. Es
exactamente lo que exige FR-050, y es una propiedad del diseño actual, no algo que haya que
construir. Si alguna vez se añade caché a esa lectura, FR-050 pasa a exigir su invalidación.

**Rationale**: exponer un objeto tipado y no el par clave/valor crudo mantiene el contrato honesto
—el frontend no tiene que saber que detrás hay una tabla genérica— y deja sitio para más
parámetros sin abrir rutas nuevas. Separar el caso de uso evita que `BookingService`, que ya
concentra RN-01 a RN-06 y RN-08, cargue además con una responsabilidad de administración.

**Consecuencia sobre la compuerta 9**: `ConfigurationController`, `ConfigurationUseCase` y
`ConfigurationService` son componentes nuevos de `ms-reservas`. Entran en la vista 03 del
`workspace.dsl`, hay que reexportar `componentes-reservas.pdf`, y §4 del informe describe hoy los
puertos de ese servicio sin mencionarlos. Se actualiza en el mismo cambio, no al final.

**Alternativas descartadas**:
- *`PATCH /api/reservas/configuracion/max-reservas-activas`*: una ruta por parámetro multiplica el
  contrato sin ganar nada con un único parámetro.
- *Colgarlo de `BookingUseCase`*: mezcla la política de reservas con la operación de reservar, y
  obliga a que la pantalla de administración consuma el caso de uso del usuario final.
- *Variable de entorno del contenedor*: cambiarla exige redesplegar `ms-reservas`, que es justo lo
  que FR-050 prohíbe.

---

## R-011 — Dónde vive la consulta de disponibilidad del administrador

**Contexto**: FR-007 exige la consulta de disponibilidad para ambos roles desde el principio, pero
solo `mf-reservas` tiene pantalla, y el shell la restringe a `USUARIO_FINAL` con `RoleRoute`. El
backend ya cumple: `GET /api/reservas/disponibilidad` no comprueba rol.

**Decisión**: una pantalla propia en `mf-administracion`, no abrir la de `mf-reservas` a los dos
roles.

**Rationale**: el Principio V prohíbe que un remote importe código de otro, así que reutilizar la
pantalla obligaría a abrir la ruta `/reservas` al administrador entera. Y esa pantalla lleva un
botón "Reservar" que navega a `/reservas/nueva`, contra un endpoint que devuelve 403 al
administrador porque §3.1 no le atribuye crear reservas: sería ofrecer una acción que siempre
falla. La barra de `mf-reservas` muestra además "Mis Reservas", que para un administrador siempre
estaría vacía.

**Alcance real**: la pantalla nueva es de solo lectura y reusa el mismo endpoint. No hay trabajo de
backend, ni contrato nuevo, ni migración.

**Consecuencia sobre la compuerta 9**: ninguna en el DSL. La vista 11 de `mf-administracion` usa
capas genéricas —Vistas, Componentes UI, Estado, ApiClient— y no una caja por pantalla, así que una
pantalla más no cambia el diagrama. El informe ya afirma que el administrador consulta
disponibilidad: con esto pasa a ser cierto.

---

## Resumen de decisiones

| # | Decisión | Toca |
|---|---|---|
| R-001 | Roles canónicos `USUARIO_FINAL` / `ADMINISTRADOR` | shell (3 archivos), contrato, `X-User-Role` |
| R-002 | Prop `sesion` para renderizar; credencial por `localStorage`; identidad real por cabeceras del gateway | shell, los tres remotes |
| R-003 | HTTP Basic verificado por el gateway en cada petición; descarta `X-User-*` entrantes | gateway, `ms-usuarios`, shell |
| R-004 | `EXCLUDE USING gist` con `tsrange` y `WHERE estado = 'CONFIRMADA'`; 409 en dos traducciones | `ms-reservas`, migración V1, `infra/postgres/init` |
| R-005 | El panel del administrador muestra los indicadores reales del día; fuera las comparaciones inventadas | `mf-administracion/Panel.tsx` |
| R-006 | Perfil a solo lectura, sin endpoint nuevo | `shell/pages/Perfil.tsx` |
| R-007 | Estados `CONFIRMADA` / `CANCELADA` / `FINALIZADA` | `mf-reservas`, contrato, esquema |
| R-008 | Deportes `PADEL` / `TENIS` / `BASQUET`, enumeración cerrada | `mf-administracion`, `mf-reservas`, contrato, esquema |
| R-009 | `/api/auth/**` hacia `ms-usuarios`; el DSL se actualiza con la Historia 1 | gateway, `ms-usuarios`, `diagramas/workspace.dsl` |
| R-010 | `GET`/`PUT /api/reservas/configuracion` con cuerpo tipado y caso de uso propio; sin caché que invalidar | `ms-reservas`, contrato, `mf-administracion`, `diagramas/workspace.dsl` |
| R-011 | La disponibilidad del administrador es pantalla propia de `mf-administracion`, no la de `mf-reservas` abierta a dos roles | `mf-administracion`, `shell` |

Sin `NEEDS CLARIFICATION` pendientes.
