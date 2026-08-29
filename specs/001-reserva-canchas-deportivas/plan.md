# Implementation Plan: Sistema de Reserva de Canchas Deportivas

**Branch**: `001-reserva-canchas-deportivas` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reserva-canchas-deportivas/spec.md`

## Summary

Implementar las cuatro historias del spec como rebanadas verticales completas: cada una atraviesa
remote → edge → gateway → microservicio → base de datos y termina en algo demostrable en pantalla.

El punto de partida no es un repositorio vacío y el plan no lo trata como tal:

- **Frontend**: las ocho pantallas ya están construidas y estilizadas. No hay una sola llamada HTTP.
  Cada pantalla se alimenta de arreglos fijos declarados en su propio archivo, y la sesión se valida
  contra un `MOCK_USERS` de dos entradas en `frontend/shell/src/auth/AuthContext.tsx`. El trabajo de
  frontend es **conectar y reconciliar**, no maquetar.
- **Backend**: los cinco proyectos Maven existen con sus dependencias resueltas, pero cada uno tiene
  solo su `*Application.java` y su `application.yml`. Toda la estructura hexagonal está por
  construirse encima, siguiendo `template-backend/ARQUITECTURA.md`.
- **Infraestructura**: `docker-compose.yml` solo levanta el perfil `frontend`. Faltan PostgreSQL, los
  cuatro microservicios, el gateway y el edge.

El contrato es la pieza que sostiene todo esto, porque frontend y backend avanzan a ambos lados de
él. Por eso los contratos se definen completos —incluidos los códigos de error— antes de escribir
implementación, según el Principio VI de la constitución. Ver [contracts/](./contracts/).

## Technical Context

**Language/Version**: Java 21 LTS (Eclipse Temurin 21.0.11) en backend · TypeScript 5 sobre React 19
en frontend

**Primary Dependencies**: Spring Boot 4.0.8 · Spring Framework 7.0.9 · Spring Cloud 2025.1.2 con
Gateway Server WebFlux 5.0.2 · springdoc-openapi 3.0.2 · Flyway 11.14.1 · Hibernate 7.2.24.Final ·
`spring-security-crypto` (solo `BCryptPasswordEncoder`) · Rsbuild con
`@module-federation/rsbuild-plugin` · React Router · Tailwind CSS. Versiones exactas y matriz de
dependencias por servicio en `backend/STACK.md`; ninguna se elige aquí.

**Storage**: PostgreSQL 16, una instancia con tres bases independientes —`usuarios_db`, `canchas_db`,
`reservas_db`— y un rol de conexión distinto por microservicio, sin permiso sobre las otras dos.
`ms-reportes` no tiene base: agrega vía REST. Esquema versionado con Flyway y
`spring.jpa.hibernate.ddl-auto: validate`.

**Testing**: JUnit 5 con los starters de test de Spring Boot 4. Pruebas de caso de uso sobre
`application/service/` con el puerto de salida mockeado, sin Spring ni base de datos. Prueba de
concurrencia de RN-02 contra PostgreSQL real. `npm run build` por microfrontend como verificación de
compilación independiente.

**Target Platform**: Navegador moderno sobre un único origen `http://localhost`, servido por un edge
nginx 1.27; backend en contenedores `eclipse-temurin:21-jre` orquestados con Docker Compose v2.

**Project Type**: Aplicación web con microfrontends federados y microservicios.

**Performance Goals**: SC-008 del spec — consulta de disponibilidad de una cancha y fecha en menos de
2 segundos con al menos 500 reservas cargadas. No hay metas de throughput: la escala es de un club.

**Constraints**: `docker compose up` deja el sistema completo arriba con datos de prueba, sin pasos
manuales (Principio VII). Autenticación básica con roles, sin OAuth2 ni JWT (§4.4). Ningún
microservicio lee la base de otro (Principio IV). RN-02 garantizada por restricción de base de datos,
no solo por validación en el servicio.

**Scale/Scope**: 8 pantallas ya construidas · 5 servicios backend · 3 bases · 48 requisitos
funcionales · 8 reglas de negocio · 4 historias de usuario.

**NEEDS CLARIFICATION**: ninguna. Ver [research.md](./research.md): el stack, la arquitectura y las
versiones estaban decididos antes de este plan, y las nueve decisiones que sí estaban abiertas
—todas sobre el encaje entre el frontend existente y los contratos— quedan resueltas ahí.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` v1.3.0.

| # | Principio | Cómo lo satisface este plan | Estado |
|---|---|---|---|
| I | Alcance cerrado y trazable | Todo el trabajo sale de los 48 FR del spec, que ya trazan a §3.1–§3.3, RN-01…RN-08 y E1–E6. Las cuatro piezas del frontend que **no** trazan (dashboard de KPIs inventados, edición de perfil, filtro "Fútbol", estado "pasada") se recortan o se reconducen en R-005 a R-008 de research.md, no se conservan por inercia. | PASA |
| II | Reglas de negocio en el dominio, con prueba | Las ocho RN viven en `application/service/` del servicio dueño: RN-01…RN-06 y RN-08 en `BookingService` de `ms-reservas`, RN-07 en `CourtService` de `ms-canchas`. Cada una con prueba unitaria y puerto de salida mockeado; RN-02 además con prueba de concurrencia. | PASA |
| III | Regla de dependencia hexagonal | Los cinco proyectos conservan `com.ups.reservacanchas.<dominio>` y se estructuran según `template-backend/ARQUITECTURA.md`, con los nombres de clase de las cajas del DSL. El `api-gateway` queda exceptuado por decisión de la constitución: es enrutamiento e identificación, sin dominio propio. | PASA |
| IV | Independencia de datos | Tres roles de PostgreSQL, uno por base, sin permiso cruzado. `ms-reservas` valida la cancha llamando a `ms-canchas` por `CourtClientPort`. `ms-reportes` sin base, sin driver JDBC y sin Flyway. | PASA |
| V | Microfrontends autónomos | Los tres remotes ya compilan por separado y exponen solo `./App`. El plan no introduce ningún import entre paquetes: la sesión baja del shell como prop y los datos llegan por `/api`. | PASA |
| VI | Contrato antes que implementación | Los contratos de los cuatro servicios, con su catálogo de errores, se cierran en Fase 1 y son la entrada del trabajo de ambos lados. Swagger UI por servicio en `/swagger-ui.html`. | PASA |
| VII | Levantar con un solo comando | El compose se completa dentro de la primera historia y crece con cada una; el seed cubre los tres dominios desde el arranque. Ver [quickstart.md](./quickstart.md). | PASA |

**Compuertas de calidad**: las nueve aplican a cada historia. La novena —`diagramas/workspace.dsl` y
`informe/secciones/` actualizados en el mismo cambio— tiene trabajo identificado ya en este plan:
el DSL no contempla todavía la ruta `/api/auth` ni el contenedor de PostgreSQL con sus tres bases
como se despliega realmente. Se corrige al integrar la primera historia, no al final.

**Resultado**: sin violaciones. La sección Complexity Tracking queda vacía y se elimina.

### Re-evaluación después de la Fase 1

Repetida sobre los artefactos de diseño ya escritos, que es cuando las violaciones suelen aparecer:

- **Principio III** — Ningún contrato obliga a que el dominio conozca HTTP. El 409 de RN-02 nace de
  una restricción de PostgreSQL, y su recorrido está fijado en dos traducciones que respetan la
  regla de dependencia: `BookingRepositoryAdapter` convierte la violación de la restricción en
  `SlotAlreadyBookedException` (de `domain/exception/`, sin `HttpStatus`), y el `ErrorHandler` la
  convierte en 409. Ver R-004 y el catálogo de códigos.
- **Principio IV** — `reservas_db.reserva` no tiene claves foráneas hacia `cancha` ni `usuario`, y
  no puede tenerlas: viven en otras bases a las que su conexión no llega. `ms-reportes` no aparece
  en data-model.md porque no tiene base. Ver data-model.md.
- **Principio I** — El diseño no añadió ningún endpoint que no sostenga un FR del spec. El único
  candidato, `GET /reportes/resumen`, es conveniencia para el panel y no expone ningún dato que los
  otros cuatro no den; queda justificado en su propia descripción.
- **Principio VI** — Los cuatro contratos están completos, con su catálogo de errores y el mapa de
  qué pantalla consume qué. Ver [contracts/README.md](./contracts/README.md).
- **Compuerta 9** — El trabajo sobre `diagramas/workspace.dsl` está identificado y fechado (R-009):
  se integra con la Historia 1, no al final.

Sin violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/001-reserva-canchas-deportivas/
├── spec.md              # Especificación (ya existe)
├── plan.md              # Este archivo
├── research.md          # Fase 0 — las nueve decisiones que estaban abiertas
├── data-model.md        # Fase 1 — tres esquemas, entidades y la restricción EXCLUDE
├── quickstart.md        # Fase 1 — levantar y validar el sistema completo
├── contracts/           # Fase 1 — los contratos, con sus códigos de error
│   ├── README.md        #   convenciones transversales y catálogo de errores
│   ├── auth-usuarios.yaml
│   ├── canchas.yaml
│   ├── reservas.yaml
│   └── reportes.yaml
├── checklists/
│   └── requirements.md  # Validación del spec (ya existe)
└── tasks.md             # Fase 2 — la produce /speckit-tasks, no este comando
```

### Source Code (repository root)

Rutas reales del repositorio. Los cinco proyectos Maven y los cuatro paquetes de frontend ya
existen; lo que aparece marcado es lo que este plan construye encima.

```text
backend/
├── STACK.md                                    # versiones y convenciones (fuente, no se toca)
├── api-gateway/                                # :8080 — SIN hexagonal, por decisión de la constitución
│   └── src/main/java/com/ups/reservacanchas/gateway/
│       ├── ApiGatewayApplication.java          # existe
│       ├── AuthenticationFilter.java           # + identifica al usuario, inyecta X-User-Id / X-User-Role
│       ├── RouteConfig.java                    # + rutea /api/** a cada microservicio
│       └── ErrorHandler.java                   # + traduce fallos del servicio destino
├── ms-usuarios/                                # :8081 → usuarios_db
│   └── src/main/java/com/ups/reservacanchas/usuarios/
│       ├── MsUsuariosApplication.java          # existe
│       ├── domain/                             # + User, Role, UserStatus
│       │   └── exception/                      # + InvalidCredentialsException, UserAlreadyExistsException…
│       ├── application/port/in/                # + UserUseCase
│       ├── application/port/out/               # + UserRepositoryPort
│       ├── application/service/                # + UserService
│       ├── adapter/in/web/                     # + UserController, AuthController, ErrorHandler
│       ├── adapter/out/persistence/            # + UserRepositoryAdapter, UserEntity (package-private)
│       ├── config/                             # + PasswordEncoderConfig, OpenApiConfig
│       └── dto/                                # + records de request/response
│   └── src/main/resources/db/migration/        # + V1__usuarios.sql, V2__seed_usuarios.sql
├── ms-canchas/                                 # :8082 → canchas_db
│   └── src/main/java/com/ups/reservacanchas/canchas/
│       ├── MsCanchasApplication.java           # existe
│       ├── domain/ · domain/exception/         # + Court, Sport, OpeningHours, MaintenanceBlock
│       ├── application/port/in/                # + CourtUseCase
│       ├── application/port/out/               # + CourtRepositoryPort
│       ├── application/service/                # + CourtService  (RN-07)
│       ├── adapter/in/web/                     # + CourtController, ErrorHandler
│       ├── adapter/out/persistence/            # + CourtRepositoryAdapter, CourtEntity, MaintenanceBlockEntity
│       ├── config/ · dto/
│   └── src/main/resources/db/migration/        # + V1__canchas.sql, V2__seed_canchas.sql
├── ms-reservas/                                # :8083 → reservas_db · dueño de RN-01…RN-06, RN-08
│   └── src/main/java/com/ups/reservacanchas/reservas/
│       ├── MsReservasApplication.java          # existe
│       ├── domain/ · domain/exception/         # + Booking, BookingStatus, TimeSlot,
│       │                                       #   SlotAlreadyBookedException, ActiveBookingLimitExceededException,
│       │                                       #   PastBookingCancellationException, ForbiddenOperationException
│       ├── application/port/in/                # + BookingUseCase
│       ├── application/port/out/               # + BookingRepositoryPort, ConfigurationRepositoryPort, CourtClientPort
│       ├── application/service/                # + BookingService  ← aquí viven las reglas
│       ├── adapter/in/web/                     # + BookingController, ErrorHandler
│       ├── adapter/out/persistence/            # + BookingRepositoryAdapter, ConfigurationRepositoryAdapter, entidades
│       ├── adapter/out/client/                 # + CourtClientAdapter (RestClient → ms-canchas)
│       ├── config/ · dto/
│   └── src/main/resources/db/migration/        # + V1__reservas.sql  ← btree_gist + EXCLUDE (RN-02)
│                                               #   V2__configuracion.sql, V3__seed_reservas.sql
├── ms-reportes/                                # :8084 — SIN base, SIN JPA, SIN Flyway
│   └── src/main/java/com/ups/reservacanchas/reportes/
│       ├── MsReportesApplication.java          # existe
│       ├── domain/                             # + OccupancyReport, DemandRanking, PeriodSummary
│       ├── application/port/in/                # + ReportUseCase
│       ├── application/port/out/               # + BookingsClientPort, CourtsClientPort
│       ├── application/service/                # + ReportService  ← los cuatro indicadores de §3.3.5
│       ├── adapter/in/web/                     # + ReportController, ErrorHandler
│       ├── adapter/out/client/                 # + BookingsClientAdapter, CourtsClientAdapter
│       └── config/ · dto/
└── (cada proyecto conserva su mvnw, pom.xml y application.yml)

template-backend/
├── ARQUITECTURA.md                             # el porqué de la estructura (fuente, no se toca)
└── microservice-template/                      # ejemplo vivo: compila y tiene tests que pasan.
                                                # Es de donde sale cada servicio; no se modifica.

frontend/
├── shell/                                      # :3000 host · ya federa los tres remotes
│   └── src/
│       ├── App.tsx                             # ~ prop `token` → prop `sesion` (R-002)
│       ├── auth/AuthContext.tsx                # ~ MOCK_USERS fuera; login() llama a /api/auth/login
│       ├── auth/RoleRoute.tsx                  # ~ roles cliente|admin → USUARIO_FINAL|ADMINISTRADOR (R-001)
│       ├── auth/ProtectedRoute.tsx
│       ├── pages/Login.tsx                     # ~ quita las credenciales de demo en pantalla
│       ├── pages/Perfil.tsx                    # ~ a solo lectura (R-006)
│       └── api/                                # + cliente HTTP compartido: adjunta credencial, traduce errores
├── mf-reservas/                                # :3001 remote — Historia 1
│   └── src/pages/
│       ├── Disponibilidad.tsx                  # ~ arreglos `canchas`/`dias` fuera → GET /api/canchas + /api/reservas/disponibilidad
│       ├── NuevaReserva.tsx                    # ~ formulario → POST /api/reservas (409 en pantalla)
│       └── MisReservas.tsx                     # ~ arreglo `reservas` fuera → GET /api/reservas/mias; estado "pasada" → FINALIZADA (R-007)
├── mf-administracion/                          # :3002 remote — Historias 2 y 4
│   └── src/pages/
│       ├── GestionCanchas.tsx                  # ~ arreglo `canchas` fuera; filtro "Fútbol" → "Básquet" (R-008)
│       ├── GestionReservas.tsx                 # ~ arreglo `reservas` fuera → GET /api/reservas + cancelación administrativa
│       ├── GestionUsuarios.tsx                 # ~ arreglo `usuarios` fuera → GET/PATCH /api/usuarios
│       └── Panel.tsx                           # ~ KPIs inventados → los indicadores reales de /api/reportes (R-005)
├── mf-reportes/                                # :3003 remote — Historia 3
│   └── src/pages/ReportesYEstadisticas.tsx     # ~ cuatro arreglos fijos → los cuatro indicadores de /api/reportes
└── (cada paquete conserva su Dockerfile, nginx.conf, rsbuild.config.ts y package.json)

infra/                                          # + todo nuevo
├── edge/nginx.conf                             # + shell en /, remotes en /mf-*/, proxy /api → gateway
└── postgres/init/
    ├── 01-bases-y-roles.sql                    # + tres bases, tres roles, sin permisos cruzados
    └── 02-extensiones.sql                      # + btree_gist en reservas_db (lo exige el EXCLUDE)

docker-compose.yml                              # ~ hoy solo perfil `frontend`; se completa (quickstart.md)
diagramas/workspace.dsl                         # ~ compuerta 8: /api/auth y el despliegue real de Postgres
informe/secciones/                              # ~ compuerta 8: 04-arquitectura, 05-modelo-datos, 06-reglas-negocio
```

Leyenda: `+` se crea · `~` se modifica · sin marca, existe y no se toca.

**Structure Decision**: se conserva la estructura que el repositorio ya tiene —cinco proyectos Maven
independientes bajo `backend/`, cuatro paquetes npm independientes bajo `frontend/`— porque es la que
sostienen los criterios de arquitectura de la rúbrica (15% + 15%) y la que describe
`diagramas/workspace.dsl`. Dentro de cada microservicio, la estructura hexagonal de
`template-backend/ARQUITECTURA.md`, con el paquete base `com.ups.reservacanchas.<dominio>` intacto y
subpaquetes y clases en inglés que corresponden 1:1 con las cajas del DSL. Se añade `infra/` porque
el edge y la inicialización de PostgreSQL no pertenecen a ningún paquete existente.

## Orden de Implementación

**Las capas no son fases.** No hay un "primero todo el backend". El orden lo manda la prioridad de
las historias del spec, y cada historia se implementa completa —remote, gateway, microservicio,
base— hasta que hay algo que se puede demostrar en pantalla. Si al terminar una historia no se puede
demostrar, está mal cortada.

### Recorrido 1 — Historia US1 (P1): reservar y cancelar

Es la historia más cara porque arrastra el andamiaje del que viven las demás. Ese andamiaje entra
aquí, dimensionado a lo que US1 necesita y nada más.

| Componente | Qué se construye en este recorrido |
|---|---|
| `infra/` + compose | PostgreSQL con las tres bases y sus roles, el edge nginx, y el compose completo con los servicios de este recorrido |
| `api-gateway` | `AuthenticationFilter` (identifica y propaga `X-User-Id`/`X-User-Role`, descarta las cabeceras que lleguen del cliente), `RouteConfig`, `ErrorHandler` |
| `ms-usuarios` | Registro, login, consulta de usuario. Hexagonal completa. Seed con administrador y usuarios finales |
| `ms-canchas` | Solo el lado de **lectura** del catálogo: listar canchas activas y consultar una. Seed con canchas de los tres deportes. La administración llega en el Recorrido 2 |
| `ms-reservas` | `BookingService` con RN-01…RN-06 y RN-08. Migración con `btree_gist` y la restricción `EXCLUDE`. `CourtClientPort` hacia `ms-canchas`. Seed de reservas |
| `shell` | Fuera `MOCK_USERS`; `login()` contra `/api/auth/login`; prop `sesion`; vocabulario de roles unificado |
| `mf-reservas` | Las tres pantallas conectadas: disponibilidad, nueva reserva (409 visible), mis reservas con cancelación |

**Demostrable al terminar**: registrarse, entrar, ver disponibilidad, reservar, chocar con un bloque
ocupado, cancelar y ver el bloque liberarse. Cubre §7.1 y §7.3.

### Recorrido 2 — Historia US2 (P2): catálogo y cancelación administrativa

`ms-canchas` gana el lado de escritura (RN-07, bloqueos de mantenimiento) y `ms-reservas` el listado
global y la cancelación por rol administrador. En frontend, `GestionCanchas` y `GestionReservas`.
La disponibilidad de US1 empieza a descontar los bloqueos de mantenimiento. Cubre §7.2.

### Recorrido 3 — Historia US3 (P3): reportes

`ms-reportes` completo: sin base, agregando por `BookingsClientPort` y `CourtsClientPort` los cuatro
indicadores de §3.3.5, incluido el ranking. En frontend, `ReportesYEstadisticas` y el `Panel` del
administrador. Cubre §7.4.

### Recorrido 4 — Historia US4 (P4): gestión de usuarios

`ms-usuarios` gana listado y cambio de estado; el gateway rechaza al usuario inactivo. En frontend,
`GestionUsuarios`. Cubre la fila de gestión de usuarios de §3.1.

## Riesgos

| Riesgo | Señal temprana | Respuesta |
|---|---|---|
| El `AuthenticationFilter` consulta a `ms-usuarios` en cada petición y la disponibilidad no baja de 2 s (SC-008) | Latencia visible ya en el Recorrido 1 | Caché en memoria de credencial verificada dentro del gateway, con expiración corta. Decidido en R-003; no se implementa antes de medir |
| La restricción `EXCLUDE` se escribe con una expresión no inmutable y Flyway falla al migrar | La migración V1 de `ms-reservas` no aplica | La forma exacta está fijada en data-model.md: `tsrange(fecha + hora_inicio, fecha + hora_fin, '[)')`, inmutable, con `WHERE estado = 'CONFIRMADA'` |
| Alguien "arregla" una violación de la regla de dependencia inyectando el repositorio JPA en el servicio | Aparece un import de `adapter/` en `application/service/` | Compuerta 4 de la constitución, revisada en cada integración |
| El seed caduca: las reservas confirmadas quedan en el pasado y RN-04 deja de poder demostrarse | La demo no encuentra nada que cancelar | El seed usa fechas relativas al arranque, no absolutas (Principio VII) |
