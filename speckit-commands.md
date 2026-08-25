/speckit-constitution 

Arma la constitución del proyecto de reserva de canchas, el integrador de la maestría. La fuente de la
verdad es `Alcance_Funcional_Reserva_Canchas_v2.md`: requisitos, RN-01 a RN-08, rúbrica y criterios de
aceptación. Para el resto del detalle lee `diagramas/workspace.dsl` (modelo C4), `backend/STACK.md`
(versiones y convenciones) y `template-backend/ARQUITECTURA.md` (estructura interna de cada microservicio).
Acá va solo lo que no se ve leyendo eso.

El proyecto se califica con una rúbrica de 100 puntos, así que no quiero buenas prácticas genéricas: cada
principio tiene que poder verificarse contra un criterio de la rúbrica o de aceptación. Si no aterriza en
puntos, sobra.

Decisiones ya cerradas que la constitución solo recoge, no reabre:

- Estructura interna de cada microservicio: arquitectura hexagonal, según `template-backend/ARQUITECTURA.md`.
  Paquete base `com.ups.reservacanchas.<dominio>`, el que ya usan los cinco proyectos; no se renombra nada.
  Los subpaquetes y los nombres de clase van en inglés, para que correspondan 1:1 con las cajas del DSL.
- Versiones: las de `backend/STACK.md`. Spring Boot 4.0.8 y springdoc-openapi 3.0.2, que es la línea que
  corresponde a Boot 4 y la que hace posible el Swagger que exige el alcance.
- Autenticación: básica con roles, como manda el §4.4 del alcance. Nada de OAuth2 ni JWT. El gateway
  identifica al usuario y propaga `X-User-Id` y `X-User-Role`.
- Ningún microservicio lee la base de datos de otro. Si necesita datos de otro dominio, pasa por el servicio
  dueño de esa base vía HTTP, a través de un puerto de salida y su adaptador. Esto vuelve regla lo que el
  §4.3 del alcance pide y resuelve la ambigüedad de la tabla del §4.2 sobre `ms-reportes`.
- Alcance implementado: incluye la pantalla de gestión de usuarios (activar/inactivar) que el §3.1 le da al
  administrador, consumiendo `/api/usuarios` desde `mf-administracion`. Y los reportes son los cuatro
  indicadores del §3.3.5, incluido el ranking de canchas con mayor y menor demanda.

Del DSL hay decisiones tomadas que tampoco quiero reabrir, solo pásalas a restricciones: el Edge de nginx
unificando origen para matar el CORS de los chunks federados, tres bases aisladas por credenciales de
Postgres y no por convención, `ms-reportes` sin base propia, RN-02 sostenida por una restricción EXCLUDE de
Postgres y no solo por validación en el servicio (devolviendo 409), y Flyway con `ddl-auto: validate`.

Sobre el estado del código, para que la constitución hable de lo que existe: el frontend ya tiene Module
Federation configurada en el shell y los tres remotes, pero los cinco microservicios siguen teniendo solo su
`*Application.java` y su `application.yml`, sin la estructura hexagonal construida encima, y el
`docker-compose.yml` por ahora solo levanta el perfil de frontend. Completar el compose con Postgres, el
gateway, los microservicios y el edge es trabajo que vamos a planificar después con speckit, así que trátalo
como pendiente y no como deuda.

Los siete principios que quiero:

1. Alcance cerrado: lo que no traza a una funcionalidad del alcance o a una RN, no se construye.
2. Las reglas de negocio viven en el dominio y cada una tiene prueba; RN-02 además una de concurrencia.
   Hexagonal permite probar los casos de uso con el puerto de salida mockeado, sin Spring ni base de datos.
3. La regla de dependencia es innegociable: `application/service/` nunca importa nada de `adapter/`, y el
   dominio no conoce JPA, HTTP ni el framework.
4. Independencia de datos: nadie toca la base de otro, solo REST síncrono vía puerto de salida.
5. Microfrontends autónomos: cada remote compila y despliega solo; el shell consume contrato, no código.
6. Contrato antes que implementación: OpenAPI primero, errores como códigos HTTP semánticos.
7. Que levante con un comando: `docker compose up` deja el sistema completo arriba, con Flyway y seed.

Suma tres secciones: restricciones técnicas (versiones y puertos, y que una dependencia nueva se justifique
contra la rúbrica), cómo integramos aportes del equipo ahora que el código llega de varias manos, y las
compuertas de calidad antes de dar una feature por terminada. En las compuertas incluye que el
`workspace.dsl` y el informe se actualicen junto al código que describen.



/speckit-specify

Especifica el sistema completo de reserva de canchas deportivas: pádel, tenis y básquet, con usuario final y
administrador. Saca los requisitos de `Alcance_Funcional_Reserva_Canchas_v2.md`, que es la fuente de la
verdad: los permisos por rol del §3.1, las pantallas del §3.2, el detalle del §3.3, las reglas RN-01 a RN-08
del §3.4 y los criterios de aceptación del §7. La constitución del proyecto ya está escrita, respétala.

Una cosa importante sobre cómo quiero las historias. El sistema tiene varias capas (microfrontends sobre un
shell, un gateway y cuatro microservicios detrás), pero ninguna capa es una historia. Nadie puede demostrar
"el gateway" en la presentación final. Cada historia tiene que ser una rebanada vertical que atraviese todas
las capas y se pueda demostrar sola, de la pantalla hasta la base. Y no metas arquitectura en la
especificación: hexagonal, Module Federation, Postgres y el resto ya están decididos y les toca al plan.

Priorízalas por lo que exige el §7, que es lo que se califica. Lo primero es que el usuario final consulte
disponibilidad, reserve y cancele, porque sin eso no hay proyecto. Después la gestión del catálogo de canchas
y la cancelación administrativa de cualquier reserva. Luego los reportes, y al final la gestión de usuarios.
Cada una tiene que quedar utilizable por sí sola: si solo implementamos la primera, ya hay algo que mostrar.

Cuidado con las reglas de negocio, que valen su propio criterio de la rúbrica. La RN-02, no reservar sobre un
bloque ocupado, es la que más pesa y necesita escenarios explícitos, incluido qué pasa cuando dos personas
piden el mismo bloque a la vez. Las otras también quiero verlas como criterios verificables, no como una nota
al pie: cancelar solo lo propio salvo el administrador, no cancelar reservas que ya pasaron, que cancelar
libere el bloque, el tope configurable de reservas activas y los tres estados de la reserva.

Dos cosas que ya decidimos y van dentro del alcance: la pantalla de gestión de usuarios para activar e
inactivar, que el §3.1 le da al administrador aunque el §3.2 no la liste; y los reportes son los cuatro
indicadores del §3.3.5, así que no te olvides del ranking de canchas con mayor y menor demanda, que es el que
suele quedarse fuera.

Respeta el §3.5 tal cual: nada de pagos, notificaciones, reservas recurrentes, torneos, app nativa ni
reportes analíticos. Si algo no traza a una funcionalidad del §3.2 o a una RN, déjalo fuera.

Los criterios de éxito que sean medibles y sin nombrar tecnología, y que se puedan comprobar en una demo en
vivo, porque así es como se evalúa esto.


/speckit-constitution   (enmienda → v1.2.0)

Enmienda al Principio VI. Al escribirse la constitución no se registró que el frontend ya estaba
construido por delante de los contratos: las cuatro aplicaciones tienen todas sus pantallas, pero sin
una sola llamada HTTP, con los datos como arrays fijos en cada módulo y una sesión simulada contra un
MOCK_USERS en AuthContext. Eso invierte el principio de contrato primero en la mitad del sistema, así
que quiero fijado hacia dónde se resuelve el conflicto: la maqueta es un borrador de UI, no una fuente
de requisitos ni de contrato. Donde la pantalla y el contrato no coincidan, se ajusta la pantalla.
Donde la pantalla muestre algo que el alcance no pide, se quita. Y una funcionalidad no cuenta como
terminada mientras su pantalla siga leyendo datos fijos en vez del endpoint real.



/speckit-plan

Planifica la implementación a partir del spec. Casi todo el contexto técnico ya está decidido, así que no
investigues de cero: la constitución fija las reglas, `backend/STACK.md` las versiones (Spring Boot 4.0.8,
Java 21, PostgreSQL 16, springdoc 3.0.2), `template-backend/ARQUITECTURA.md` la estructura hexagonal de cada
microservicio, y `diagramas/workspace.dsl` la arquitectura completa. Que la investigación se limite a lo que
de verdad esté abierto, y si no hay nada abierto, dilo y sigue.

El árbol de proyecto ponlo con las rutas reales del repo, no con el esqueleto genérico de la plantilla: los
cinco proyectos Maven bajo `backend/`, el shell y los tres remotes bajo `frontend/`, y el template como
referencia de la que sale cada servicio. Paquete base `com.ups.reservacanchas.<dominio>`, subpaquetes y
clases en inglés, con los nombres que ya usan las cajas del DSL.

Lo que más me importa que salga bien son los contratos, porque son la mitad del trabajo. El frontend ya tiene
todas las pantallas construidas pero sin una sola llamada HTTP: los datos son arrays fijos en cada módulo y la
sesión se valida contra un MOCK_USERS. O sea que el trabajo de frontend no es maquetar, es conectar cada
pantalla al contrato y sustituir esa autenticación de mentira por /api/auth. Planifícalo con ese peso, y define
los contratos con sus códigos de error incluidos: 409 por bloque ocupado, 403 por rol insuficiente, 404 por
recurso inexistente. Resuelve de paso dos cosas sueltas: los roles en código son `cliente` y `admin` mientras
el alcance habla de Usuario Final y Administrador, y el shell le pasa un `token` como prop a cada remote, que
hay que reconciliar con que la identidad la propaga el gateway por cabeceras.

En el modelo de datos, tres esquemas independientes con credenciales que solo abren el suyo, `ms-reportes` sin
base propia agregando vía REST, y la RN-02 sostenida por una restricción EXCLUDE de PostgreSQL desde la
primera migración de Flyway, no por un if en el servicio.

En el quickstart entra el `docker-compose.yml`, que hoy solo levanta el perfil de frontend: súmale Postgres con
sus tres bases, los cuatro microservicios, el gateway y el edge de nginx que unifica el origen, más los
ficheros de infraestructura que hagan falta.

Y una advertencia sobre las capas: son varias, pero no las conviertas en fases. Nada de "primero todo el
backend, luego todo el frontend". El orden lo manda la prioridad de las historias del spec, y cada una se
implementa completa, del remote al gateway al microservicio a la base. Si al terminar una historia no hay algo
que se pueda demostrar en pantalla, está mal cortada.

Ah, y el gateway no lleva arquitectura hexagonal: es enrutamiento e identificación del usuario, sin dominio
propio que proteger.
