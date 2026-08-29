---
description: "Task list for feature 002 — cierre de las brechas de la auditoría de alcance"
---

# Tasks: Cierre de las brechas de la auditoría de alcance

**Input**: Design documents from `/specs/002-brechas-auditoria-alcance/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [contracts/](./contracts/)

**Tests**: **Obligatorios para la Historia 2.** El Principio II de la constitución exige prueba para
lo que toca una regla de negocio, y la Historia 2 cambia cómo se obtiene el parámetro de RN-06. La
Historia 1 no lleva prueba automatizada: no añade lógica, consume un endpoint ya probado en 001 y su
verificación es de pantalla.

**Numeración**: continúa la de la feature 001, que llegó a **T134**. En el proyecto no hay dos
tareas con el mismo identificador, igual que con FR y SC.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia pertenece (US1, US2)
- Toda tarea lleva su ruta exacta

## Path Conventions

Las del repositorio, ya establecidas en 001: `backend/<servicio>/src/main/java/com/ups/reservacanchas/<dominio>/`
para el backend hexagonal, `frontend/<remote>/src/` para los microfrontends.

---

## Phase 1: Setup (Shared Infrastructure)

**No aplica.** No hay proyecto que inicializar, dependencia que añadir ni contenedor que levantar:
esta feature trabaja sobre el sistema que 001 dejó corriendo. `docker-compose.yml` no se toca.

---

## Phase 2: Foundational (Blocking Prerequisites)

**No aplica.** Las dos historias son independientes entre sí y no comparten ni un archivo, así que
nada bloquea a nada. Se pueden hacer en cualquier orden o en paralelo por dos personas.

---

## Phase 3: User Story 1 — Consultar disponibilidad como administrador (P1) 🎯 MVP

**Goal**: El administrador ve los bloques libres y ocupados de una cancha para una fecha, sin poder
reservar. Cierra FR-007 de 001, especificado y nunca implementado.

**Independent Test**: Entrar como administrador, abrir la consulta de disponibilidad, elegir una
cancha con reservas confirmadas y ver sus bloques; comprobar que coinciden con los que ve un usuario
final para esa misma cancha y fecha, y que no hay ninguna acción de reservar.

**Solo frontend.** El backend ya cumple: `GET /api/reservas/disponibilidad` no comprueba rol
(verificado en la auditoría). Sin contrato nuevo, sin migración y sin trabajo de compuerta 9.

### Implementation for User Story 1

- [X] T135 [P] [US1] Añadir a `frontend/mf-administracion/src/api/client.ts` el tipo `Disponibilidad` y la función `consultarDisponibilidad(canchaId, fecha)` contra `GET /api/reservas/disponibilidad`, según el `DisponibilidadResponse` de `specs/001-reserva-canchas-deportivas/contracts/reservas.yaml`
- [X] T136 [US1] Crear `frontend/mf-administracion/src/pages/Disponibilidad.tsx`: selector de cancha y de fecha, y la grilla de bloques con sus estados libre / ocupado / mantenimiento (FR-049, FR-050). **Adaptada de `frontend/mf-reservas/src/pages/Disponibilidad.tsx`, no copiada**: sin el botón "Reservar" ni el `navigate('/reservas/nueva')`, porque §3.1 no atribuye al administrador la creación de reservas (FR-051)
- [X] T137 [US1] Registrar la ruta `disponibilidad` en `frontend/mf-administracion/src/App.tsx` dentro del `Layout`, y su entrada en `navItems` de `frontend/mf-administracion/src/components/Layout.tsx`
- [X] T138 [US1] Verificar SC-011: con sesión de administrador y sesión de usuario final abiertas a la vez, comprobar en **al menos 3 combinaciones** de cancha y fecha que ambas ven los mismos bloques y los mismos estados, incluida una cancha con bloqueo de mantenimiento vigente (esc. 4)
- [X] T139 [US1] Verificar FR-051 y la compuerta 8: la pantalla no ofrece ninguna acción de creación, y lo que muestra viene de la base a través del gateway, sin datos fijos

**Checkpoint**: la Historia 1 funciona sola. La fila "Consultar disponibilidad · Administrador: Sí"
de §3.1 pasa a ser cierta en la interfaz, y §4 del informe deja de afirmar algo que el sistema no
permitía.

---

## Phase 4: User Story 2 — Configurar el tope de reservas activas (P2)

**Goal**: El administrador lee y cambia el tope de RN-06 desde la interfaz, y el valor nuevo rige
sin reiniciar nada.

**Independent Test**: Leer el tope vigente, bajarlo a 1, intentar crear una segunda reserva activa
con un usuario final y ser rechazado citando el tope nuevo, devolverlo a 3 y comprobar que la misma
reserva ahora se confirma.

**Backend primero, pantalla después**: el Principio VI exige el contrato publicado antes de que la
pantalla lo consuma.

### Backend — `ms-reservas`

- [X] T140 [US2] Añadir a `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/port/out/ConfigurationRepositoryPort.java` el método de escritura del par clave/valor, e implementarlo en `adapter/out/persistence/ConfigurationRepositoryAdapter.java`
- [X] T141 [US2] Crear `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/port/in/ConfigurationUseCase.java` con leer y cambiar el tope
- [X] T142 [US2] Implementar `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/ConfigurationService.java`: lectura (FR-052), cambio (FR-053), rechazo de un tope que no sea entero ≥ 1 dejando vigente el anterior (FR-054), y exigencia de rol ADMINISTRADOR lanzando `ForbiddenOperationException` de `domain/exception/` (FR-056), que el `ErrorHandler` ya traduce a 403
- [X] T143 [P] [US2] Crear `backend/ms-reservas/src/test/java/com/ups/reservacanchas/reservas/application/service/ConfigurationServiceTest.java` con `ConfigurationRepositoryPort` mockeado, siguiendo el patrón de `BookingServiceCreacionTest`: lectura del valor vigente, cambio válido, rechazo por rol de usuario final, y rechazo de 0, negativo y no entero
- [X] T144 [P] [US2] Añadir a `backend/ms-reservas/src/test/java/com/ups/reservacanchas/reservas/application/service/BookingServiceCreacionTest.java` el caso de FR-055: con un usuario que ya tiene 3 reservas activas y el tope recién bajado a 1, las 3 siguen confirmadas y la creación de una cuarta se rechaza citando el tope nuevo. **El tope se evalúa al crear, nunca retroactivamente**
- [X] T145 [US2] Implementar `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/adapter/in/web/ConfigurationController.java` con `GET` y `PUT /api/reservas/configuracion`, tomando el rol de `X-User-Role`, según [contracts/reservas-configuracion.yaml](./contracts/reservas-configuracion.yaml)
- [X] T146 [US2] Verificar la compuerta 6: el Swagger UI de `ms-reservas` en `/swagger-ui.html` publica el recurso nuevo con sus códigos 400, 401 y 403, y coincide con el contrato escrito

### Frontend — `mf-administracion`

- [X] T147 [P] [US2] Añadir a `frontend/mf-administracion/src/api/client.ts` el tipo `Configuracion` y las funciones de lectura y cambio del tope contra `/api/reservas/configuracion`
- [X] T148 [US2] Crear `frontend/mf-administracion/src/pages/Configuracion.tsx`: muestra el tope vigente y permite cambiarlo, mostrando el mensaje de error del backend cuando el valor no es admitido (FR-054)
- [X] T149 [US2] Registrar la ruta `configuracion` en `frontend/mf-administracion/src/App.tsx` y su entrada en `navItems` de `frontend/mf-administracion/src/components/Layout.tsx`

### Compuerta 9 — diagrama e informe, dentro del recorrido

- [X] T150 [US2] Añadir a la vista 03 de `diagramas/workspace.dsl` los tres componentes nuevos de `ms-reservas` con sus tags: `ConfigurationController` (`Adapter-In`), `ConfigurationUseCase` (`Port`) y `ConfigurationService` (`Application`), con sus relaciones hacia `ConfigurationRepositoryPort`
- [X] T151 [US2] Reexportar los diagramas y regenerar `informe/figuras/componentes-reservas.pdf` con `diagramas/start.sh` y `node diagramas/exportar.js`
- [X] T152 [US2] Añadir el puerto de configuración a `informe/secciones/04-arquitectura.tex`, en el párrafo que hoy enumera solo `CourtClientPort`, `ConfigurationRepositoryPort` y `BookingRepositoryPort` como puertos de lectura, y recompilar el informe

### Verificación de la historia

- [X] T153 [US2] Verificar SC-012 de punta a punta y sin reiniciar ningún servicio: bajar el tope a 1, ver el rechazo citando el valor nuevo, devolverlo a 3 y ver la misma reserva confirmarse
- [X] T154 [US2] Verificar SC-013: tras reducir el tope por debajo de las reservas activas de un usuario, el 100% de esas reservas sigue confirmada y ocupando su bloque

**Checkpoint**: las dos historias funcionan de forma independiente. RN-06 pasa de "configurable
según el documento" a configurable y demostrable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T155 Verificar que un arranque desde cero (`docker compose down -v && docker compose up -d --wait`) deja `max_reservas_activas = 3` por el seed de `V2__configuracion.sql`, que es lo que hace repetible la demostración de la Historia 2
- [X] T156 [P] Verificar la compuerta 4 sobre las clases nuevas: `ConfigurationService` sin ningún import de `adapter/`, y `ForbiddenOperationException` sin `HttpStatus`
- [X] T157 [P] Verificar la compuerta 2 y el Principio V: `npm run build` en verde dentro de `frontend/mf-administracion` **sin** compilar el shell ni los otros dos remotes
- [X] T158 Actualizar `docs/AUDITORIA-ALCANCE.md` marcando cerradas las dos brechas, con la fecha y el commit que las cierra
- [X] T159 Revisar si la entrega necesita reflejar esta feature. **Revisado:** §4 del informe se actualizó por la compuerta 9 (T152) y se recompiló; la figura del respaldo de `diapositivas/` se regeneró y el deck se recompiló. Las cifras de la lámina 2 —48 FR, 31 escenarios, 10 criterios, 134 tareas— **siguen siendo ciertas**, porque describen la feature 001 y 001 no se reabrió. Queda a decisión del equipo añadir una lámina de respaldo sobre la auditoría; no se toca el cuerpo de 7:30

---

## Dependencies & Execution Order

### Phase Dependencies

- Fases 1 y 2: vacías. No bloquean nada.
- Fase 3 (US1) y Fase 4 (US2): **independientes entre sí**. No comparten ningún archivo.
- Fase 5: después de las dos historias.

### Within Each User Story

- **US1**: T135 antes que T136 (la pantalla usa el cliente). T137 después de T136. T138 y T139 al final.
- **US2**: T140 → T141 → T142 → T145 en el backend, en ese orden. T143 y T144 pueden escribirse en
  paralelo a T142. El frontend (T147 a T149) va **después de T146**: el contrato publicado antes que
  la pantalla que lo consume, por el Principio VI. La compuerta 9 (T150 a T152) y la verificación
  (T153, T154) cierran la historia.

### Parallel Opportunities

- Las dos historias completas, si son dos personas: una en `mf-administracion` para US1 y otra en
  `ms-reservas` para US2. **Cuidado**: ambas acaban tocando `src/api/client.ts`, `src/App.tsx` y
  `src/components/Layout.tsx` de `mf-administracion` (T135/T147, T137/T149). Conviene que la misma
  persona haga los dos toques del frontend, o secuenciarlos.
- Dentro de US2: T143 y T144 son archivos distintos y van en paralelo.

## Parallel Example: User Story 2

```text
# Las dos pruebas se pueden escribir a la vez, en archivos distintos:
T143  ConfigurationServiceTest.java     (nuevo)
T144  BookingServiceCreacionTest.java   (se amplía)
```

## Implementation Strategy

### MVP First (User Story 1)

US1 sola ya entrega valor y cierra la brecha con consecuencia documental: es la que hace verdadera
una frase que el informe (E1) ya afirma. Son cinco tareas de frontend, sin backend.

### Incremental Delivery

1. US1 → se demuestra, se entrega. La fila de §3.1 queda cumplida.
2. US2 → se demuestra, se entrega. RN-06 queda demostrable.
3. Fase 5 → cierre de auditoría y decisión sobre la documentación de entrega.

## Notes

- **Ninguna tarea toca `frontend/shell`.** `RoleRoute` se queda como está: la disponibilidad del
  administrador vive en su propio remote. El porqué, en R-011.
- **Ninguna tarea añade una migración.** La tabla `configuracion` y su fila existen desde
  `V2__configuracion.sql` de 001.
- **Ninguna tarea toca las cuatro historias de 001 ni sus 134 tareas cerradas.**
