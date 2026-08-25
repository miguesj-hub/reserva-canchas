---
description: "Task list for 001-reserva-canchas-deportivas"
---

# Tasks: Sistema de Reserva de Canchas Deportivas

**Input**: Design documents from `/specs/001-reserva-canchas-deportivas/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **Obligatorios, no opcionales.** El Principio II de la constitución exige que cada regla
RN-01…RN-08 tenga al menos una prueba unitaria con el puerto de salida mockeado, y que RN-02 tenga
además una prueba de concurrencia. La compuerta de calidad 3 lo verifica antes de dar una feature
por terminada. Las tareas de prueba van junto a la regla que cubren, no en una fase aparte.

**Organization**: Tareas agrupadas por historia de usuario. Cada historia es una rebanada vertical
—remote → edge → gateway → microservicio → base— y termina en un checkpoint demostrable en pantalla.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia pertenece (US1, US2, US3, US4)
- Toda tarea lleva su ruta exacta

## Path Conventions

Rutas reales del repositorio, según plan.md:

- Backend: `backend/<servicio>/src/main/java/com/ups/reservacanchas/<dominio>/`
- Migraciones: `backend/<servicio>/src/main/resources/db/migration/`
- Pruebas: `backend/<servicio>/src/test/java/com/ups/reservacanchas/<dominio>/`
- Frontend: `frontend/<paquete>/src/`
- Infraestructura: `infra/`, `docker-compose.yml`

Referencia obligatoria para todo lo de backend: `template-backend/ARQUITECTURA.md` y el ejemplo vivo
`template-backend/microservice-template/`. El paquete base `com.ups.reservacanchas.<dominio>` no se
renombra; los subpaquetes y las clases van en inglés, con los nombres de las cajas del DSL.

**Relación con plan.md**: el "Recorrido 1" del plan se despliega aquí en Fase 1 + Fase 2 + Fase 3.
Las fases 1 y 2 no son capas: la 1 es infraestructura sin comportamiento de negocio, y la 2 es la
rebanada vertical de autenticación, que atraviesa las mismas capas que cualquier historia y termina
en algo que se ve en pantalla.

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: Dejar el sistema arrancable. Ninguna tarea de esta fase implementa comportamiento de
negocio; son ficheros de infraestructura y configuración.

- [X] T001 Corregir `restart: unless-stoped` → `unless-stopped` en el servicio `shell` de `docker-compose.yml` (hoy Compose rechaza el valor y el arranque falla)
- [X] T002 [P] Crear `infra/postgres/init/01-bases-y-roles.sql`: las tres bases, un rol por base, `REVOKE CONNECT ... FROM PUBLIC` y `GRANT` solo al dueño, según data-model.md
- [X] T003 [P] Crear `infra/postgres/init/02-extensiones.sql` con `CREATE EXTENSION btree_gist` en `reservas_db` (requisito de la restricción de RN-02)
- [X] T004 [P] Crear `infra/edge/nginx.conf`: shell en `/`, cada remote bajo su `PUBLIC_PATH`, y `/api/` al gateway, según quickstart.md
- [X] T005 Añadir el servicio `postgres` (`postgres:16-alpine`), el volumen `pgdata` y su healthcheck `pg_isready` a `docker-compose.yml`, montando `infra/postgres/init/`
- [X] T006 Añadir el servicio `edge` a `docker-compose.yml` conectado a las redes `frontend` y `backend` —el único que toca ambas— y mover los cuatro servicios de frontend al perfil `full`
- [X] T007 [P] Crear `backend/api-gateway/Dockerfile` multietapa (build con `mvnw`, runtime `eclipse-temurin:21-jre`), partiendo del de `template-backend/microservice-template/`
- [X] T008 [P] Crear `backend/ms-usuarios/Dockerfile` con el mismo patrón
- [X] T009 [P] Crear `backend/ms-canchas/Dockerfile` con el mismo patrón
- [X] T010 [P] Crear `backend/ms-reservas/Dockerfile` con el mismo patrón
- [X] T011 [P] Crear `backend/ms-reportes/Dockerfile` con el mismo patrón
- [X] T012 [P] Configurar `backend/ms-usuarios/src/main/resources/application.yml`: datasource por variable de entorno, Flyway, `spring.jpa.hibernate.ddl-auto: validate`, Actuator (`health`, `info`, `metrics`) y springdoc en `/swagger-ui.html`
- [X] T013 [P] Configurar `backend/ms-canchas/src/main/resources/application.yml` igual que T012
- [X] T014 [P] Configurar `backend/ms-reservas/src/main/resources/application.yml` igual que T012
- [X] T015 [P] Configurar `backend/ms-reportes/src/main/resources/application.yml`: **sin datasource, sin Flyway**, con las URLs de `ms-reservas` y `ms-canchas` por variable de entorno, Actuator y springdoc
- [X] T016 [P] Configurar `backend/api-gateway/src/main/resources/application.yml`: URLs de los cuatro servicios destino por variable de entorno y Actuator

**Checkpoint**: `docker compose up postgres edge` levanta; las tres bases existen con sus roles aislados.

---

## Phase 2: Foundational — la rebanada de autenticación (BLOQUEANTE)

**Purpose**: Sin identidad no hay historia demostrable: RN-03 y RN-06 no existen y ninguna pantalla
se puede abrir. Esta fase corta verticalmente shell → edge → gateway → `ms-usuarios` → `usuarios_db`.

**⚠️ CRÍTICO**: Ninguna historia puede empezar hasta que esta fase esté completa.

### `ms-usuarios` — dominio y autenticación

- [X] T017 [P] Crear el modelo de dominio en `backend/ms-usuarios/src/main/java/com/ups/reservacanchas/usuarios/domain/`: `User` y `Role` (`USUARIO_FINAL`, `ADMINISTRADOR` según R-001), sin ninguna anotación de framework
- [X] T018 [P] Crear `domain/exception/`: `InvalidCredentialsException`, `UserAlreadyExistsException`, `UserNotFoundException` — sin `HttpStatus` ni nada de `org.springframework.web`
- [X] T019 [P] Crear los `record` de `dto/`: `RegistroRequest`, `LoginRequest`, `UsuarioResponse` (nunca expone el hash), `ErrorResponse`, con `jakarta.validation`, según `contracts/auth-usuarios.yaml`
- [X] T020 Crear el puerto de entrada `application/port/in/UserUseCase.java` con las operaciones de registro, autenticación y consulta
- [X] T021 Crear el puerto de salida `application/port/out/UserRepositoryPort.java`
- [X] T022 Implementar `application/service/UserService.java`: registro siempre como `USUARIO_FINAL` activo (FR-001), rechazo de `username` duplicado (FR-002), verificación de credenciales sin revelar cuál dato falló (FR-003) y rechazo de cuenta inactiva (FR-005)
- [X] T023 [P] Escribir `src/test/java/com/ups/reservacanchas/usuarios/application/service/UserServiceTest.java` con el puerto mockeado: credenciales válidas, inválidas, usuario inactivo y `username` duplicado
- [X] T024 Implementar `adapter/out/persistence/`: `UserEntity` package-private con `@Entity`, su `JpaRepository` y `UserRepositoryAdapter` que traduce entidad ↔ dominio
- [X] T025 [P] Crear `src/main/resources/db/migration/V1__usuarios.sql` con la tabla `usuario`, su `CHECK` de rol y el índice único de `username`, según data-model.md
- [X] T026 [P] Crear `V2__seed_usuarios.sql` con `admin`, `cliente1`, `cliente2` y `inactivo`, con las contraseñas del quickstart hasheadas con BCrypt
- [X] T027 Implementar `adapter/in/web/AuthController.java` con `POST /api/auth/registro` y `POST /api/auth/login`, según `contracts/auth-usuarios.yaml`
- [X] T028 Implementar `adapter/in/web/ErrorHandler.java`: traduce las excepciones de dominio a 400/401/404/409 con el cuerpo de error uniforme de `contracts/README.md`
- [X] T029 [P] Crear `config/PasswordEncoderConfig.java` (solo `BCryptPasswordEncoder`, sin cadena de filtros) y `config/OpenApiConfig.java`
- [X] T030 Añadir el servicio `ms-usuarios` a `docker-compose.yml` con su credencial de `usuarios_db`, healthcheck de Actuator y `depends_on: postgres healthy`

### `api-gateway` — identificación y enrutamiento (sin hexagonal)

- [X] T031 [P] Implementar `backend/api-gateway/src/main/java/com/ups/reservacanchas/gateway/RouteConfig.java`: `/api/auth/**` y `/api/usuarios/**` → `ms-usuarios`, `/api/canchas/**` → `ms-canchas`, `/api/reservas/**` → `ms-reservas`, `/api/reportes/**` → `ms-reportes`
- [X] T032 Implementar `gateway/AuthenticationFilter.java`: **descarta toda cabecera `X-User-*` entrante**, deja pasar sin credencial las dos rutas públicas de `/api/auth`, decodifica `Authorization: Basic`, verifica contra `ms-usuarios` e inyecta `X-User-Id` y `X-User-Role` (R-003)
- [X] T033 [P] Implementar `gateway/ErrorHandler.java`: traduce credencial ausente o inválida a 401 y el servicio destino caído a 503, con el mismo cuerpo de error uniforme
- [X] T034 Escribir `backend/api-gateway/src/test/java/com/ups/reservacanchas/gateway/AuthenticationFilterTest.java`: una `X-User-Role: ADMINISTRADOR` enviada por el cliente se descarta, y las rutas públicas pasan sin credencial
- [X] T035 Añadir el servicio `gateway` a `docker-compose.yml` con `depends_on: ms-usuarios healthy`

### Shell — fuera la autenticación de mentira

- [X] T036 [P] Crear `frontend/shell/src/api/client.ts`: adjunta `Authorization: Basic` desde `localStorage`, parsea el cuerpo de error uniforme y expone el código HTTP a la pantalla
- [X] T037 Reescribir `frontend/shell/src/auth/AuthContext.tsx`: eliminar `MOCK_USERS`, que `login()` llame a `POST /api/auth/login` y guarde la credencial, y exponer `sesion` con `{ usuarioId, nombre, rol }`
- [X] T038 Renombrar el tipo `Role` a `'USUARIO_FINAL' | 'ADMINISTRADOR'` en `frontend/shell/src/auth/AuthContext.tsx` y actualizar `HOME_BY_ROLE` en `frontend/shell/src/auth/RoleRoute.tsx` (R-001; las rutas del navegador no cambian)
- [X] T039 Sustituir la prop `token` por `sesion` en los tres remotes de `frontend/shell/src/App.tsx` y actualizar `RoleRoute allow={[...]}` a los nuevos valores de rol (R-002)
- [X] T040 [P] Actualizar la firma de props de los remotes en `frontend/shell/src/types/remotes.d.ts`
- [X] T041 Conectar `frontend/shell/src/pages/Login.tsx` a `/api/auth/login` y `/api/auth/registro`, mostrar el motivo del 401, y retirar de la pantalla las credenciales de demostración
- [X] T042 [P] Reducir `frontend/shell/src/pages/Perfil.tsx` a solo lectura sobre la prop `sesion`, retirando los controles de edición y la carga de foto (R-006)

**Checkpoint**: `docker compose up` levanta edge, gateway, `ms-usuarios` y el shell. Se puede
registrar una cuenta, entrar, ver el nombre y el rol en pantalla, y salir. Un usuario inactivo es
rechazado. Una `X-User-Role` falsificada por el cliente no tiene efecto.

---

## Phase 3: User Story 1 — Reservar y cancelar como usuario final (P1) 🎯 MVP

**Goal**: Un usuario final consulta disponibilidad, reserva un bloque, lo ve en Mis reservas y lo
cancela, liberando el bloque. Cubre §7.1 y §7.3.

**Independent Test**: Partiendo del catálogo sembrado: entrar como `cliente1`, consultar la
disponibilidad de una cancha de pádel para mañana, reservar un bloque libre, verlo ocupado al
reconsultar, chocar con un 409 al intentar reservarlo de nuevo, cancelarlo y verlo libre otra vez.
Es el escenario V1 del quickstart.

### `ms-canchas` — solo el lado de lectura del catálogo

- [X] T043 [P] [US1] Crear el modelo de dominio en `backend/ms-canchas/src/main/java/com/ups/reservacanchas/canchas/domain/`: `Court`, `Sport` (`PADEL`, `TENIS`, `BASQUET` según R-008) y `OpeningHours`, sin anotaciones
- [X] T044 [P] [US1] Crear `domain/exception/CourtNotFoundException.java`
- [X] T045 [P] [US1] Crear los `record` de `dto/`: `CanchaResponse`, `ErrorResponse`, según `contracts/canchas.yaml`
- [X] T046 [US1] Crear `application/port/in/CourtUseCase.java` con las operaciones de lectura (listar con filtro de deporte y estado, consultar una)
- [X] T047 [US1] Crear `application/port/out/CourtRepositoryPort.java`
- [X] T048 [US1] Implementar `application/service/CourtService.java` con las operaciones de lectura, devolviendo por defecto solo canchas activas (FR-011)
- [X] T049 [US1] Implementar `adapter/out/persistence/`: `CourtEntity` package-private, su `JpaRepository` y `CourtRepositoryAdapter`
- [X] T050 [P] [US1] Crear `backend/ms-canchas/src/main/resources/db/migration/V1__canchas.sql` con la tabla `cancha`, su `CHECK` de deporte y el `CHECK hora_cierre > hora_apertura`
- [X] T051 [P] [US1] Crear `V2__seed_canchas.sql`: al menos una cancha por deporte con horario 07:00–22:00, una cancha inactiva, y nombres que permitan demanda desigual para el ranking de US3
- [X] T052 [US1] Implementar `adapter/in/web/CourtController.java` con `GET /api/canchas` y `GET /api/canchas/{id}`
- [X] T053 [P] [US1] Implementar `adapter/in/web/ErrorHandler.java` de `ms-canchas` con el cuerpo de error uniforme
- [X] T054 [US1] Añadir el servicio `ms-canchas` a `docker-compose.yml` con su credencial de `canchas_db`

### `ms-reservas` — el dominio de las reglas

- [X] T055 [P] [US1] Crear el modelo de dominio en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/domain/`: `Booking`, `BookingStatus` (`CONFIRMADA`, `CANCELADA`, `FINALIZADA` según R-007) y `TimeSlot`, sin anotaciones
- [X] T056 [P] [US1] Crear `domain/exception/`: `SlotAlreadyBookedException`, `ActiveBookingLimitExceededException`, `PastBookingCancellationException`, `ForbiddenOperationException`, `BookingNotFoundException`, `CourtNotBookableException`
- [X] T057 [P] [US1] Crear los `record` de `dto/`: `ReservaRequest` (sin `usuarioId`), `ReservaResponse`, `Bloque`, `DisponibilidadResponse`, `ErrorResponse`, según `contracts/reservas.yaml`
- [X] T058 [US1] Crear `application/port/in/BookingUseCase.java`: crear, consultar disponibilidad, listar las propias y cancelar
- [X] T059 [US1] Crear los puertos de salida en `application/port/out/`: `BookingRepositoryPort`, `ConfigurationRepositoryPort` y `CourtClientPort`
- [X] T060 [P] [US1] Crear `backend/ms-reservas/src/main/resources/db/migration/V1__reservas.sql` con la tabla `reserva` y la restricción `EXCLUDE USING gist (... ) WHERE (estado = 'CONFIRMADA')` exactamente como la fija data-model.md — sin claves foráneas hacia otras bases
- [X] T061 [P] [US1] Crear `V2__configuracion.sql` con la tabla `configuracion` y la fila `max_reservas_activas = 3` (RN-06)
- [X] T062 [P] [US1] Crear `V3__seed_reservas.sql` con reservas en los tres estados y **fechas relativas al arranque**: las confirmadas futuras para poder cancelar en vivo, sin solapamientos y sin exceder el tope
- [X] T063 [US1] Implementar en `application/service/BookingService.java` la creación de reserva: RN-01 (cancha, fecha y bloque), RN-02 (comprobación previa de solapamiento), RN-06 (tope leído por `ConfigurationRepositoryPort`) y RN-08 (nace `CONFIRMADA`); rechaza al `ADMINISTRADOR` con 403 (FR-018)
- [X] T064 [US1] Implementar en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/BookingService.java` el cálculo de disponibilidad: todos los bloques del horario de atención obtenido por `CourtClientPort`, marcados libre u ocupado (FR-007 a FR-009, FR-011)
- [X] T065 [US1] Implementar en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/BookingService.java` la cancelación por el dueño: RN-03 rama `USUARIO_FINAL` con 403 sobre reservas ajenas, RN-04 (solo antes de la hora de inicio) y RN-05 (pasa a `CANCELADA` y libera el bloque)
- [X] T066 [US1] Implementar en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/BookingService.java` la derivación de `FINALIZADA` al leer: una confirmada cuyo bloque ya terminó no cuenta como activa para RN-06 ni se puede cancelar (FR-027, FR-028)
- [X] T067 [P] [US1] Escribir `src/test/java/com/ups/reservacanchas/reservas/application/service/BookingServiceCreacionTest.java` con los puertos mockeados: caso feliz de RN-01, rechazo de RN-02, rechazo de RN-06 y estado inicial de RN-08
- [X] T068 [P] [US1] Escribir `BookingServiceCancelacionTest.java` con los puertos mockeados: RN-03 propia y ajena, RN-04 pasada y futura, RN-05 liberación del bloque y recuperación de cupo
- [X] T069 [US1] Implementar `adapter/out/persistence/`: `BookingEntity` package-private, su `JpaRepository` y `BookingRepositoryAdapter`, que **captura la violación de la restricción `EXCLUDE` y la traduce a `SlotAlreadyBookedException`** para que el dominio no vea la excepción de base de datos (R-004)
- [X] T070 [P] [US1] Implementar `adapter/out/persistence/ConfigurationRepositoryAdapter.java` y su entidad, sobre la tabla `configuracion`
- [X] T071 [US1] Implementar `adapter/out/client/CourtClientAdapter.java` con `RestClient` hacia `ms-canchas`, implementando `CourtClientPort` — nunca leyendo `canchas_db` (Principio IV)
- [X] T072 [US1] Implementar `adapter/in/web/BookingController.java`: `POST /api/reservas`, `GET /api/reservas/disponibilidad`, `GET /api/reservas/mias`, `POST /api/reservas/{id}/cancelacion`, tomando la identidad de `X-User-Id` y `X-User-Role`
- [X] T073 [US1] Implementar `adapter/in/web/ErrorHandler.java` de `ms-reservas`: 409 para `SlotAlreadyBookedException`, `ActiveBookingLimitExceededException` y `PastBookingCancellationException`; 403, 404 y 422 según el catálogo de `contracts/README.md`
- [X] T074 [P] [US1] Crear `config/RestClientConfig.java` y `config/OpenApiConfig.java` en `ms-reservas`
- [X] T075 [US1] Añadir el servicio `ms-reservas` a `docker-compose.yml` con su credencial de `reservas_db` y `depends_on: ms-canchas healthy`
- [X] T076 [US1] Escribir la prueba de concurrencia de RN-02 en `src/test/java/com/ups/reservacanchas/reservas/adapter/out/persistence/ConcurrenciaReservaIT.java`: dos hilos que reservan el mismo bloque a la vez contra PostgreSQL real; exactamente uno confirma y el otro recibe `SlotAlreadyBookedException`. Es lo que mide SC-004 y lo exige el Principio II

### `mf-reservas` — conectar las tres pantallas

- [X] T077 [P] [US1] Crear `frontend/mf-reservas/src/api/client.ts` con las llamadas a `/api/canchas` y `/api/reservas`, reutilizando el patrón del cliente del shell
- [X] T078 [US1] Aceptar la prop `sesion` en `frontend/mf-reservas/src/App.tsx` y propagarla a las pantallas (R-002)
- [X] T079 [US1] Conectar `frontend/mf-reservas/src/pages/Disponibilidad.tsx`: eliminar los arreglos fijos `canchas` y `dias`, cargar el catálogo de `GET /api/canchas` y los bloques de `GET /api/reservas/disponibilidad`, y renombrar el deporte `'Basket'` a `'Básquet'` (R-008)
- [X] T080 [US1] Conectar `frontend/mf-reservas/src/pages/NuevaReserva.tsx` a `POST /api/reservas`, mostrando en pantalla el motivo del **409** de bloque ocupado y el del tope de RN-06
- [X] T081 [US1] Conectar `frontend/mf-reservas/src/pages/MisReservas.tsx`: eliminar el arreglo fijo `reservas`, cargar de `GET /api/reservas/mias`, renombrar el estado `'pasada'` a `FINALIZADA` en el tipo, las etiquetas y los filtros (R-007), y cancelar con `POST /api/reservas/{id}/cancelacion`

### Compuerta 8 — diagrama e informe

- [X] T082 [P] [US1] Actualizar `diagramas/workspace.dsl`: la ruta `/api/auth` en `RouteConfig`, el componente `AuthController` en la vista de `ms-usuarios`, la relación `AuthenticationFilter → ms-usuarios`, y el contenedor `rc-postgres` con sus tres bases en la vista de despliegue (R-009). Regenerar los SVG
- [X] T083 [P] [US1] Actualizar `informe/secciones/04-arquitectura.tex`, `05-modelo-datos.tex` y `06-reglas-negocio.tex` con lo construido en esta historia, y regenerar las figuras de `informe/figuras/`

**Checkpoint**: US1 completa y demostrable sola. Escenarios V1 y V2 del quickstart en verde. Es el MVP.

---

## Phase 4: User Story 2 — Catálogo y cancelación administrativa (P2)

**Goal**: El administrador gestiona el catálogo de canchas, registra bloqueos de mantenimiento y
cancela cualquier reserva del sistema. Cubre §7.2.

**Independent Test**: Entrar como `admin`, crear una cancha de básquet, verla aparecer en la
disponibilidad de `cliente1`, editarle el horario, bloquearla por mantenimiento, inactivarla, y
cancelar una reserva ajena desde el listado global. Es el escenario V3 del quickstart.

- [ ] T084 [P] [US2] Añadir `MaintenanceBlock` al dominio de `backend/ms-canchas/.../canchas/domain/` y `MaintenanceBlockOverlapException` a `domain/exception/`
- [ ] T085 [P] [US2] Añadir los `record` `CanchaRequest`, `BloqueoRequest` y `BloqueoResponse` a `dto/` de `ms-canchas`, con `jakarta.validation` y el deporte como enumeración cerrada (R-008)
- [ ] T086 [US2] Ampliar `application/port/in/CourtUseCase.java` y `application/port/out/CourtRepositoryPort.java` con crear, editar, cambiar estado y gestionar bloqueos
- [ ] T087 [US2] Implementar en `application/service/CourtService.java` la escritura del catálogo: crear, editar y cambiar estado, con **RN-07** (solo `ADMINISTRADOR`, leído de `X-User-Role`) y la validación de que la hora de cierre es posterior a la de apertura
- [ ] T088 [US2] Implementar en `backend/ms-canchas/src/main/java/com/ups/reservacanchas/canchas/application/service/CourtService.java` el registro y retiro de bloqueos de mantenimiento (FR-034), sin cancelar las reservas existentes (§3.3.3)
- [ ] T089 [P] [US2] Escribir `CourtServiceTest.java` con el puerto mockeado: **RN-07** con rol administrador y con rol usuario final, horario inválido, e inactivación que conserva la cancha
- [ ] T090 [P] [US2] Crear `backend/ms-canchas/src/main/resources/db/migration/V3__bloqueos.sql` con la tabla `bloqueo_mantenimiento`, su FK a `cancha` y el `CHECK hasta > desde`
- [ ] T091 [US2] Ampliar `adapter/out/persistence/` de `ms-canchas` con `MaintenanceBlockEntity` y los métodos nuevos del adaptador
- [ ] T092 [US2] Ampliar `adapter/in/web/CourtController.java` con `POST /api/canchas`, `PUT /api/canchas/{id}`, `PATCH /api/canchas/{id}/estado` y las rutas de `/bloqueos`, según `contracts/canchas.yaml`
- [ ] T093 [US2] Ampliar `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/port/out/CourtClientPort.java` y `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/adapter/out/client/CourtClientAdapter.java` para leer los bloqueos vigentes de una cancha
- [ ] T094 [US2] Ampliar el cálculo de disponibilidad en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/BookingService.java` para marcar como `MANTENIMIENTO` y no reservables los bloques comprendidos en un bloqueo vigente (FR-010)
- [ ] T095 [US2] Implementar en `backend/ms-reservas/src/main/java/com/ups/reservacanchas/reservas/application/service/BookingService.java` la rama `ADMINISTRADOR` de la cancelación: puede cancelar cualquier reserva, con la misma restricción temporal de RN-04 (FR-020, FR-021)
- [ ] T096 [P] [US2] Ampliar `BookingServiceCancelacionTest.java` con la rama de administrador: cancela ajena con éxito, y falla igual sobre una reserva ya iniciada
- [ ] T097 [US2] Añadir `GET /api/reservas` (listado global, solo `ADMINISTRADOR`) a `BookingUseCase`, `BookingService`, `BookingRepositoryPort` y `BookingController`, con los filtros de fecha, cancha y estado de `contracts/reservas.yaml`
- [ ] T098 [US2] Conectar `frontend/mf-administracion/src/pages/GestionCanchas.tsx`: eliminar el arreglo fijo `canchas`, conectar el ABM completo, y **sustituir el filtro `'Fútbol'` por `'Básquet'`** (R-008)
- [ ] T099 [US2] Añadir a `GestionCanchas.tsx` la gestión de bloqueos de mantenimiento sobre `/api/canchas/{id}/bloqueos`
- [ ] T100 [US2] Conectar `frontend/mf-administracion/src/pages/GestionReservas.tsx`: eliminar el arreglo fijo `reservas`, cargar de `GET /api/reservas` y cancelar cualquiera con `POST /api/reservas/{id}/cancelacion`
- [ ] T101 [US2] Aceptar la prop `sesion` en `frontend/mf-administracion/src/App.tsx` y propagarla a sus pantallas
- [ ] T102 [P] [US2] Actualizar `diagramas/workspace.dsl` con los componentes nuevos de `ms-canchas` y la relación de `ms-reservas` hacia los bloqueos, y regenerar los SVG (compuerta 8)

**Checkpoint**: US1 y US2 funcionan de forma independiente. Escenario V3 del quickstart en verde.

---

## Phase 5: User Story 3 — Los cuatro indicadores (P3)

**Goal**: El administrador consulta los cuatro indicadores de §3.3.5 sobre un rango de fechas, con
datos consistentes con las reservas registradas. Cubre §7.4.

**Independent Test**: Elegir un rango, verificar los cuatro indicadores contra un conteo manual del
listado global, cancelar una reserva del rango y ver reflejarse el cambio. Es el escenario V4.

- [ ] T103 [P] [US3] Crear el modelo de dominio en `backend/ms-reportes/src/main/java/com/ups/reservacanchas/reportes/domain/`: `PeriodSummary`, `OccupancyReport`, `DemandRanking` y `CancellationReport`, sin anotaciones
- [ ] T104 [P] [US3] Crear `domain/exception/UpstreamUnavailableException.java` e `InvalidDateRangeException.java`
- [ ] T105 [P] [US3] Crear los `record` de `dto/` de `ms-reportes` según `contracts/reportes.yaml`: `ReservasPorPeriodo`, `OcupacionCancha`, `Cancelaciones`, `RankingDemanda`, `Resumen`, `ErrorResponse`
- [ ] T106 [US3] Crear `application/port/in/ReportUseCase.java` y los puertos de salida `application/port/out/BookingsClientPort.java` y `CourtsClientPort.java`
- [ ] T107 [US3] Implementar en `application/service/ReportService.java` los indicadores 1 y 3: reservas por cancha y por deporte contando `CONFIRMADA` y `FINALIZADA` (FR-038), y cancelaciones por fecha de cancelación (FR-040)
- [ ] T108 [US3] Implementar en `backend/ms-reportes/src/main/java/com/ups/reservacanchas/reportes/application/service/ReportService.java` el indicador 2: ocupación por cancha como horas reservadas sobre horas del horario de atención en los días del rango, incluyendo las canchas sin reservas con 0% (FR-039)
- [ ] T109 [US3] Implementar en `backend/ms-reportes/src/main/java/com/ups/reservacanchas/reportes/application/service/ReportService.java` el indicador 4: **ranking de demanda** con todas las canchas ordenadas de mayor a menor, incluidas las de cero, señalando los extremos de mayor y menor demanda (FR-041)
- [ ] T110 [P] [US3] Escribir `ReportServiceTest.java` con ambos puertos mockeados: los cuatro indicadores sobre un conjunto conocido, el rango sin datos (FR-044) y la exclusión de las canceladas del conteo de reservas
- [ ] T111 [US3] Implementar `adapter/out/client/BookingsClientAdapter.java` y `CourtsClientAdapter.java` con `RestClient` hacia `ms-reservas` y `ms-canchas` — **sin base de datos, sin JPA, sin Flyway** (Principio IV)
- [ ] T112 [US3] Implementar `adapter/in/web/ReportController.java` con las cinco rutas de `contracts/reportes.yaml`, restringidas a `ADMINISTRADOR` (FR-043)
- [ ] T113 [P] [US3] Implementar `adapter/in/web/ErrorHandler.java` de `ms-reportes`: 400 para rango invertido, 403 para rol insuficiente y 503 para servicio origen caído
- [ ] T114 [US3] Añadir el servicio `ms-reportes` a `docker-compose.yml` **sin credencial de base**, con las URLs de `ms-reservas` y `ms-canchas` y `depends_on` de ambos
- [ ] T115 [US3] Conectar `frontend/mf-reportes/src/pages/ReportesYEstadisticas.tsx`: eliminar los cuatro arreglos fijos `metricas`, `reservasPorDeporte`, `ocupacionPorCancha` y `rankingDemanda`, y cargarlos de `/api/reportes/**` con el rango elegido
- [ ] T116 [US3] Añadir a `ReportesYEstadisticas.tsx` el selector de rango de fechas y el estado vacío cuando el rango no tiene datos (FR-044)
- [ ] T117 [US3] Aceptar la prop `sesion` en `frontend/mf-reportes/src/App.tsx`
- [ ] T118 [US3] Reconducir `frontend/mf-administracion/src/pages/Panel.tsx`: alimentar las cuatro tarjetas de `GET /api/reportes/resumen` acotado al día en curso, y **retirar las comparaciones inventadas** `'+12% vs ayer'`, `'+2% vs promedio'` y `'Horario Pico'`, que no son ninguno de los cuatro indicadores (R-005)
- [ ] T119 [P] [US3] Actualizar `informe/secciones/07-resultados.tex` con los indicadores ya demostrables (compuerta 8)

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente. Escenario V4 del quickstart en verde.

---

## Phase 6: User Story 4 — Gestión de usuarios (P4)

**Goal**: El administrador consulta los usuarios y los activa o inactiva; un usuario inactivo no
entra. Cubre la fila de gestión de usuarios de §3.1.

**Independent Test**: Listar usuarios, inactivar a `cliente2`, fallar al entrar con él, reactivarlo
y entrar con éxito, comprobando que sus reservas siguen ahí. Es el escenario V5 del quickstart.

- [ ] T120 [US4] Ampliar `application/port/in/UserUseCase.java` y `application/port/out/UserRepositoryPort.java` de `ms-usuarios` con listar usuarios y cambiar su estado
- [ ] T121 [US4] Implementar en `application/service/UserService.java` el listado (FR-045) y el cambio de estado (FR-046), restringidos a `ADMINISTRADOR` (FR-048)
- [ ] T122 [P] [US4] Ampliar `UserServiceTest.java`: listado con rol administrador, rechazo con rol usuario final, e inactivación que no toca nada fuera de `usuarios_db` (FR-047)
- [ ] T123 [US4] Ampliar `adapter/in/web/UserController.java` con `GET /api/usuarios`, `GET /api/usuarios/{id}` y `PATCH /api/usuarios/{id}/estado`, según `contracts/auth-usuarios.yaml`
- [ ] T124 [US4] Conectar `frontend/mf-administracion/src/pages/GestionUsuarios.tsx`: eliminar el arreglo fijo `usuarios`, cargar de `GET /api/usuarios` y activar o inactivar con `PATCH /api/usuarios/{id}/estado`
- [ ] T125 [US4] Verificar que `backend/api-gateway/src/main/java/com/ups/reservacanchas/gateway/AuthenticationFilter.java` rechaza con 401 a un usuario inactivado mientras tenía la sesión abierta, y que el shell lo devuelve a la pantalla de inicio de sesión

**Checkpoint**: las cuatro historias funcionan de forma independiente. Escenario V5 en verde.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T126 Ejecutar los cinco escenarios de `specs/001-reserva-canchas-deportivas/quickstart.md` desde cero (`docker compose down -v && docker compose up`) y verificar los cinco escenarios V1 a V5
- [ ] T127 Verificar SC-004 con el escenario V2 de `specs/001-reserva-canchas-deportivas/quickstart.md`, 10 repeticiones del escenario de concurrencia de RN-02: 10 veces exactamente un 201 y un 409
- [ ] T128 Verificar SC-008 sobre `GET /api/reservas/disponibilidad`: la respuesta responde en menos de 2 s con al menos 500 reservas cargadas; si no, aplicar la caché de credencial verificada en el gateway prevista en R-003
- [ ] T129 [P] Revisar la regla de dependencia en los cuatro microservicios: ningún import de `adapter/` dentro de `application/service/`, ningún `@Entity` en `domain/`, ningún `HttpStatus` en `domain/exception/` (compuerta 4)
- [ ] T130 [P] Revisar la independencia de datos: cada `application.yml` apunta solo a su base, y `ms-reportes` no tiene datasource (compuerta 5)
- [ ] T131 [P] Verificar que los cuatro Swagger UI publican los contratos y coinciden con `contracts/` (compuerta 6)
- [ ] T132 [P] Verificar que `frontend/mf-reservas`, `frontend/mf-administracion` y `frontend/mf-reportes` compilan cada uno con `npm run build` sin compilar `frontend/shell` (Principio V)
- [ ] T133 Escribir el manual de despliegue (E5) a partir de `quickstart.md`, con la tabla de usuarios de prueba
- [ ] T134 Cierre de la compuerta 8: `diagramas/workspace.dsl` y todas las secciones de `informe/secciones/` reflejan el sistema construido, con las figuras regeneradas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1 (Setup)**: sin dependencias, empieza de inmediato
- **Fase 2 (Autenticación)**: depende de la Fase 1 — **BLOQUEA las cuatro historias**
- **Fase 3 (US1)**: depende de la Fase 2
- **Fase 4 (US2)**: depende de la Fase 2. Toca los mismos archivos que US1 en `ms-canchas` y `ms-reservas`, así que en la práctica va después de US1
- **Fase 5 (US3)**: depende de la Fase 2. Necesita datos que produzcan US1 y US2 para que los indicadores muestren algo
- **Fase 6 (US4)**: depende de la Fase 2 únicamente. Es la más independiente de las cuatro
- **Fase 7 (Polish)**: depende de las historias que se quieran cerrar

### Dentro de cada historia

Dominio y excepciones → puertos → servicio (con sus pruebas) → adaptadores → controlador → compose →
frontend. Las migraciones pueden escribirse en paralelo con el dominio, porque no dependen de él.

### Parallel Opportunities

- **Fase 1**: T002, T003, T004 en paralelo; los cinco Dockerfile (T007–T011) en paralelo; los cinco `application.yml` (T012–T016) en paralelo
- **Fase 2**: `ms-usuarios` (T017–T030), el gateway (T031–T035) y el shell (T036–T042) son tres frentes que solo convergen en el checkpoint. El gateway y el shell pueden avanzar contra el contrato antes de que `ms-usuarios` esté listo
- **Fase 3**: `ms-canchas` (T043–T054) y el dominio de `ms-reservas` (T055–T062) no comparten archivos. `mf-reservas` (T077–T081) puede avanzar contra el contrato en paralelo con el backend
- **Entre historias**: US4 no comparte ningún archivo con US2 ni con US3, así que un tercer par de manos puede llevarla en paralelo desde el final de la Fase 2

### Un dueño por servicio a la vez

La constitución lo pide en su sección de integración: dos personas no editan el mismo microservicio
en paralelo. El reparto natural es por frente —`ms-usuarios` + gateway, `ms-canchas`, `ms-reservas`,
frontend— y no por historia.

---

## Parallel Example: Fase 3 (US1)

```bash
# El dominio de los dos servicios, en paralelo (archivos distintos):
Task: "T043 Modelo de dominio Court/Sport/OpeningHours en ms-canchas"
Task: "T055 Modelo de dominio Booking/BookingStatus/TimeSlot en ms-reservas"
Task: "T056 Excepciones de dominio de ms-reservas"
Task: "T057 Records de dto/ de ms-reservas"

# Las migraciones, en paralelo con el dominio:
Task: "T050 V1__canchas.sql"
Task: "T060 V1__reservas.sql con la restricción EXCLUDE"
Task: "T061 V2__configuracion.sql"

# Las pruebas de reglas, una vez existe BookingService:
Task: "T067 BookingServiceCreacionTest — RN-01, RN-02, RN-06, RN-08"
Task: "T068 BookingServiceCancelacionTest — RN-03, RN-04, RN-05"
```

---

## Implementation Strategy

### MVP primero (solo US1)

1. Fase 1: Setup
2. Fase 2: Autenticación (bloquea todo)
3. Fase 3: US1
4. **PARAR Y VALIDAR**: escenarios V1 y V2 del quickstart
5. Con esto solo ya hay demostración de punta a punta y se cubren §7.1 y §7.3, que es el alcance
   funcional mínimo que §6.1 exige para no caer por debajo de Suficiente

### Entrega incremental

Cada historia añade valor sin romper la anterior, y cada checkpoint es un punto donde el proyecto se
puede enseñar:

| Después de | Se puede demostrar | Criterios cubiertos |
|---|---|---|
| Fase 2 | Entrar, ver identidad y rol, ser rechazado si la cuenta está inactiva | FR-001 a FR-006 |
| Fase 3 (US1) | El recorrido completo de reserva y cancelación | §7.1, §7.3 |
| Fase 4 (US2) | La administración del catálogo y la cancelación administrativa | §7.2 |
| Fase 5 (US3) | Los cuatro indicadores con datos reales | §7.4 |
| Fase 6 (US4) | La gestión del acceso de los usuarios | §3.1 |

§7.5 y §7.6 no aparecen en la tabla porque son estructurales: se cumplen desde la Fase 2, por la
forma en que está construido el sistema, y no por una historia concreta.

---

## Notes

- Las ocho compuertas de calidad de la constitución aplican a **cada historia**, no al final. La
  octava —`workspace.dsl` y el informe actualizados en el mismo cambio— tiene tareas explícitas en
  las fases 3, 4 y 5 precisamente para que no se acumule
- Toda tarea de backend arranca leyendo `template-backend/ARQUITECTURA.md`; el ejemplo vivo es
  `template-backend/microservice-template/`, que no se modifica
- Las pruebas de regla de negocio usan el puerto de salida mockeado, nunca JPA
- `[P]` significa archivos distintos y sin dependencias pendientes
- Commit por tarea o por grupo lógico; `main` siempre levanta
