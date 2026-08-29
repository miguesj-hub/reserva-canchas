# Implementation Plan: Cierre de las brechas de la auditoría de alcance

**Branch**: `fix/brechas-auditoria-alcance` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-brechas-auditoria-alcance/spec.md`

## Summary

Dos brechas encontradas por `docs/AUDITORIA-ALCANCE.md`, con costes muy distintos:

- **Historia 1 — disponibilidad del administrador**: es **solo frontend**. El backend ya cumple:
  `GET /api/reservas/disponibilidad` no comprueba rol, así que cualquier usuario autenticado lo
  consulta. Lo que falta es una pantalla en `mf-administracion`. Sin trabajo de servicio, sin
  contrato nuevo, sin migración y sin cambio en el modelo C4.
- **Historia 2 — configuración del tope de RN-06**: es una rebanada vertical corta. `ms-reservas`
  gana un adaptador de entrada y un caso de uso propios, `ConfigurationRepositoryPort` gana su
  método de escritura, el contrato gana un recurso, y `mf-administracion` una pantalla. Tampoco hay
  migración: la tabla `configuracion` y su fila existen desde 001.

El porqué de las dos decisiones de diseño está en [research.md](./research.md) (R-010 y R-011).

## Technical Context

**Language/Version**: Java 21 (backend), TypeScript 5 sobre React 19 (frontend). Sin cambios
respecto de 001; las versiones exactas están en `backend/STACK.md`.

**Primary Dependencies**: Spring Boot 4.0.8, springdoc-openapi 3.0.2, Rsbuild con
`@module-federation/rsbuild-plugin`. No se añade ninguna dependencia nueva en ninguno de los dos
lados: es una restricción del Principio "Regla de dependencias nuevas" de la constitución y esta
feature no necesita romperla.

**Storage**: PostgreSQL 16, `reservas_db`. Tabla `configuracion`, ya existente. **Sin migración
nueva**: no cambia ni una columna.

**Testing**: JUnit 5 con Mockito para el caso de uso nuevo, siguiendo el patrón de
`BookingServiceCreacionTest`: puerto de salida mockeado, sin Spring ni base de datos. `npm run build`
por remote tocado.

**Target Platform**: Docker Compose local, los mismos once contenedores de 001. No se añade ni se
quita ninguno.

**Project Type**: Web, microfrontends sobre microservicios. Sin cambios estructurales.

**Performance Goals**: los de 001. Ninguna de las dos historias entra en un camino caliente: la
consulta de disponibilidad del administrador es el mismo endpoint ya medido por SC-008, y la
configuración del tope se lee una vez por creación de reserva, como ya ocurre hoy.

**Constraints**: el cambio de tope tiene que regir **sin reiniciar ni redesplegar** (FR-053). Se
cumple por el diseño actual, que lee la clave en cada creación; ver R-010.

**Scale/Scope**: 2 pantallas nuevas en `mf-administracion`, 3 clases nuevas y 1 método de puerto en
`ms-reservas`, 2 operaciones nuevas en un contrato. Cero migraciones.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` **v1.3.0**.

| # | Principio | Cómo lo satisface este plan | Estado |
|---|---|---|---|
| I | Alcance cerrado y trazable | La Historia 1 traza a la fila "Consultar disponibilidad" de §3.1 y cierra FR-007 de 001. La Historia 2 traza a RN-06 por la vía que abre la enmienda 1.3.0, que la declara explícitamente en alcance. No se construye nada más. | PASA |
| II | Reglas de negocio en el dominio, con prueba | RN-06 sigue viviendo en `BookingService.verificarTope`; esta feature no la mueve ni la duplica: solo hace escribible el parámetro que ya leía. El caso de uso nuevo lleva su prueba con el puerto mockeado. | PASA |
| III | Regla de dependencia hexagonal | `ConfigurationService` vive en `application/service/` y no conoce HTTP ni JPA; el rechazo por rol y por valor sale como excepción de `domain/exception/`, y el `ErrorHandler` ya existente la traduce a 403 y 400. | PASA |
| IV | Independencia de datos | No se toca ninguna base ajena. `configuracion` es de `reservas_db`, y `ms-reservas` es su dueño. | PASA |
| V | Microfrontends autónomos | Las dos pantallas nuevas viven en `mf-administracion` y no importan nada de `mf-reservas`. Es la razón de R-011: reutilizar la pantalla existente habría exigido importar entre remotes o abrirle la ruta entera al administrador. | PASA |
| VI | Contrato antes que implementación | El recurso de configuración se cierra en la Fase 1, en `contracts/reservas-configuracion.yaml`, antes de escribir el controlador. La Historia 1 no necesita contrato: consume uno ya publicado. | PASA |
| VII | Levantar con un solo comando | No cambia el compose. El seed sigue dejando `max_reservas_activas = 3` en un arranque desde cero, que es lo que hace repetible la demostración de la Historia 2. | PASA |

**Compuertas de calidad**: las nueve aplican a las dos historias. La **novena** tiene trabajo
desigual y conviene tenerlo claro desde ahora:

- **Historia 1 — ninguno.** La vista 11 del `workspace.dsl` describe `mf-administracion` con capas
  genéricas (Vistas, Componentes UI, Estado, ApiClient), no con una caja por pantalla, así que una
  pantalla más no cambia el diagrama. Y el informe **ya afirma** que el administrador consulta
  disponibilidad: con esta historia esa frase pasa de falsa a cierta, sin tocarla.
- **Historia 2 — sí.** `ConfigurationController`, `ConfigurationUseCase` y `ConfigurationService`
  son componentes nuevos de `ms-reservas` y entran en la vista 03, que es la que el informe
  reproduce como Figura 3. Hay que reexportar `componentes-reservas.pdf` y añadir el puerto de
  configuración a §4, que hoy enumera solo los tres existentes.

**Resultado**: sin violaciones. La sección Complexity Tracking queda vacía y se elimina.

### Re-evaluación después de la Fase 1

- **Principio III** — El contrato no obliga al dominio a conocer HTTP. `ConfigurationService`
  recibe el rol como dato y lanza `ForbiddenOperationException`, que ya existe en
  `domain/exception/` y que el `ErrorHandler` ya traduce a 403. No hace falta ni una excepción
  nueva ni una traducción nueva.
- **Principio VI** — El contrato queda en un archivo propio, `contracts/reservas-configuracion.yaml`,
  que declara ser una extensión del de 001 y no su sustituto. Es deliberado: dos copias completas
  del contrato de `/api/reservas` en dos features serían dos fuentes de verdad que divergen.
- **Principio I** — El diseño no añadió ningún endpoint que no sostenga un FR. Los dos del recurso
  de configuración sostienen FR-052 a FR-056.

Sin violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/002-brechas-auditoria-alcance/
├── spec.md                          # Las dos historias y FR-049 a FR-056
├── plan.md                          # Este archivo
├── research.md                      # Fase 0: R-010 y R-011
├── speckit-commands.md              # Lo que se le pidió a cada comando de Spec Kit
├── contracts/
│   └── reservas-configuracion.yaml  # Fase 1: extensión del contrato de ms-reservas
└── tasks.md                         # Fase 2 (/speckit-tasks — no lo crea /speckit-plan)
```

No hay `data-model.md` en esta feature: no se crea ni se altera ninguna entidad. El único dato que
se toca, la fila `max_reservas_activas` de la tabla `configuracion`, está descrito en
[data-model.md de 001](../001-reserva-canchas-deportivas/data-model.md), donde queda anotado que su
escritura se especifica aquí.

Tampoco hay `quickstart.md` propio: las dos historias se verifican con los escenarios de
[quickstart.md de 001](../001-reserva-canchas-deportivas/quickstart.md) más los dos que añade la
Fase 2.

### Source Code (repository root)

```text
backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/
├── adapter/in/web/
│   └── ConfigurationController.java        # NUEVO — GET y PUT /api/reservas/configuracion
├── application/
│   ├── port/in/ConfigurationUseCase.java   # NUEVO
│   ├── port/out/ConfigurationRepositoryPort.java   # + método de escritura
│   └── service/ConfigurationService.java   # NUEVO — FR-052 a FR-056
└── adapter/out/persistence/
    └── ConfigurationRepositoryAdapter.java # + implementación de la escritura

frontend/mf-administracion/src/
├── api/client.ts                    # + consultarDisponibilidad, leerTope, cambiarTope
├── pages/
│   ├── Disponibilidad.tsx           # NUEVO — Historia 1, solo lectura
│   └── Configuracion.tsx            # NUEVO — Historia 2
├── App.tsx                          # + dos rutas
└── components/Layout.tsx            # + dos entradas de navegación

diagramas/workspace.dsl              # + los tres componentes en la vista 03 (solo Historia 2)
informe/secciones/04-arquitectura.tex # + el puerto de configuración (solo Historia 2)
```

No se toca `frontend/shell`: `RoleRoute` se queda como está, porque la disponibilidad del
administrador vive en su propio remote y no en `/reservas`. Es la consecuencia práctica de R-011.

## Orden de Implementación

Las dos historias son independientes y se pueden hacer en cualquier orden o en paralelo, porque no
comparten ni un archivo. El orden propuesto va por coste y por consecuencia documental.

### Recorrido 1 — Historia US1 (P1): disponibilidad del administrador

Solo `mf-administracion`: cliente de API, pantalla de solo lectura, ruta y entrada de navegación.
Reutiliza `GET /api/reservas/disponibilidad` sin tocarlo.

**Demostrable al terminar**: entrar como administrador, abrir disponibilidad, ver los mismos
bloques que ve un socio para esa cancha y fecha, y comprobar que no hay ninguna acción de reservar.
Cubre §7.1 por la parte de §3.1 que hoy falta, y SC-011.

### Recorrido 2 — Historia US2 (P2): configuración del tope

`ms-reservas` primero —puerto, caso de uso, prueba, controlador— y después la pantalla, en ese
orden, porque el Principio VI exige el contrato publicado antes de que la pantalla lo consuma.
Cierra con la compuerta 9: DSL, figura reexportada e informe.

**Demostrable al terminar**: bajar el tope a 1, ser rechazado al crear la segunda reserva activa
citando el tope nuevo, devolverlo a 3 y ver la misma reserva confirmarse, sin reiniciar nada.
Cubre SC-012 y SC-013.

## Riesgos

| Riesgo | Señal temprana | Respuesta |
|---|---|---|
| La pantalla de disponibilidad del administrador se copia entera de `mf-reservas`, arrastrando el botón de reservar | Aparece un `navigate('/reservas/nueva')` en `mf-administracion` | La pantalla es de solo lectura por FR-051. Se adapta, no se copia; y el administrador no tiene ruta `/reservas` a la que navegar |
| Alguien "simplifica" abriendo `/reservas` a los dos roles en `RoleRoute` | Un cambio en `frontend/shell/src/App.tsx` dentro de esta feature | Esta feature no toca el shell. El porqué está en R-011: el botón de reservar devolvería 403 y la barra mostraría "Mis Reservas" siempre vacía |
| El tope queda en un valor raro tras la demostración y el seed deja de poblar "Mis reservas" | Un usuario final no puede crear la segunda reserva de la demo | El seed reafirma `max_reservas_activas = 3` en cada arranque desde cero, y el último paso de la demostración devuelve el tope a 3 |
| Se añade caché a la lectura del tope "de paso" y el cambio deja de ser inmediato | Aparece un `@Cacheable` o un campo en `BookingService` | FR-053 exige que rija sin reiniciar. Si alguna vez hay caché, FR-053 pasa a exigir su invalidación; está anotado en R-010 |
| La vista 03 del DSL se actualiza al final y la Figura 3 del informe queda describiendo un servicio que ya no es | El recorrido 2 se da por cerrado sin reexportar | Compuerta 9, verificada dentro del recorrido y no en una fase de pulido |
