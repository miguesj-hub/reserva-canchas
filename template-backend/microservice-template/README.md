# microservice-template

Esqueleto de referencia para los microservicios del backend, en arquitectura
hexagonal (puertos y adaptadores), 100% en inglés (paquetes, clases, config)
— pensado para copiarse como punto de partida de un microservicio nuevo,
incluido cuando ese microservicio se construye con **spec-kit**: la
estructura de paquetes ya está fija, así que un `/plan` de spec-kit solo
necesita decir "sigue `microservice-template`" y el código generado cae
directo en el paquete correcto.

Compila y pasa sus tests (`./mvnw test`, ver más abajo). Cada paquete
corresponde 1:1 con una caja de los diagramas de componentes
(`diagramas/workspace.dsl`) — el porqué de la separación está en
**[`../ARQUITECTURA.md`](../ARQUITECTURA.md)**.

**No es un microservicio real.** No lo agregues a `docker-compose.yml` ni le
crees una base de datos: es la base para copiar y adaptar.

## Cómo implementar un microservicio nuevo a partir de esto

El orden importa: primero el núcleo (qué hace el servicio, sin Spring),
después los puertos (qué necesita de afuera), y al final los adaptadores
(cómo se conecta con HTTP y con la base real). Ese es también el orden en el
que conviene pedirle a spec-kit que genere el código.

### 1. Copiar y renombrar el proyecto

```
cp -R backend/microservice-template backend/ms-<nombre>
rm -rf backend/ms-<nombre>/target   # por si acaso; ya está en .gitignore
```

En `pom.xml`: `artifactId`, `name` y `description` al nombre real del
servicio (`groupId` se queda en `ec.edu.master`).

Renombra el paquete Java: `ec.edu.master.template` → `ec.edu.master.<nombre>`
(mueve `src/main/java/ec/edu/master/template/*` y
`src/test/java/ec/edu/master/template/*` al nuevo paquete, y actualiza la
línea `package` de cada archivo). El nombre corto debe coincidir con el que
usan los diagramas (p. ej. `booking` para ms-reservas, `court` para
ms-canchas).

### 2. Definir el modelo de dominio (`domain/`)

Empieza por `Resource.java`: renómbralo a tu entidad real (`Court`,
`Booking`, etc.) y ajusta sus campos y su lógica de negocio (el método
`update(...)` es el lugar para las reglas que le apliquen a los cambios de
estado). Nada aquí importa Spring ni JPA — si necesitas anotar algo con
`@Entity`, esa clase no va en `domain/`, va en `adapter/out/persistence/`
(paso 5).

Ajusta también `domain/exception/`: son las excepciones de negocio del
servicio. `NotFoundException` y `BusinessRuleException` sirven para casi
cualquier dominio tal cual están; si tu servicio no llama a otro
microservicio, borra `ServiceUnavailableException.java` (y todo lo del paso
6).

### 3. Declarar los puertos (`application/port/`)

- `port/in/ResourceUseCase.java`: renómbralo (`CourtUseCase`,
  `BookingUseCase`, ...) y ajusta las operaciones a lo que tu servicio
  expone de verdad — no tiene que ser CRUD completo.
- `port/out/ResourceRepositoryPort.java`: lo que tu dominio necesita de la
  persistencia, en términos de dominio, no de JPA.
- `port/out/OtherServicePort.java`: solo si tu servicio necesita datos de
  otro microservicio (como `ms-reservas` necesita confirmar una cancha con
  `ms-canchas`). Si no, bórralo.

### 4. Implementar el caso de uso (`application/service/`)

`ResourceService.java` implementa el puerto de entrada usando solo los
puertos de salida — nunca un import de `adapter/`. Aquí van las reglas de
negocio (RN-xx si las tienes documentadas). Esta clase, junto con
`domain/`, es todo lo que hace falta para escribir el test de negocio (ver
`ResourceServiceTest`, que no levanta Spring).

Ajusta también los DTOs en `dto/` (`CreateResourceRequest`,
`UpdateResourceRequest`, `ResourceResponse`) a los campos reales de tu
recurso — son compartidos entre el puerto de entrada y el adaptador web.

### 5. Implementar los adaptadores (`adapter/`)

- `adapter/in/web/ResourceController.java`: renómbralo y ajusta las rutas
  (`/api/<recurso-en-plural>`). Depende del puerto de entrada, nunca del
  `*Service` directo.
- `adapter/in/web/ErrorHandler.java`: casi siempre se queda igual; agrégale
  un `@ExceptionHandler` más si tu servicio tiene una restricción de base de
  datos que traducir (como el `EXCLUDE` de `ms-reservas` para RN-02).
- `adapter/out/persistence/`: `ResourceJpaEntity` (aquí sí van las
  anotaciones `@Entity`), `ResourceJpaRepository` (Spring Data) y
  `ResourceRepositoryAdapter` (traduce entidad JPA ↔ dominio). El DDL
  correspondiente va en `infra/postgres/init/`, no aquí — `ddl-auto:
  validate` compara este mapeo contra la tabla real al arrancar.
- `adapter/out/client/OtherServiceAdapter.java` + `config/ClientsConfig.java`:
  solo si hiciste el paso 3 con `OtherServicePort`. Si no, bórralos junto
  con `app.clients.*` en `application.yml`.

### 6. Configuración y despliegue

En `application.yml`: `spring.application.name`, el bloque `datasource`
(nombre de base/usuario/contraseña reales — coordínalo con quien escriba el
DDL), y `app.clients.*` si aplica. Agrega el servicio a `docker-compose.yml`
(mismo patrón que los demás) y su DDL a `infra/postgres/init/`.

### 7. Verificar

```
./mvnw test
```

Antes de hacer commit, confirma que la estructura de paquetes de tu
servicio nuevo sigue teniendo una caja equivalente en
`diagramas/workspace.dsl` — si agregaste una clase que no está en el
diagrama, o el diagrama queda desactualizado, o esa clase no debería existir
todavía.

## Usar este esqueleto con spec-kit

Cuando generes un microservicio con spec-kit (`/specify` → `/plan` →
`/tasks` → `/implement`), el `/plan` debe apuntar explícitamente a esta
estructura de paquetes (no dejar que el modelo invente una propia): un
`/plan` típico dice algo como "sigue la arquitectura hexagonal de
`backend/microservice-template`: dominio en `domain/`, puertos en
`application/port/{in,out}/`, casos de uso en `application/service/`,
adaptadores en `adapter/{in,out}/...`". Así el código que genere `/implement`
cae en el paquete correcto desde el principio, en vez de tener que
reordenarlo después. `../ARQUITECTURA.md` tiene la tabla completa de
paquete ↔ responsabilidad ↔ caja del diagrama que puedes pegar directo en
la especificación.

## Paquetes (arquitectura hexagonal)

```
domain/                      El núcleo: modelo de negocio, sin anotaciones de framework
domain/exception/            Excepciones de negocio, sin saber nada de HTTP
application/port/in/         Interfaz del caso de uso (lo que expone el dominio)
application/port/out/        Interfaces de lo que el dominio necesita (persistencia, otro servicio)
application/service/         Implementa el puerto de entrada, usa solo puertos de salida
dto/                          Un archivo por DTO (request/response)
adapter/in/web/               @RestController + @RestControllerAdvice — llaman al puerto de entrada
adapter/out/persistence/      Implementa el puerto de salida contra Spring Data JPA
adapter/out/client/           Implementa el puerto de salida hacia OTRO microservicio (solo si aplica)
config/                       @Configuration — beans de RestClient, etc.
```

Todo apunta hacia `domain/`: nunca al revés. El detalle completo, con la
regla de dependencia y lo que nunca hay que hacer, está en
**[`../ARQUITECTURA.md`](../ARQUITECTURA.md)**.

Cada microservicio es un proyecto Maven independiente (no hay un `pom.xml`
padre compartido) — así lo asume el `Dockerfile` de cada uno
(`COPY pom.xml .` + `mvn dependency:go-offline` antes de copiar el código,
para cachear la capa de dependencias). No lo cambies a multi-módulo sin
ajustar los Dockerfiles existentes.

## Manejo de errores

Un solo `@RestControllerAdvice` (`ErrorHandler`, en `adapter/in/web/`) por
servicio, con las excepciones de dominio (`domain/exception/`:
`BusinessRuleException` → 400, `NotFoundException` → 404) y de validación
(`MethodArgumentNotValidException` → 400) como mínimo. Si el servicio llama
a otro por HTTP, agrega también `ServiceUnavailableException` → 503
(incluido aquí). Si tiene una restricción de base de datos que traducir,
agrega ese `@ExceptionHandler` también — no lo repliques en el controller.

## Tests

`./mvnw test` corre 3 tipos de prueba en este esqueleto — los dos primeros
pasan sin nada más levantado; el último necesita Postgres:

- `ResourceServiceTest` (`application/service/`) — el caso de uso con el
  puerto de salida mockeado (Mockito), sin Spring y sin saber si detrás hay
  JPA o cualquier otra cosa. Rápido, es el que más vale la pena replicar
  primero para cada caso de uso nuevo.
- `ResourceControllerTest` (`adapter/in/web/`) — el adaptador HTTP con
  `@WebMvcTest` + `MockMvc`, puerto de entrada mockeado. Verifica códigos de
  estado y el formato de error.
- `TemplateMicroserviceApplicationTests.contextLoads` — levanta el contexto
  de Spring completo, incluida la conexión real a la base de datos. **Va a
  fallar si no hay un Postgres corriendo** con el esquema esperado (`docker
  compose up -d` desde la raíz del repo). No es un bug: es la prueba de que
  la app realmente conecta y valida el esquema (`ddl-auto: validate`) contra
  una base real.

> En Spring Boot 4.1, `@WebMvcTest` se movió de paquete:
> `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest` (el de
> tutoriales/docs viejos) ya no existe. Ahora es
> `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`. Lo mismo
> aplica a `@DataJpaTest` y otras anotaciones de test por tecnología: cada
> una vive en su propio módulo (`spring-boot-webmvc-test`,
> `spring-boot-data-jpa-test`, etc.), consistente con que este `pom.xml` usa
> los starters de test separados (`spring-boot-starter-webmvc-test`,
> `-data-jpa-test`, etc.) en vez del clásico `spring-boot-starter-test`
> único. El error solo aparece si se usa el import antiguo.

## Dockerfile

Es una copia exacta de `infra/templates/Dockerfile.springboot` — no hace
falta tocarlo al crear un microservicio nuevo, solo copiarlo.
