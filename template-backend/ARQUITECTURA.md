# Arquitectura de los microservicios (backend)

Guía de cómo debe organizarse el código dentro de **cada** microservicio del
backend: arquitectura hexagonal (puertos y adaptadores), en paquetes 100% en
inglés, para que la estructura de carpetas corresponda 1:1 con las cajas que
muestran los diagramas de componentes en `diagramas/workspace.dsl` (vistas
`03-Componentes-ms-reservas`, `05` a `07`). Si el diagrama muestra un puerto
de entrada, una aplicación, un puerto de salida y un adaptador como cajas
separadas, el código tiene que tener esa misma separación en paquetes.

El ejemplo vivo de esto es `template-backend/microservice-template/`: compila, tiene
tests que pasan, y sigue exactamente lo que describe este documento. Su
propio `README.md` explica paso a paso cómo implementar un microservicio
nuevo a partir de él — este documento es la referencia de **por qué** está
organizado así.

## Por qué hexagonal y no capas simples

El dominio (modelo + casos de uso) define **puertos** (interfaces) que
expresan lo que necesita, sin saber cómo se implementa. Los **adaptadores**
—web, JPA, RestClient— viven afuera y son los que dependen del dominio,
nunca al revés. Esto permite probar la lógica de negocio (`application/service/`)
con el puerto de salida mockeado, sin levantar Spring ni una base de datos.

## Paquetes y su rol

| Paquete | Rol hexagonal | Contiene | Anotación típica |
|---|---|---|---|
| `domain/` | Núcleo | El modelo de negocio (p. ej. `Resource`), sin ninguna anotación de framework. | ninguna |
| `domain/exception/` | Núcleo | Excepciones de negocio propias del servicio. No saben nada de HTTP. | ninguna |
| `application/port/in/` | Puerto de entrada | La interfaz de caso de uso (p. ej. `ResourceUseCase`) que el dominio expone hacia afuera. | interfaz Java |
| `application/port/out/` | Puerto de salida | Las interfaces que el dominio necesita del exterior (persistencia, otro microservicio). | interfaz Java |
| `application/service/` | Aplicación | Implementa el puerto de entrada; orquesta el caso de uso usando solo los puertos de salida. | `@Service` |
| `dto/` | (compartido) | Un archivo por DTO (request o response), usado tanto por el adaptador web como por la firma del puerto de entrada. | `record` con `jakarta.validation` |
| `adapter/in/web/` | Adaptador de entrada | El `@RestController` y el `@RestControllerAdvice`: traducen HTTP ↔ DTO y llaman al puerto de entrada. | `@RestController`, `@RestControllerAdvice` |
| `adapter/out/persistence/` | Adaptador de salida | Implementa el puerto de salida de persistencia contra Spring Data JPA. La entidad JPA es un detalle interno del paquete (package-private), nunca cruza hacia el dominio. | `@Entity`, `JpaRepository` |
| `adapter/out/client/` | Adaptador de salida | Implementa el puerto de salida hacia otro microservicio, sobre HTTP. | `RestClient` |
| `config/` | Cableado | `@Configuration` — beans de `RestClient`, etc. No es un componente del diagrama, es cableado interno. | `@Configuration` |

## Convención de nombres

Paquete base: `com.ups.reservacanchas.<dominio>`, el que ya usan los cinco
proyectos de `backend/` (`usuarios`, `canchas`, `reservas`, `reportes`,
`gateway`). No se renombra: la decisión del equipo es conservarlo. Lo que sí
va en inglés son los subpaquetes hexagonales (`domain/`, `application/`,
`adapter/`) y los nombres de clase, para que correspondan 1:1 con las cajas
de los diagramas.
Las clases siguen el mismo patrón que usan los diagramas: `<Recurso>UseCase`,
`<Recurso>Service`, `<Recurso>RepositoryPort`, `<Recurso>RepositoryAdapter`,
`<Recurso>Controller`, `ErrorHandler`.

## Regla de dependencia: todo apunta hacia el dominio

```
adapter.in.web  ──┐
                   ├──▶  application.port.in  ◀── implementa ── application.service
                   │                                    │
                   │                                    ▼
                   │                          application.port.out
                   │                                    ▲
adapter.out.*  ────┴── implementa ─────────────────────┘
```

`domain/` (modelo, excepciones) y `application/port/` no importan nada de
`application/service/` ni de `adapter/`. Son el centro del hexágono: todo lo
demás depende de ellos, ellos no dependen de nada del proyecto.

## Lo que nunca hay que hacer

- **Nunca** dejar que `application/service/` importe algo de `adapter/`
  (ni `JpaRepository`, ni `RestClient`, ni nada de `org.springframework.web`).
  Si el caso de uso necesita persistencia o red, pide un puerto de salida —
  no la implementación concreta.
- **Nunca** anotar el modelo de dominio con `@Entity` ni con nada de
  `jakarta.persistence`. Esa anotación va en la entidad JPA dentro de
  `adapter/out/persistence/`, que es un objeto distinto del modelo de
  dominio (el adaptador traduce entre los dos).
- **Nunca** devolver la entidad JPA (ni el modelo de dominio) directamente
  desde un controller. Siempre se traduce a un DTO de `dto/`.
- **Nunca** poner una decisión de negocio (un `if` que determine si algo se
  permite o no) en el adaptador web. Eso vive en `application/service/`,
  donde se puede probar sin levantar Spring (ver `ResourceServiceTest` en la
  plantilla, que mockea el puerto de salida, no JPA).
- **Nunca** inyectar el puerto de salida directo en el controller, ni la
  implementación (`ResourceService`) en vez de la interfaz
  (`ResourceUseCase`). El adaptador de entrada solo conoce el puerto de
  entrada.
- Las excepciones de `domain/exception/` no saben nada de HTTP — no llevan
  `HttpStatus` ni nada de `org.springframework.web`. La traducción a código
  HTTP es responsabilidad exclusiva de `ErrorHandler` (`adapter/in/web/`).
- Un microservicio nunca lee la base de datos de otro. Si necesita datos de
  otro dominio, es una llamada HTTP vía un puerto de salida + su adaptador
  (§4.3 del alcance).

## Correspondencia con los diagramas C4

Cada caja de componente del diagrama (`diagramas/workspace.dsl`, tags
`Adapter-In` / `Port` / `Application` / `Adapter-Out`) mapea directo a un
paquete:

| Rol en el diagrama | Paquete |
|---|---|
| Adaptador de entrada (`*Controller`, `ErrorHandler`) | `adapter/in/web/` |
| Puerto de entrada (`*UseCase`) | `application/port/in/` |
| Aplicación (`*Service`) | `application/service/` |
| Puerto de salida (`*RepositoryPort`, `*ClientPort`) | `application/port/out/` |
| Adaptador de salida — persistencia (`*RepositoryAdapter`) | `adapter/out/persistence/` |
| Adaptador de salida — cliente HTTP (`*ClientAdapter`) | `adapter/out/client/` |

El Gateway (`08-Componentes-gateway`) **no** sigue este patrón: es
enrutamiento e infraestructura transversal (identificar al usuario, rutear,
traducir errores de los servicios destino), sin dominio propio que proteger
— por eso su diagrama se quedó con la forma simple (`AuthenticationFilter →
RouteConfig → ErrorHandler`), sin puertos ni adaptadores.

Si agregas una clase nueva a un microservicio, pregúntate si existe una caja
equivalente en `diagramas/workspace.dsl`. Si no existe, o el diagrama queda
desactualizado, o la clase no debería existir todavía — mantenerlos
sincronizados es lo que hace que el diagrama sirva para algo.

## Cómo aplicar esto a un microservicio que ya existe

`ms-usuarios`, `ms-canchas`, `ms-reservas`, `ms-reportes` y el `gateway`
tienen hoy únicamente su clase `*Application.java` y su `application.yml`,
bajo el paquete base `com.ups.reservacanchas.<dominio>`. Ese paquete base se
conserva tal cual; lo que se construye encima es la estructura hexagonal.
Sigue el mismo proceso que se usó para construir el template (ver los pasos 1
a 7 de su `README.md`), en este orden:

1. Crear `domain/`, `domain/exception/`, `application/port/in/`,
   `application/port/out/`, `application/service/`,
   `adapter/in/web/`, `adapter/out/persistence/` (y `adapter/out/client/`
   si aplica).
2. Mover la entidad JPA actual a `adapter/out/persistence/` como clase
   package-private, y crear un modelo de dominio nuevo (sin anotaciones) en
   `domain/`.
3. Definir la interfaz del puerto de entrada en `application/port/in/` con
   la firma que ya tiene el `*Service` actual; mover el `*Service` a
   `application/service/` para que la implemente.
4. Definir la interfaz del puerto de salida en `application/port/out/` con
   la firma que necesita `application/service/`; crear el adaptador en
   `adapter/out/persistence/` que la implemente contra Spring Data JPA
   (traduciendo entidad ↔ dominio).
5. Mover el `*Controller.java` a `adapter/in/web/`, y cambiarlo para que
   dependa del puerto de entrada, no del `*Service`.
6. Mover el manejador de errores y las excepciones de negocio a
   `adapter/in/web/ErrorHandler.java` y `domain/exception/` respectivamente,
   traduciendo los nombres al inglés (`ReglaDeNegocioException` →
   `BusinessRuleException`, `NoEncontradoException` → `NotFoundException`).
7. Actualizar los `package` y los `import` de cada archivo afectado.
8. `./mvnw test` para confirmar que no se rompió nada.
