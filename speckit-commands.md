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
7. Que levante con un comando: `docker compose up` deja el sistema completo arriba, co

Suma tres secciones: restricciones técnicas (versiones y puertos, y que una dependenci
contra la rúbrica), cómo integramos aportes del equipo ahora que el código llega de varias manos, y las
compuertas de calidad antes de dar una feature por terminada. En las compuertas incluy
`workspace.dsl` y el informe se actualicen junto al código que describen.