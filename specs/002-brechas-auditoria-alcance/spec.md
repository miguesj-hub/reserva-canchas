# Feature Specification: Cierre de las brechas de la auditoría de alcance

**Feature Branch**: `002-brechas-auditoria-alcance`

**Created**: 2026-08-29

**Status**: Draft

**Input**: Hallazgos 1 y 2 de `docs/AUDITORIA-ALCANCE.md` (2026-08-29), la auditoría del sistema
construido en la feature `001-reserva-canchas-deportivas` contra
`Alcance_Funcional_Reserva_Canchas_v2.md`.

## Por qué esta feature existe y no es una enmienda a 001

La feature 001 está entregada: sus 134 tareas están cerradas y sus artefactos son el registro de lo
que se construyó, que es lo que describen el informe (E1) y la presentación (E6). Esta feature no
la corrige por dentro; añade encima lo que la auditoría encontró que faltaba, para que 001 siga
siendo un registro fiel de lo entregado y no un documento reabierto a destiempo.

Las dos brechas tienen origen distinto, y conviene no confundirlas:

- **Historia 1** cierra un requisito que **001 ya había especificado y no implementó**: FR-007 de
  001 exige la consulta de disponibilidad para los dos roles desde el principio. El requisito era
  correcto; lo que faltó fue el escenario de aceptación en la historia del administrador, y sin él
  ninguna tarea lo recogió: las tres tareas que implementan FR-007 en 001 —T064, T072 y T079—
  quedaron todas bajo la historia del usuario final. Esto se dice aquí en vez de esconderse.
- **Historia 2** es **alcance nuevo**, declarado por la enmienda 1.3.0 de la constitución, que
  resuelve como alcance la configuración del tope de RN-06 por traza a la regla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar disponibilidad como administrador (Priority: P1)

El administrador necesita ver qué bloques de una cancha están libres y cuáles ocupados, para una
fecha concreta, sin tener que abrir el listado global de reservas y reconstruirlo mentalmente. Ve
exactamente lo mismo que vería un socio, y no puede reservar: §3.1 no le atribuye la creación de
reservas.

**Why this priority**: cierra un requisito ya especificado y no implementado, y una fila de la
tabla de permisos §3.1 que hoy el sistema promete y no cumple. Es además la brecha con consecuencia
documental: §4 del informe (E1) ya afirma que el administrador consulta disponibilidad, de modo que
mientras no se implemente, el entregable describe algo que la interfaz no permite.

**Independent Test**: Se demuestra sola, sin la Historia 2: entrar como administrador, abrir la
consulta de disponibilidad, elegir una cancha y una fecha con reservas confirmadas, y ver los
bloques libres y ocupados; comprobar que la pantalla no ofrece ninguna acción de reservar y que los
mismos bloques coinciden con los que ve un usuario final para esa cancha y fecha.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** consulta la disponibilidad de una cancha activa
   para una fecha, **Then** ve todos los bloques del horario de atención de esa cancha, cada uno
   marcado como libre, ocupado o en mantenimiento.
2. **Given** la misma cancha y fecha consultadas por un usuario final, **When** el administrador
   consulta esa combinación, **Then** ve exactamente los mismos bloques y los mismos estados.
3. **Given** un administrador viendo la disponibilidad, **When** revisa la pantalla, **Then** no
   encuentra ninguna acción que le permita crear una reserva, porque §3.1 atribuye la creación solo
   al usuario final.
4. **Given** una cancha con un bloqueo de mantenimiento vigente, **When** el administrador consulta
   su disponibilidad, **Then** los bloques comprendidos aparecen como no reservables.

---

### User Story 2 - Configurar el tope de reservas activas (Priority: P2)

El administrador consulta cuántas reservas activas simultáneas puede tener un usuario final y
cambia ese número cuando la política del club cambia. El valor nuevo rige para las reservas que se
creen a partir de ese momento, sin reiniciar ni redesplegar nada.

**Why this priority**: RN-06 exige que el límite sea "configurable" y hoy solo se cambia con un
`UPDATE` a mano sobre la tabla `configuracion`. La enmienda 1.3.0 de la constitución lo declaró en
alcance por traza a la regla, con el mismo criterio con el que 001 declaró la gestión de usuarios.
Va después de la Historia 1 porque no arrastra consecuencia documental: sin ella RN-06 se sigue
cumpliendo con su valor por defecto.

**Independent Test**: Se demuestra sola: leer el tope vigente, bajarlo a 1, intentar crear una
segunda reserva activa con un usuario final y ser rechazado citando el tope nuevo, devolverlo a 3 y
comprobar que la misma reserva ahora se confirma, todo sin reiniciar ningún servicio.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la configuración de reservas, **Then** ve
   el tope de reservas activas simultáneas vigente en el sistema.
2. **Given** un tope vigente de 3, **When** el administrador lo cambia a 1, **Then** el sistema
   confirma el cambio y un usuario final con una reserva activa que intenta crear otra es rechazado
   indicando que el tope es 1 y que ya tiene 1 activa (RN-06).
3. **Given** un tope recién reducido a 1 y un usuario final que ya tenía 3 reservas activas,
   **When** se consultan sus reservas, **Then** las 3 se conservan confirmadas y siguen ocupando
   sus bloques: el tope se evalúa al crear, no retroactivamente.
4. **Given** un administrador autenticado, **When** intenta fijar un tope de 0, negativo o no
   entero, **Then** el sistema rechaza el cambio, explica el valor admitido, y el tope anterior
   sigue vigente.
5. **Given** un usuario final autenticado, **When** intenta consultar o modificar el tope, **Then**
   el sistema se lo impide por falta de permiso.

---

### Edge Cases

- **Tope reducido por debajo de lo que algún usuario ya tiene**: sus reservas se conservan y siguen
  ocupando sus bloques. El tope se evalúa al crear una reserva, nunca sobre las ya confirmadas; ese
  usuario simplemente no puede crear más hasta bajar del nuevo tope.
- **El administrador consulta la disponibilidad de una cancha inactiva**: se comporta igual que
  para un usuario final; la cancha inactiva no se ofrece en el selector.
- **Dos administradores cambian el tope a la vez**: gana el último en escribir. No se añade control
  de concurrencia: es un parámetro único que cambia de forma excepcional y cuyo valor vigente
  siempre se puede volver a consultar.
- **El tope queda en un valor raro tras una demostración**: un arranque desde cero
  (`docker compose down -v`) devuelve `max_reservas_activas` a 3 con el seed.

## Requirements *(mandatory)*

### Functional Requirements

La numeración sigue la de 001, que llegó a FR-048, para que no haya dos requisitos con el mismo
identificador en el proyecto.

**Consulta de disponibilidad del administrador (§3.1, cierra FR-007 de 001)**

- **FR-049**: Un administrador autenticado MUST poder consultar la disponibilidad de una cancha
  para una fecha, con el mismo resultado que obtiene un usuario final para esa combinación.
- **FR-050**: La consulta del administrador MUST presentar los bloques comprendidos en un bloqueo
  de mantenimiento como no reservables, igual que la del usuario final.
- **FR-051**: La interfaz del administrador MUST NOT ofrecer ninguna acción de creación de reservas
  desde la consulta de disponibilidad, porque §3.1 atribuye la creación solo al usuario final.

**Configuración del tope de reservas activas (RN-06, constitución 1.3.0)**

- **FR-052**: Un administrador MUST poder consultar el valor vigente del tope de reservas activas
  simultáneas de un usuario final.
- **FR-053**: Un administrador MUST poder cambiar ese tope, y el valor nuevo MUST regir para las
  reservas que se creen a partir de ese momento, sin reiniciar ningún servicio ni redesplegar.
- **FR-054**: El sistema MUST rechazar un tope que no sea un entero mayor o igual a 1, explicando el
  valor admitido y dejando vigente el anterior.
- **FR-055**: El sistema MUST conservar las reservas activas que superen un tope recién reducido: el
  tope se evalúa al crear una reserva y nunca retroactivamente.
- **FR-056**: El sistema MUST impedir que un usuario final consulte o modifique el tope.

### Key Entities

No hay entidades nuevas. La tabla `configuracion` de `reservas_db`, con su única fila
`max_reservas_activas`, existe desde la migración `V2__configuracion.sql` de 001. Esta feature no
cambia su esquema: cambia que su valor deja de ser de solo lectura. No hay migración nueva.

## Success Criteria *(mandatory)*

### Measurable Outcomes

La numeración sigue la de 001, que llegó a SC-010.

- **SC-011**: Un administrador obtiene, para una cancha y fecha con reservas confirmadas, la misma
  lista de bloques y los mismos estados que un usuario final, verificado en al menos 3
  combinaciones distintas de cancha y fecha.
- **SC-012**: Un cambio del tope de reservas activas hecho desde la interfaz de administración rige
  para la siguiente reserva que se intente crear, sin reiniciar ningún servicio, y el mensaje de
  rechazo cita el valor nuevo.
- **SC-013**: Tras reducir el tope por debajo de las reservas activas de un usuario, el 100% de esas
  reservas sigue confirmada y ocupando su bloque.

## Trazabilidad

| Historia | Origen | Funcionalidades §3 | Reglas de negocio |
| --- | --- | --- | --- |
| US1 — Disponibilidad del administrador (P1) | FR-007 de 001, especificado y no implementado | §3.1 fila "Consultar disponibilidad", §3.3.1 | — |
| US2 — Configuración del tope (P2) | Constitución 1.3.0 | RN-06 vía traza a la regla | RN-06 |

| Requisito | Dónde se verifica |
| --- | --- |
| FR-049, FR-050 | US1 esc. 1, 2 y 4; SC-011 |
| FR-051 | US1 esc. 3 |
| FR-052 | US2 esc. 1 |
| FR-053 | US2 esc. 2; SC-012 |
| FR-054 | US2 esc. 4 |
| FR-055 | US2 esc. 3; SC-013; Edge Cases |
| FR-056 | US2 esc. 5 |

## Assumptions

- **El backend de la disponibilidad ya cumple**: `GET /api/reservas/disponibilidad` no comprueba
  rol, de modo que la Historia 1 no necesita trabajo de servicio, contrato ni migración. Verificado
  en la auditoría.
- **El tope se lee en cada creación de reserva**, sin caché intermedia, de modo que un cambio rige
  para la petición siguiente. Es una propiedad del diseño actual de 001, no algo que esta feature
  construya. Si alguna vez se añade caché a esa lectura, FR-053 pasa a exigir su invalidación.
- **Los dos roles y su propagación no cambian**: la identidad sigue llegando en `X-User-Id` y
  `X-User-Role`, escritas por el gateway.
- **No se toca ninguna de las cuatro historias de 001** ni sus 134 tareas cerradas.
