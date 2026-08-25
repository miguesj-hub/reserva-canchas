<!--
SYNC IMPACT REPORT
==================
Versión: (plantilla sin ratificar) → 1.0.0 → 1.1.0
Tipo de cambio: MAJOR — ratificación inicial (1.0.0). La plantilla no tenía ningún
principio definido; esa versión estableció los siete principios rectores y la
estructura de gobierno del proyecto integrador.
Enmienda 1.1.0 (MINOR): se resuelve TODO(SEED_DATA_ALCANCE). El Principio VII pasa
de exigir genéricamente "datos de prueba cargados" a fijar el contenido mínimo
verificable del seed, incluidas reservas de ejemplo en los tres estados de RN-08.
Es MINOR y no PATCH porque añade una obligación nueva y verificable sobre E4:
una feature puede ahora fallar la compuerta 7 por un seed que no puebla reportes.

Principios definidos (ninguno renombrado; no había versión previa):
  - I. Alcance Cerrado y Trazable
  - II. Reglas de Negocio en el Dominio, con Prueba (NO NEGOCIABLE)
  - III. Regla de Dependencia Hexagonal (NO NEGOCIABLE)
  - IV. Independencia de Datos entre Microservicios
  - V. Microfrontends Autónomos
  - VI. Contrato Antes que Implementación
  - VII. Levantar con un Solo Comando

Secciones añadidas:
  - Restricciones Técnicas
  - Integración de Aportes del Equipo
  - Compuertas de Calidad

Secciones eliminadas: ninguna (la plantilla estaba vacía).

Decisiones recogidas, no reabiertas: arquitectura hexagonal por microservicio
(template-backend/ARQUITECTURA.md), paquete base com.ups.reservacanchas.<dominio>,
versiones de backend/STACK.md, autenticación básica con roles (§4.4), prohibición
de acceso cruzado a bases de datos (§4.3), Edge nginx de origen único, aislamiento
de bases por credenciales, ms-reportes sin base propia, RN-02 sostenida por
restricción EXCLUDE de PostgreSQL, Flyway con ddl-auto: validate.

TODO resueltos en 1.1.0:
  - TODO(SEED_DATA_ALCANCE) → resuelto: el seed incluye usuarios, catálogo de
    canchas y reservas de ejemplo. Decisión del equipo, 2026-08-24.

TODO pendientes:
  - TODO(RUTA_TEMPLATE): `template-backend/ARQUITECTURA.md` referencia el
    template como `backend/microservice-template/`, pero en el repositorio vive
    en `template-backend/microservice-template/`. Esta constitución usa la ruta
    real; corregir la referencia en ARQUITECTURA.md fuera de este flujo.
-->

# Constitución del Sistema de Reserva de Canchas Deportivas

Proyecto integrador de la Maestría en Ingeniería de Software — Desarrollo de
Aplicaciones Empresariales. El proyecto se califica sobre una rúbrica de 100
puntos definida en `Alcance_Funcional_Reserva_Canchas_v2.md` §6, con los
criterios de aceptación de §7. Esa rúbrica es el único juez del proyecto: cada
principio de esta constitución existe porque defiende puntos concretos de ella,
y se declara contra qué criterio se verifica. Un principio que no aterrice en
puntos no pertenece a este documento.

Documentos que esta constitución gobierna pero no repite:

- `Alcance_Funcional_Reserva_Canchas_v2.md` — fuente de la verdad de requisitos,
  reglas de negocio RN-01 a RN-08, entregables E1–E6, rúbrica y aceptación.
- `diagramas/workspace.dsl` — modelo C4 (contexto, contenedores, componentes,
  despliegue). Es el contrato estructural del sistema.
- `backend/STACK.md` — versiones resueltas, dependencias por microservicio,
  puertos y convenciones.
- `template-backend/ARQUITECTURA.md` — estructura hexagonal interna de cada
  microservicio, con `template-backend/microservice-template/` como ejemplo vivo.

## Core Principles

### I. Alcance Cerrado y Trazable

Todo trabajo DEBE trazar a una funcionalidad de `Alcance_Funcional_Reserva_Canchas_v2.md`
§3.1–§3.3, a una regla RN-01…RN-08, o a un entregable E1–E6. Si una idea no traza,
no se construye — sin excepción, sin "ya que estamos", sin refactor oportunista.

Lo que §3.5 declara fuera de alcance está prohibido: pasarela de pagos,
notificaciones (correo/SMS/push), reservas recurrentes, torneos o inscripciones
grupales, app móvil nativa, y reportes de BI o exportación analítica.

El alcance implementado incluye explícitamente, porque §3.1 se los atribuye al
administrador y la rúbrica los cuenta:

- Gestión de usuarios (activar/inactivar), consumiendo `/api/usuarios` desde
  `mf-administracion`. Es una fila de la tabla §3.1 y por tanto es alcance, no extra.
- Los cuatro indicadores de §3.3.5: reservas por cancha y por deporte en un rango,
  porcentaje de ocupación por cancha, cancelaciones por período, y el ranking de
  canchas con mayor y menor demanda.

Cada spec y cada tarea DEBE nombrar en su encabezado la funcionalidad, RN o
entregable que la justifica.

**Se verifica contra**: rúbrica "Alcance funcional implementado" (25%) y "Módulo
de reportes básicos" (10%); criterios de aceptación 1, 2 y 4.

**Razón**: la rúbrica premia el alcance definido y no otorga un solo punto por
funcionalidad adicional. El tiempo gastado fuera del alcance se resta del tiempo
disponible para los criterios que sí puntúan.

### II. Reglas de Negocio en el Dominio, con Prueba (NO NEGOCIABLE)

Cada regla RN-01 a RN-08 DEBE estar implementada en `application/service/` del
microservicio dueño de la regla y DEBE tener al menos una prueba unitaria que la
ejerza directamente, con el puerto de salida mockeado — sin levantar Spring, sin
base de datos. La prueba DEBE nombrar la regla que cubre (por ejemplo,
`rechaza_reserva_solapada_RN02`).

Ninguna decisión de negocio —un `if` que determine si algo se permite— puede vivir
en `adapter/in/web/`, en el gateway, ni en el frontend. La validación en el
frontend es cortesía de UX; la regla vive en el dominio y el backend la aplica
aunque el cliente la ignore.

RN-02 (solapamiento) DEBE tener, además de su prueba unitaria, una prueba de
concurrencia que dispare dos solicitudes simultáneas sobre el mismo bloque
horario y verifique que exactamente una gana y la otra recibe HTTP 409.

**Se verifica contra**: rúbrica "Reglas de negocio y validaciones" (10%, con RN-02
señalada explícitamente); criterio de aceptación 3.

**Razón**: la rúbrica exige "en especial la validación de solapamiento". Una
regla probable sin Spring es una regla demostrable en la defensa (E6) en
segundos; una regla enterrada en un controller solo se puede demostrar haciendo
clic y cruzando los dedos.

### III. Regla de Dependencia Hexagonal (NO NEGOCIABLE)

Cada microservicio DEBE seguir la estructura de `template-backend/ARQUITECTURA.md`,
con paquete base `com.ups.reservacanchas.<dominio>` — el que ya usan los cinco
proyectos, que no se renombra — y subpaquetes y nombres de clase en inglés, para
que correspondan 1:1 con las cajas de `diagramas/workspace.dsl`.

Prohibiciones absolutas:

- `application/service/` NUNCA importa nada de `adapter/`: ni `JpaRepository`,
  ni `RestClient`, ni `org.springframework.web`. Si necesita persistencia o red,
  declara un puerto de salida en `application/port/out/`.
- `domain/` NUNCA conoce JPA, HTTP ni el framework. El modelo de dominio no lleva
  `@Entity`; la entidad JPA es una clase distinta, package-private, dentro de
  `adapter/out/persistence/`.
- Las excepciones de `domain/exception/` no llevan `HttpStatus`. La traducción a
  código HTTP es responsabilidad exclusiva del `ErrorHandler` en `adapter/in/web/`.
- Ningún controller devuelve una entidad JPA ni un modelo de dominio: siempre un
  `record` de `dto/`.
- El adaptador de entrada depende del puerto de entrada (`*UseCase`), nunca de la
  implementación (`*Service`) ni del puerto de salida.
- Inyección por constructor con campos `final`; sin `@Autowired` en campos.

El `api-gateway` queda exceptuado de la estructura hexagonal: es enrutamiento e
infraestructura transversal sin dominio propio, y conserva la forma simple que
muestra la vista `08-Componentes-gateway` (`AuthenticationFilter → RouteConfig →
ErrorHandler`).

Toda clase nueva DEBE tener una caja equivalente en `diagramas/workspace.dsl`. Si
no la tiene, o el diagrama está desactualizado (y se actualiza), o la clase no
debería existir todavía.

**Se verifica contra**: rúbrica "Arquitectura de microservicios" (15%) y "Calidad
técnica y documentación" (10%); entregable E1.

**Razón**: la rúbrica califica "responsabilidades bien delimitadas", y §6.1 fija
un techo de nivel Suficiente para quien no aplique la arquitectura solicitada. La
correspondencia 1:1 entre paquete y caja del C4 convierte el diagrama de E1 en
una afirmación verificable sobre el código, no en un dibujo aspiracional.

### IV. Independencia de Datos entre Microservicios

Ningún microservicio lee ni escribe la base de datos de otro. Si necesita datos
de otro dominio, los pide por HTTP/REST síncrono al servicio dueño de esa base, a
través de un puerto de salida en `application/port/out/` y su adaptador en
`adapter/out/client/`.

Consecuencias obligatorias:

- `ms-usuarios` es el único que toca `usuarios_db`; `ms-canchas`, `canchas_db`;
  `ms-reservas`, `reservas_db`.
- `ms-reportes` NO tiene base de datos propia, ni driver JDBC, ni JPA, ni Flyway.
  Los cuatro indicadores de §3.3.5 se calculan agregando en `ReportService` lo que
  devuelven `BookingsClientPort` y `CourtsClientPort`. Esto resuelve la ambigüedad
  de la tabla de §4.2 —que insinúa lectura directa de `reservas_db`/`canchas_db`—
  a favor de lo que §4.3 exige: acceso vía los microservicios.
- `ms-reservas` no consulta `canchas_db` para validar una cancha: llama a
  `ms-canchas` vía `CourtClientPort`.
- Ninguna consulta SQL con `JOIN` cruza el límite de un dominio, porque ninguna
  conexión llega a la base de otro dominio (ver Restricciones Técnicas: el
  aislamiento se sostiene en credenciales de PostgreSQL, no en disciplina).

**Se verifica contra**: rúbrica "Modelo de datos y persistencia" (15%, que
califica literalmente "independencia de datos entre microservicios"); criterio de
aceptación 6.

**Razón**: es el criterio de 15 puntos más fácil de perder y el más fácil de
verificar en contra: basta con que un evaluador encuentre una credencial
compartida o una consulta cruzada.

### V. Microfrontends Autónomos

El frontend DEBE mantener un shell (host) y los tres remotes (`mf-reservas`,
`mf-administracion`, `mf-reportes`) integrados con Module Federation, ya
configurados hoy en el repositorio.

- Cada remote DEBE compilar (`npm run build`) y desplegarse por sí solo, sin
  necesidad de compilar el shell ni los otros remotes.
- El shell consume el contrato de Module Federation —el módulo expuesto en
  `exposes` y cargado vía `remoteEntry.js`— y NUNCA importa código fuente de un
  remote por ruta relativa ni por alias de workspace.
- Ningún remote importa código de otro remote. Lo compartido son las
  dependencias declaradas como `shared` (React y su runtime en versión única).
- Cada remote es dueño de sus rutas y de su propio estado. La autenticación y la
  navegación de nivel superior viven en el shell.
- Si un remote no está disponible en tiempo de ejecución, el shell degrada con su
  `ErrorBoundary` y el resto de la aplicación sigue funcionando.

**Se verifica contra**: rúbrica "Arquitectura de microfrontends" (15%, que exige
remotes "integrados y desplegables de forma independiente"); criterio de
aceptación 5; entregable E2.

**Razón**: §6.1 impide superar el nivel Suficiente en arquitectura a un proyecto
que no aplique Module Federation de verdad. Un import relativo entre paquetes
convierte los microfrontends en un monolito con pasos extra, y se ve a simple
vista en la revisión del código.

### VI. Contrato Antes que Implementación

Antes de escribir el primer controller de una funcionalidad, DEBE existir el
contrato del endpoint: ruta, método, DTO de request, DTO de response y catálogo
de códigos de error. El contrato se materializa como anotaciones springdoc sobre
el controller y sus DTOs, y queda publicado en el Swagger UI del microservicio
(`/swagger-ui.html`).

- Todo microservicio con API REST (`ms-usuarios`, `ms-canchas`, `ms-reservas`,
  `ms-reportes`) DEBE exponer su OpenAPI. Sin Swagger no hay funcionalidad
  terminada.
- Los errores se comunican con códigos HTTP semánticos, traducidos en el
  `ErrorHandler`: `400` validación de formato, `401` credenciales inválidas,
  `403` rol insuficiente (RN-03, RN-07), `404` recurso inexistente, `409`
  conflicto de negocio — solapamiento de RN-02, límite de reservas activas de
  RN-06, cancelación de una reserva pasada de RN-04. Nunca un `200` con un campo
  `error` dentro.
- El cuerpo de error es uniforme en los cuatro servicios: un `record` con
  `timestamp`, `status`, `error`, `message` y `path`.
- El frontend consume `/api/**` a través del Edge y del gateway; nunca el puerto
  directo de un microservicio.
- El contrato se congela al integrarse: cambiarlo obliga a actualizar en el mismo
  cambio a todos sus consumidores.

**Se verifica contra**: rúbrica "Arquitectura de microservicios" (15%, que exige
"API REST documentada (Swagger/OpenAPI)"); entregable E3, que pide además
colección de pruebas.

**Razón**: E3 se entrega como código más colección de pruebas. Un OpenAPI escrito
después de la implementación documenta lo que salió; escrito antes, es lo que
permite que el frontend y el backend avancen en paralelo en manos distintas.

### VII. Levantar con un Solo Comando

`docker compose up` desde la raíz del repositorio DEBE dejar el sistema completo
en pie —Edge, shell, los tres remotes, gateway, los cuatro microservicios y
PostgreSQL con sus tres bases— accesible en `http://localhost` y con datos de
prueba cargados, sin ningún paso manual adicional.

- El evaluador no instala Java, Node ni PostgreSQL: solo Docker.
- Las migraciones Flyway y el seed de datos corren solos al arrancar. Los scripts
  de `infra/postgres/init` se ejecutan cuando el volumen `pgdata` está vacío.
- El seed (E4) DEBE cubrir los tres dominios, no solo el catálogo:
  - `usuarios_db`: al menos un administrador y dos usuarios finales, con
    contraseña conocida y documentada en E5, más un usuario inactivo que permita
    demostrar la gestión de activar/inactivar de §3.1.
  - `canchas_db`: al menos una cancha de cada deporte —pádel, tenis y básquet—
    con su horario de atención, más una cancha inactiva.
  - `reservas_db`: reservas de ejemplo que cubran los tres estados de RN-08
    (Confirmada, Cancelada, Finalizada), repartidas entre las canchas y los
    usuarios sembrados, y distribuidas en un rango de fechas suficiente para que
    los cuatro indicadores de §3.3.5 devuelvan datos no vacíos — incluido el
    ranking de mayor y menor demanda, que exige demanda desigual entre canchas.
    Las reservas Confirmadas del seed son futuras respecto a la fecha de
    ejecución, para que RN-04 y RN-05 se puedan demostrar cancelando una en vivo.
  - El seed respeta las reglas de negocio: no siembra solapamientos (RN-02, que
    la restricción `EXCLUDE` rechazaría al cargar) ni excede el límite de
    reservas activas por usuario (RN-06).
  - El seed es determinista y repetible: `docker compose down -v && docker compose up`
    produce el mismo estado, sin fechas absolutas quemadas que caduquen.
- Los servicios declaran `depends_on` con condición de salud usando el `health` de
  Actuator, para que el arranque sea determinista y no una carrera.
- No hay credenciales ni URLs quemadas en el código: van por variable de entorno,
  con un valor por defecto que funciona en local.
- El manual de despliegue (E5) DEBE poder reducirse a: clonar, `docker compose up`,
  abrir `http://localhost`, y una tabla de usuarios de prueba con sus roles.

**Se verifica contra**: §4.4 del alcance ("Docker Compose es suficiente para
levantar el entorno completo"); entregables E4 y E5; rúbrica "Calidad técnica y
documentación" (10%) y la demo en vivo de E6. El contenido del seed se verifica
además contra "Módulo de reportes básicos" (10%), que exige "datos consistentes
respecto a las reservas registradas": sin reservas sembradas, los cuatro
indicadores de §3.3.5 se demuestran vacíos.

**Razón**: la calificación ocurre en la máquina del evaluador. Un sistema que
requiere quince minutos de preparación gasta ese tiempo del espacio de la
presentación, y cualquier paso manual es un punto donde la demo de E6 se cae en
público.

## Restricciones Técnicas

Estas restricciones recogen decisiones ya tomadas. Se aplican; no se debaten en
cada feature.

### Versiones (fuente: `backend/STACK.md`)

Spring Boot 4.0.8 · Spring Framework 7.0.9 · Java 21 LTS (Temurin) · Maven 3.9.16
vía wrapper `mvnw` por proyecto · PostgreSQL 16 · Flyway 11.14.1 · Hibernate
7.2.24.Final · Spring Cloud 2025.1.2 · Spring Cloud Gateway Server WebFlux 5.0.2
· springdoc-openapi 3.0.2 · nginx 1.27-alpine.

`springdoc-openapi` DEBE permanecer en la línea 3.x: es la que corresponde a
Spring Boot 4 y la que hace posible el Swagger que exige §4.2 del alcance.
Degradar a 2.x para "compatibilidad" rompe el requisito.

`groupId` común `com.ups`, artefactos en `0.0.1-SNAPSHOT`, empaquetado jar
ejecutable con servidor embebido, configuración en `application.yml`.

### Puertos y contenedores (fuente: `diagramas/workspace.dsl`, vista 04)

| Componente | Contenedor | Puerto | Base de datos |
| --- | --- | --- | --- |
| Edge (nginx) | `rc-edge` | 80 | — |
| shell | `rc-shell` | 3000 | — |
| mf-reservas | `rc-mf-reservas` | 3001 | — |
| mf-administracion | `rc-mf-administracion` | 3002 | — |
| mf-reportes | `rc-mf-reportes` | 3003 | — |
| api-gateway | `rc-gateway` | 8080 | — |
| ms-usuarios | `rc-ms-usuarios` | 8081 | `usuarios_db` |
| ms-canchas | `rc-ms-canchas` | 8082 | `canchas_db` |
| ms-reservas | `rc-ms-reservas` | 8083 | `reservas_db` |
| ms-reportes | `rc-ms-reportes` | 8084 | — (agrega vía REST) |
| PostgreSQL | `rc-postgres` | 5432 | las tres |

Dos redes bridge: `frontend` y `backend`. El Edge es el único contenedor
conectado a ambas.

### Origen único en el Edge

El navegador habla con un solo origen, `http://localhost`. El Edge nginx sirve el
shell en `/`, cada remote bajo su prefijo (`/mf-reservas/`, `/mf-administracion/`,
`/mf-reportes/`) y proxea `/api` al gateway. El `PUBLIC_PATH` con que se compila
cada remote DEBE coincidir con la ruta que el Edge publica para ese remote.

Esta es la razón de existir del Edge: los chunks federados se piden en tiempo de
ejecución desde el mismo origen, así que no hay CORS que configurar ni que fallar
en la demo. NO se resuelve el problema con cabeceras CORS permisivas en cada
servicio.

### Autenticación

Autenticación básica con roles, como fija §4.4. Está PROHIBIDO introducir OAuth2,
SSO, JWT o un servidor de autorización: no suman puntos en la rúbrica y sí
consumen el tiempo de los criterios que sí puntúan.

`ms-usuarios` usa `spring-security-crypto` únicamente para `BCryptPasswordEncoder`
en el hash de contraseñas: sin cadena de filtros ni autoconfiguración de Spring
Security.

El `AuthenticationFilter` del gateway identifica al usuario y propaga su identidad
y su rol como cabeceras `X-User-Id` y `X-User-Role`. Los microservicios confían en
esas cabeceras para aplicar RN-03 y RN-07, y no re-autentican. Ningún microservicio
recibe credenciales del usuario final.

### Persistencia

- Aislamiento por credenciales de PostgreSQL, no por convención: cada
  microservicio tiene un usuario de base de datos que solo puede conectarse a la
  suya. Una violación del Principio IV falla al conectar, no pasa desapercibida
  en revisión.
- `ms-reportes` no tiene base de datos, ni driver JDBC, ni Flyway, ni JPA. Añadir
  cualquiera de los tres es violar el Principio IV.
- RN-02 se sostiene en una restricción `EXCLUDE` de PostgreSQL sobre
  `reservas_db` (con `btree_gist`, sobre cancha y rango horario, filtrando por
  estado Confirmada), no solo en la validación del servicio. La validación en
  `BookingService` da el mensaje amable; la restricción es la que garantiza la
  regla bajo concurrencia. El `ErrorHandler` traduce la violación de la
  restricción a HTTP 409.
- Flyway versiona el esquema y `spring.jpa.hibernate.ddl-auto: validate` en los
  tres servicios con persistencia. Está PROHIBIDO `update` o `create-drop` en
  cualquier perfil. Las migraciones son inmutables una vez integradas: un cambio
  es una migración nueva.
- Los scripts DDL y de seed son el entregable E4 y viven versionados en el
  repositorio.

### Observabilidad y documentación de servicio

Actuator expone `health`, `info` y `metrics` en los cinco proyectos. Swagger UI en
`/swagger-ui.html` de cada microservicio con API.

### Regla de dependencias nuevas

Añadir una dependencia a un `pom.xml` o a un `package.json` DEBE justificarse por
escrito en el PR contra un criterio concreto de la rúbrica o de aceptación: qué
criterio defiende y por qué no se alcanza con lo que ya está en `backend/STACK.md`.
Sin esa justificación, la dependencia se rechaza. Se rechazan por defecto: brokers
de mensajería, service discovery, config server, caché distribuida, Kubernetes,
Lombok, MapStruct y librerías de BI. Ninguna aparece en la rúbrica; todas amplían
la superficie que hay que explicar en E1 y sostener en E6.

### Estado del repositorio al ratificar (2026-08-24)

Esta constitución describe un sistema en construcción. Lo que hoy existe:

- Frontend: Module Federation configurada y funcionando en el shell y en los tres
  remotes.
- Backend: los cinco proyectos Maven generados con dependencias resueltas, pero
  cada uno tiene únicamente su `*Application.java` y su `application.yml`. La
  estructura hexagonal está por construirse encima, siguiendo el proceso de 8
  pasos de `template-backend/ARQUITECTURA.md` y el ejemplo vivo de
  `template-backend/microservice-template/`.
- `docker-compose.yml`: solo el perfil `frontend`. Faltan PostgreSQL, el gateway,
  los cuatro microservicios y el Edge, más los ficheros de infraestructura
  (`infra/postgres/init`, configuración del Edge) que el Principio VII presupone.

Esto es trabajo pendiente y planificado, no deuda técnica: se especifica y se
implementa con el flujo Spec Kit. Ningún principio de esta constitución se
considera incumplido por lo que aún no se ha construido; se aplican al código
desde el momento en que se escribe.

## Integración de Aportes del Equipo

El código llega de varias manos y de varios repositorios de trabajo. La
integración es donde este proyecto se rompe o se sostiene.

- **Una rama por feature**, nombrada `<área>/<feature>` (`backend/`, `frontend/`,
  `infra/`, `docs/`). Nadie integra directo a `main`.
- **Un dueño por microservicio o microfrontend a la vez.** Dos personas no editan
  el mismo servicio en paralelo; si el trabajo lo exige, se parte en features con
  límites de paquete disjuntos.
- **El contrato antes que el código compartido** (Principio VI). Cuando dos
  personas trabajan a ambos lados de una frontera —frontend/backend, o dos
  microservicios— se acuerda primero el DTO y la ruta; después cada quien avanza
  por su lado contra ese contrato.
- **El template es la referencia, no la sugerencia.** Un microservicio nuevo o un
  servicio que se completa parte de `template-backend/microservice-template/` y de
  los pasos de `template-backend/ARQUITECTURA.md`. No se inventa una estructura
  distinta "porque es más rápido": las cinco estructuras tienen que verse iguales
  para que E1 describa a las cinco.
- **Revisión por un segundo par de ojos** antes de integrar, con foco declarado en
  los Principios III y IV: se revisa que `application/service/` no importe
  `adapter/`, y que no haya aparecido una conexión a una base ajena. Ambas se
  verifican leyendo imports y `application.yml`, en minutos.
- **`main` siempre levanta.** Quien integra un cambio verifica que
  `docker compose up` sigue funcionando desde cero antes de dar el trabajo por
  integrado. Romper `main` bloquea al equipo entero y es el primer punto que se
  atiende.
- **Los conflictos de contrato los resuelve el dueño del servicio**, no quien
  integra último.
- **Se integra en piezas pequeñas y frecuentes.** Una feature que lleva más de dos
  días sin integrarse se parte.
- Los aportes que llegan de fuera del flujo acordado (código pegado, generado o
  traído de otro proyecto) se someten a las mismas compuertas de calidad que el
  resto. No hay vía rápida.

## Compuertas de Calidad

Una feature NO está terminada hasta que las ocho compuertas pasan. "Funciona en mi
máquina" no es ninguna de ellas.

1. **Traza al alcance.** La feature nombra la funcionalidad de §3.1–§3.3, la RN o
   el entregable que la justifica (Principio I).
2. **Compila y las pruebas pasan.** `./mvnw test` en verde en el servicio tocado;
   `npm run build` en verde en el microfrontend tocado. Cada remote se compila por
   separado (Principio V).
3. **Reglas de negocio probadas.** Cada RN que la feature toca tiene su prueba
   unitaria con el puerto de salida mockeado, y RN-02 su prueba de concurrencia
   (Principio II).
4. **Regla de dependencia verificada.** Se revisan los imports: `application/service/`
   sin nada de `adapter/`, `domain/` sin JPA ni HTTP, ningún controller devolviendo
   entidad o modelo de dominio (Principio III).
5. **Independencia de datos verificada.** El `application.yml` del servicio apunta
   solo a su base; cualquier dato de otro dominio llega por un puerto de salida y
   su adaptador HTTP (Principio IV).
6. **Contrato publicado.** Los endpoints nuevos aparecen en el Swagger UI del
   servicio, con sus códigos de error documentados y el cuerpo de error uniforme
   (Principio VI).
7. **Levanta desde cero.** `docker compose down -v && docker compose up` deja el
   sistema arriba y el flujo nuevo funciona en `http://localhost`, con las
   migraciones y el seed aplicados solos. Si la feature añade o cambia una
   entidad, el seed se extiende para que siga poblando las pantallas y los cuatro
   indicadores de §3.3.5 con datos no vacíos (Principio VII).
8. **Diagrama e informe actualizados en el mismo cambio.** Esta compuerta es
   innegociable y se verifica explícitamente:
   - `diagramas/workspace.dsl` refleja el código integrado. Toda clase nueva que
     sea componente —`*Controller`, `*UseCase`, `*Service`, `*Port`, `*Adapter`—
     tiene su caja con el tag correcto (`Adapter-In` / `Port` / `Application` /
     `Adapter-Out`) y sus relaciones. Todo contenedor, red, puerto o volumen nuevo
     aparece en la vista de despliegue. Los SVG exportados se regeneran.
   - `informe/secciones/` se actualiza en la sección que corresponda:
     `04-arquitectura.tex` para cambios de estructura, `05-modelo-datos.tex` para
     cambios de esquema, `06-reglas-negocio.tex` para cambios en RN-01…RN-08,
     `07-resultados.tex` para lo que ya se puede demostrar. Las figuras de
     `informe/figuras/` se regeneran si el diagrama cambió.

   Un diagrama o un informe que describen código que ya no existe valen menos que
   nada: se convierten en una afirmación falsa entregada como E1 y defendida en
   E6. Actualizarlos al final del proyecto, de memoria y contra reloj, es la forma
   más cara de perder los 10 puntos de "Calidad técnica y documentación" y de
   comprometer la defensa.

## Governance

Esta constitución tiene precedencia sobre cualquier preferencia individual,
costumbre heredada de otro proyecto o sugerencia de una herramienta. Cuando algo
contradice este documento, este documento gana; si el documento está equivocado,
se enmienda antes de actuar en contra.

**Jerarquía de fuentes.** Ante un conflicto, el orden de autoridad es:
(1) `Alcance_Funcional_Reserva_Canchas_v2.md` — es lo que se califica;
(2) esta constitución — es cómo el equipo decidió cumplirlo;
(3) `backend/STACK.md`, `template-backend/ARQUITECTURA.md` y
`diagramas/workspace.dsl` — es el detalle técnico acordado;
(4) el código. Si el código contradice al nivel (3), el código está mal o el
documento quedó desactualizado, y la compuerta 8 obliga a resolverlo en el mismo
cambio, no después.

**Enmiendas.** Una enmienda requiere: (a) la razón escrita, trazada a un criterio
de la rúbrica o de aceptación; (b) acuerdo del equipo; (c) el ajuste de los
documentos que dependan de ella; (d) el incremento de versión correspondiente.
Las decisiones recogidas en Restricciones Técnicas —hexagonal, paquete base,
versiones, autenticación básica, independencia de datos, Edge de origen único,
aislamiento por credenciales, `ms-reportes` sin base, `EXCLUDE` para RN-02,
Flyway con `validate`— están cerradas: reabrirlas es una enmienda MAJOR con
justificación de rúbrica, no una decisión de implementación.

**Versionado.** Semántico sobre esta constitución:
MAJOR para eliminar o redefinir un principio de forma incompatible;
MINOR para añadir un principio o una sección, o ampliar materialmente una
restricción; PATCH para aclaraciones, redacción y correcciones sin cambio de
alcance normativo.

**Cumplimiento.** Toda revisión de código verifica las ocho compuertas de calidad,
con atención declarada a los Principios III y IV, que son los que sostienen 30
puntos de rúbrica y los que se degradan en silencio. Toda complejidad añadida se
justifica contra la rúbrica o se retira. Antes de cada entregable (E1–E6) se hace
una revisión de cumplimiento de la constitución completa, y sus hallazgos se
atienden antes de entregar.

**Guía de ejecución.** Para el trabajo diario, las referencias operativas son
`template-backend/ARQUITECTURA.md` (cómo se organiza el código),
`backend/STACK.md` (qué versiones y convenciones) y `diagramas/workspace.dsl`
(qué componentes existen y cómo se relacionan). Esta constitución dice por qué, y
qué no se negocia.

**Version**: 1.1.0 | **Ratified**: 2026-08-24 | **Last Amended**: 2026-08-24
