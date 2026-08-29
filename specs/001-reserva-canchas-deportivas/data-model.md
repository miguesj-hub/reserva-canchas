# Modelo de Datos

**Fase 1** · 2026-08-24 · [plan.md](./plan.md) · [research.md](./research.md)

Tres bases independientes en una única instancia de PostgreSQL 16. La independencia no es una
convención de nombres: cada microservicio se conecta con un rol propio que **no tiene privilegios
sobre las otras dos bases**. Una violación del Principio IV falla al conectar, no pasa desapercibida
en revisión.

`ms-reportes` no aparece en este documento porque no tiene base: obtiene todo por REST de
`ms-reservas` y `ms-canchas`, y calcula en memoria.

## Aislamiento

`infra/postgres/init/01-bases-y-roles.sql`, ejecutado una sola vez cuando el volumen está vacío:

| Base | Rol propietario | Puede conectarse a |
|---|---|---|
| `usuarios_db` | `usuarios_app` | `usuarios_db` y nada más |
| `canchas_db` | `canchas_app` | `canchas_db` y nada más |
| `reservas_db` | `reservas_app` | `reservas_db` y nada más |

Se revoca `CONNECT` sobre cada base a `PUBLIC` y se concede solo al rol dueño. `ms-reportes` no
recibe rol: no tiene por qué conectarse a ninguna.

`infra/postgres/init/02-extensiones.sql` crea `btree_gist` en `reservas_db`, que es requisito de la
restricción de RN-02.

## `usuarios_db` — dominio de `ms-usuarios`

### `usuario`

| Columna | Tipo | Restricciones | Origen |
|---|---|---|---|
| `id` | `bigint` | PK, identidad | |
| `username` | `varchar(60)` | NOT NULL, UNIQUE | FR-002 rechaza el duplicado |
| `nombre` | `varchar(120)` | NOT NULL | |
| `password_hash` | `varchar(72)` | NOT NULL | BCrypt, nunca la contraseña en claro |
| `rol` | `varchar(20)` | NOT NULL, CHECK en (`USUARIO_FINAL`, `ADMINISTRADOR`) | §3.1, R-001 |
| `activo` | `boolean` | NOT NULL, default `true` | FR-005, FR-046 |
| `creado_en` | `timestamp` | NOT NULL, default `now()` | |

**Reglas**: el registro público crea siempre `rol = 'USUARIO_FINAL'` y `activo = true`; el contrato
no acepta el rol como entrada (supuesto del spec: los administradores se aprovisionan con el seed).
Inactivar un usuario no toca sus reservas (FR-047): son de otro dominio y esta base no las conoce.

### Migraciones

- `V1__usuarios.sql` — tabla, restricciones e índice sobre `username`.
- `V2__seed_usuarios.sql` — un administrador, dos usuarios finales activos y uno inactivo, todos con
  contraseña conocida y documentada en el quickstart. El usuario inactivo es lo que hace demostrable
  la Historia 4 desde el primer arranque.

## `canchas_db` — dominio de `ms-canchas`

### `cancha`

| Columna | Tipo | Restricciones | Origen |
|---|---|---|---|
| `id` | `bigint` | PK, identidad | |
| `nombre` | `varchar(120)` | NOT NULL | FR-029 |
| `deporte` | `varchar(20)` | NOT NULL, CHECK en (`PADEL`, `TENIS`, `BASQUET`) | R-008 |
| `hora_apertura` | `time` | NOT NULL | RN-07 |
| `hora_cierre` | `time` | NOT NULL, CHECK `hora_cierre > hora_apertura` | RN-07 |
| `activa` | `boolean` | NOT NULL, default `true` | FR-031 |

El horario de atención delimita qué bloques existen (FR-008). Inactivar una cancha no borra ni
cancela nada (FR-032).

### `bloqueo_mantenimiento`

| Columna | Tipo | Restricciones | Origen |
|---|---|---|---|
| `id` | `bigint` | PK, identidad | |
| `cancha_id` | `bigint` | NOT NULL, FK → `cancha(id)` | FR-034 |
| `desde` | `timestamp` | NOT NULL | |
| `hasta` | `timestamp` | NOT NULL, CHECK `hasta > desde` | |
| `motivo` | `varchar(200)` | NULL | |

Un bloqueo impide reservas nuevas pero no cancela las existentes: el administrador las cancela desde
el listado global, que es lo que describe §3.3.3.

### Migraciones

- `V1__canchas.sql` — ambas tablas, con sus CHECK y la FK.
- `V2__seed_canchas.sql` — al menos una cancha por deporte con horario 07:00–22:00, más una cancha
  inactiva, más demanda desigual entre canchas para que el ranking de §3.3.5 muestre algo.

## `reservas_db` — dominio de `ms-reservas`

Es la base que sostiene RN-01 a RN-06 y RN-08.

### `reserva`

| Columna | Tipo | Restricciones | Origen |
|---|---|---|---|
| `id` | `bigint` | PK, identidad | |
| `cancha_id` | `bigint` | NOT NULL — **sin FK**: la cancha vive en otra base | Principio IV |
| `usuario_id` | `bigint` | NOT NULL — sin FK, por lo mismo | Principio IV |
| `fecha` | `date` | NOT NULL | RN-01 |
| `hora_inicio` | `time` | NOT NULL | RN-01 |
| `hora_fin` | `time` | NOT NULL, CHECK `hora_fin > hora_inicio` | RN-01 |
| `estado` | `varchar(20)` | NOT NULL, CHECK en (`CONFIRMADA`, `CANCELADA`, `FINALIZADA`) | RN-08, R-007 |
| `creada_en` | `timestamp` | NOT NULL, default `now()` | |
| `cancelada_en` | `timestamp` | NULL | alimenta "cancelaciones por período" |

La ausencia de claves foráneas hacia `cancha` y `usuario` es deliberada y no es una omisión: son
entidades de otras bases, a las que esta conexión no llega. La validación de que la cancha existe,
está activa y el bloque cae dentro de su horario la hace `BookingService` llamando a `ms-canchas`
por `CourtClientPort`, antes de persistir.

### La restricción que implementa RN-02

En `V1__reservas.sql`, desde la primera migración y no como añadido posterior:

```sql
ALTER TABLE reserva ADD CONSTRAINT reserva_sin_solape
    EXCLUDE USING gist (
        cancha_id WITH =,
        tsrange(fecha + hora_inicio, fecha + hora_fin, '[)') WITH &&
    ) WHERE (estado = 'CONFIRMADA');
```

Tres detalles que no son negociables, con su motivo:

- `WHERE (estado = 'CONFIRMADA')` — solo las confirmadas compiten por el bloque. Es lo que hace que
  cancelar libere el horario (RN-05) sin borrar la fila, conservando la traza que RN-08 pide y el
  dato que el reporte de cancelaciones necesita.
- `'[)'` — inicio incluido, fin excluido. Sin esto, una reserva de 10:00–11:00 bloquearía la de
  11:00–12:00, y bloques contiguos dejarían de poder reservarse.
- `tsrange` sobre `fecha + hora_inicio` — la expresión es inmutable y por tanto indexable. Con una
  variante con zona horaria la migración falla al crear el índice.

La comprobación previa en `BookingService` se conserva: es la que da el mensaje claro en el caso
normal. La restricción cubre el caso que ninguna comprobación previa puede cubrir —dos
transacciones que comprueban a la vez y ambas ven el bloque libre— y es lo que mide SC-004.

### `configuracion`

| Columna | Tipo | Restricciones | Origen |
|---|---|---|---|
| `clave` | `varchar(60)` | PK | |
| `valor` | `varchar(120)` | NOT NULL | |

Una sola fila obligatoria: `max_reservas_activas = 3` (RN-06). Se lee **y se escribe** por
`ConfigurationRepositoryPort`.

La escritura entra con la enmienda 1.3.0 de la constitución, que declara en alcance la
configuración del tope por traza a RN-06. Hasta entonces este documento decía que era "un
parámetro, no una pantalla, y añadirla sería alcance nuevo": esa frase queda sin efecto. La tabla
no cambia —ni columnas, ni migración nueva—; lo que cambia es que su única fila deja de ser de
solo lectura y pasa a editarse desde `mf-administracion` (FR-049 a FR-053).

### Migraciones

- `V1__reservas.sql` — tabla, CHECK y la restricción `EXCLUDE`.
- `V2__configuracion.sql` — tabla y el valor por defecto del tope.
- `V3__seed_reservas.sql` — reservas en los tres estados, con **fechas relativas al arranque**, no
  absolutas: las confirmadas caen en el futuro para que RN-04 y RN-05 se puedan demostrar cancelando
  en vivo, y las finalizadas en el pasado reciente para que los reportes tengan de qué hablar. El
  seed no siembra solapamientos —la restricción los rechazaría al cargar— ni supera el tope de
  RN-06.

## Estados y transiciones

```text
                    crear (RN-01, RN-02, RN-06)
                              │
                              ▼
                        ┌───────────┐
                        │CONFIRMADA │
                        └───────────┘
                          │        │
   cancelar (RN-03, RN-04)│        │ pasa la hora de fin
                          ▼        ▼
                  ┌──────────┐  ┌───────────┐
                  │CANCELADA │  │FINALIZADA │
                  └──────────┘  └───────────┘
                     (terminal)    (terminal)
```

- Ambos estados finales son terminales: de `CANCELADA` no se vuelve (FR-023) y `FINALIZADA` no se
  puede cancelar (FR-028).
- La transición a `FINALIZADA` la produce el paso del tiempo, no una acción de usuario. Se resuelve
  al leer, comparando la hora de fin con el instante actual: una reserva confirmada cuyo bloque ya
  terminó se presenta como `FINALIZADA`, no cuenta como activa para RN-06 y no se puede cancelar.
  No hace falta un proceso que recorra la tabla marcando filas, y así el estado nunca queda
  desactualizado por un proceso que no corrió.
- Solo `CONFIRMADA` ocupa el bloque, por el `WHERE` de la restricción. Una reserva finalizada no
  impide reservar ese mismo bloque en una fecha futura, porque la fecha forma parte del rango.

## Correspondencia con las entidades del spec

| Entidad del spec | Dónde vive |
|---|---|
| Usuario, Rol | `usuarios_db.usuario` |
| Cancha, Horario de atención | `canchas_db.cancha` |
| Bloqueo de mantenimiento | `canchas_db.bloqueo_mantenimiento` |
| Reserva | `reservas_db.reserva` |
| Parámetro de configuración | `reservas_db.configuracion` |
| Bloque horario | No es una tabla: se deriva del horario de atención de la cancha y se contrasta contra las reservas confirmadas. Materializarlo obligaría a generar filas por cancha, día y hora sin que ninguna regla lo necesite |
