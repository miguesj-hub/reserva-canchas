# Stack del backend — versiones y dependencias

Referencia para la redacción del informe. Todas las versiones fueron resueltas por
Maven sobre los proyectos generados, no estimadas.

---

## 1. Plataforma base

| Elemento | Versión |
| --- | --- |
| Spring Boot | 4.0.8 |
| Spring Framework | 7.0.9 |
| Java | 21 (LTS) — Eclipse Temurin 21.0.11 |
| Maven | 3.9.16 (con wrapper `mvnw` incluido por proyecto) |
| Empaquetado | Jar ejecutable (servidor embebido) |
| Configuración | `application.yml` |
| Base de datos | PostgreSQL 16 |

## 2. Microservicios generados

| Proyecto | Paquete raíz | Puerto | Base de datos |
| --- | --- | --- | --- |
| `api-gateway` | `com.ups.reservacanchas.gateway` | 8080 | — |
| `ms-usuarios` | `com.ups.reservacanchas.usuarios` | 8081 | `usuarios_db` |
| `ms-canchas` | `com.ups.reservacanchas.canchas` | 8082 | `canchas_db` |
| `ms-reservas` | `com.ups.reservacanchas.reservas` | 8083 | `reservas_db` |
| `ms-reportes` | `com.ups.reservacanchas.reportes` | 8084 | — (agrega vía REST) |

`groupId` común: `com.ups` · versión de artefacto: `0.0.1-SNAPSHOT`

## 3. Dependencias por microservicio

| Dependencia | usuarios | canchas | reservas | reportes | gateway |
| --- | :-: | :-: | :-: | :-: | :-: |
| `spring-boot-starter-webmvc` | ✅ | ✅ | ✅ | ✅ | — |
| `spring-boot-starter-validation` | ✅ | ✅ | ✅ | ✅ | — |
| `spring-boot-starter-data-jpa` | ✅ | ✅ | ✅ | — | — |
| `spring-boot-starter-flyway` | ✅ | ✅ | ✅ | — | — |
| `postgresql` *(runtime)* | ✅ | ✅ | ✅ | — | — |
| `spring-boot-starter-actuator` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `springdoc-openapi-starter-webmvc-ui` | ✅ | ✅ | ✅ | ✅ | — |
| `spring-security-crypto` | ✅ | — | — | — | — |
| `spring-cloud-starter-gateway-server-webflux` | — | — | — | — | ✅ |

**Dependencias de prueba** (todas): `spring-boot-starter-webmvc-test`,
`-actuator-test`, `-validation-test`, y además `-data-jpa-test` / `-flyway-test`
en los tres servicios con persistencia. El gateway usa `reactor-test`.

### Notas por servicio

- **ms-usuarios** — `spring-security-crypto` es el jar aislado de Spring Security,
  sin cadena de filtros ni autoconfiguración. Se usa únicamente para
  `BCryptPasswordEncoder` en el hash de contraseñas.
- **ms-reportes** — sin JPA, sin driver JDBC y sin Flyway: no tiene base de datos
  propia. Consume `ms-reservas` y `ms-canchas` vía `RestClient`.
- **api-gateway** — módulo reactivo (Netty/WebFlux). No incluye
  `spring-boot-starter-webmvc`.

## 4. Versiones transitivas relevantes

Gestionadas por el BOM de Spring Boot 4.0.8 y por Spring Cloud 2025.1.2.

| Componente | Versión |
| --- | --- |
| Spring Data JPA | 4.0.7 |
| Hibernate ORM | 7.2.24.Final |
| Flyway (`flyway-core` + `flyway-database-postgresql`) | 11.14.1 |
| Driver JDBC PostgreSQL | 42.7.13 |
| springdoc-openapi | 3.0.2 |
| Spring Cloud (release train) | 2025.1.2 |
| Spring Cloud Gateway Server WebFlux | 5.0.2 |
| Tomcat embebido | 11.0.24 |
| Reactor Netty | 1.3.7 |
| Jackson | 3.1.5 |

## 5. Convenciones adoptadas

Estructura interna común a los cinco proyectos: arquitectura hexagonal
(puertos y adaptadores), según `template-backend/ARQUITECTURA.md`. El paquete
base se mantiene en `com.ups.reservacanchas.<dominio>`; los subpaquetes y los
nombres de clase van en inglés, para que correspondan 1:1 con las cajas de los
diagramas de componentes.

```
src/main/java/com/ups/reservacanchas/<dominio>/
├── domain/                    modelo de negocio, sin anotaciones de framework
│   └── exception/             excepciones de negocio, sin saber de HTTP
├── application/
│   ├── port/in/               interfaz de caso de uso (*UseCase)
│   ├── port/out/              interfaces que el dominio necesita (*Port)
│   └── service/               @Service, implementa el puerto de entrada
├── adapter/
│   ├── in/web/                @RestController y @RestControllerAdvice
│   ├── out/persistence/       @Entity y JpaRepository (package-private)
│   └── out/client/            RestClient hacia otro microservicio
├── config/                    @Configuration, cableado
└── dto/                       records de Request / Response
```

- Regla de dependencia: `application/service/` nunca importa nada de `adapter/`,
  y `domain/` no conoce JPA, HTTP ni el framework.
- Inyección por constructor con campos `final`; sin `@Autowired` en campos.
- DTOs como `record`; nunca se exponen entidades JPA en la API.
- Ningún microservicio lee la base de datos de otro: si necesita datos de otro
  dominio, es una llamada HTTP vía puerto de salida + adaptador (§4.3 del alcance).
- `spring.jpa.hibernate.ddl-auto: validate` — el esquema lo versiona Flyway.
- Credenciales y URLs externalizadas por variable de entorno, con valor por
  defecto para ejecución local.
- Actuator expone `health`, `info` y `metrics`.
- Swagger UI en `/swagger-ui.html` de cada microservicio.
