# Research — Fase 0

**Feature**: 002 · [plan.md](./plan.md) · [spec.md](./spec.md) · 2026-08-29

La numeración de decisiones continúa la de la feature 001, que llegó a R-009, para que en el
proyecto no haya dos decisiones con el mismo identificador.

## Lo que no se investigó, porque ya estaba decidido

- **La forma de la disponibilidad**: `DisponibilidadResponse`, con sus bloques y sus estados, está
  cerrada en `contracts/reservas.yaml` de 001 y en producción. Esta feature la consume, no la
  rediseña.
- **Cómo llega la identidad**: `X-User-Id` y `X-User-Role`, escritas por el gateway (R-003 de 001).
- **Dónde vive RN-06**: en `BookingService.verificarTope`. Esta feature no mueve la regla; hace
  escribible el parámetro que la regla ya leía.
- **El aislamiento de datos**: `configuracion` es de `reservas_db` y `ms-reservas` es su dueño. No
  hay nada que decidir.

---

## R-010 — Forma del endpoint de configuración del tope

**Contexto**: la enmienda 1.3.0 de la constitución declara en alcance la configuración del tope de
RN-06 (FR-052 a FR-056). La tabla `configuracion` de `reservas_db` es clave/valor y hoy solo se lee,
desde `BookingService.verificarTope` a través de `ConfigurationRepositoryPort`.

**Decisión**: un recurso propio, `GET /api/reservas/configuracion` y
`PUT /api/reservas/configuracion`, con cuerpo tipado `{ "maxReservasActivas": 3 }`. En el
microservicio entra por un adaptador de entrada nuevo —`ConfigurationController`— y un caso de uso
propio —`ConfigurationUseCase` / `ConfigurationService`—, no colgando de `BookingService`.
`ConfigurationRepositoryPort` gana un método de escritura.

**No hay caché que invalidar**: `BookingService` lee la clave en cada creación de reserva, así que
un cambio del tope rige para la petición siguiente sin reiniciar ni redesplegar nada. Es
exactamente lo que exige FR-053, y es una propiedad del diseño que 001 ya dejó hecho, no algo que
esta feature construya. **Si alguna vez se añade caché a esa lectura, FR-053 pasa a exigir su
invalidación**; queda anotado aquí porque es el tipo de cosa que se rompe sin que nadie lo note.

**Rationale**: exponer un objeto tipado y no el par clave/valor crudo mantiene el contrato honesto
—el frontend no tiene que saber que detrás hay una tabla genérica— y deja sitio para más parámetros
sin abrir rutas nuevas. Separar el caso de uso evita que `BookingService`, que ya concentra RN-01 a
RN-06 y RN-08, cargue además con una responsabilidad de administración.

**Dónde vive el contrato**: en `contracts/reservas-configuracion.yaml` de esta feature, declarado
como extensión del `contracts/reservas.yaml` de 001. Copiar el contrato entero de `/api/reservas`
aquí crearía dos fuentes de verdad para el mismo servicio, y el README de contratos de 001 dice que
manda el documento escrito: dos documentos que mandan es peor que uno incompleto.

**Consecuencia sobre la compuerta 9**: `ConfigurationController`, `ConfigurationUseCase` y
`ConfigurationService` son componentes nuevos de `ms-reservas`. Entran en la vista 03 del
`workspace.dsl`, hay que reexportar `componentes-reservas.pdf` —que el informe reproduce como
Figura 3— y §4 del informe describe hoy los puertos de ese servicio sin mencionarlos.

**Alternativas descartadas**:

- *`PATCH /api/reservas/configuracion/max-reservas-activas`*: una ruta por parámetro multiplica el
  contrato sin ganar nada mientras el parámetro sea uno solo.
- *Colgarlo de `BookingUseCase`*: mezcla la política de reservas con la operación de reservar, y
  obliga a que la pantalla de administración consuma el caso de uso del usuario final.
- *Variable de entorno del contenedor*: cambiarla exige redesplegar `ms-reservas`, que es justo lo
  que FR-053 prohíbe.
- *Un microservicio de configuración*: un sexto servicio para una fila de una tabla. Ni el alcance
  ni el DSL lo contemplan, y el Principio I lo prohíbe.

---

## R-011 — Dónde vive la consulta de disponibilidad del administrador

**Contexto**: FR-007 de 001 exige la consulta de disponibilidad para ambos roles desde el
principio, pero solo `mf-reservas` tiene pantalla, y el shell la restringe a `USUARIO_FINAL` con
`RoleRoute`. El backend ya cumple: `GET /api/reservas/disponibilidad` no comprueba rol.

**Decisión**: una pantalla propia en `mf-administracion`. **No** abrir la de `mf-reservas` a los dos
roles.

**Rationale**: tres razones, y cualquiera de ellas basta.

1. El **Principio V** prohíbe que un remote importe código de otro, así que reutilizar la pantalla
   obligaría a abrirle al administrador la ruta `/reservas` entera en `RoleRoute`.
2. Esa pantalla lleva un botón **Reservar** que navega a `/reservas/nueva`, contra un endpoint que
   devuelve **403** al administrador porque `BookingService.crear` lo rechaza por rol: sería
   ofrecer una acción que siempre falla. FR-051 lo prohíbe explícitamente.
3. La barra de navegación de `mf-reservas` muestra **"Mis Reservas"**, que para un administrador
   estaría siempre vacía, porque §3.1 no le atribuye crear reservas.

**Alcance real**: la pantalla nueva es de solo lectura y reusa el endpoint tal cual. No hay trabajo
de backend, ni contrato nuevo, ni migración.

**Consecuencia sobre la compuerta 9**: ninguna. La vista 11 de `mf-administracion` usa capas
genéricas —Vistas, Componentes UI, Estado, ApiClient— y no una caja por pantalla, así que una
pantalla más no cambia el diagrama. El informe ya afirma que el administrador consulta
disponibilidad: con esta historia esa frase pasa de falsa a cierta, sin tocar el texto.

**Alternativas descartadas**:

- *Abrir `/reservas` a los dos roles y ocultar las acciones por rol*: convierte un remote pensado
  para un rol en uno condicional, y deja la lógica de permisos repartida entre el shell y el
  remote.
- *Extraer la pantalla a un paquete compartido entre remotes*: es exactamente lo que el Principio V
  llama "un monolito con pasos extra".
- *Añadir la disponibilidad al listado global de reservas*: responde a otra pregunta. El listado
  dice qué está reservado; la disponibilidad, qué queda libre dentro del horario de atención.

---

## Resumen de decisiones

| # | Decisión | Toca |
|---|---|---|
| R-010 | `GET`/`PUT /api/reservas/configuracion` con cuerpo tipado y caso de uso propio; sin caché que invalidar | `ms-reservas`, contrato, `mf-administracion`, `diagramas/workspace.dsl`, informe §4 |
| R-011 | La disponibilidad del administrador es pantalla propia de `mf-administracion`, no la de `mf-reservas` abierta a dos roles | `mf-administracion` |

Sin `NEEDS CLARIFICATION` pendientes.
