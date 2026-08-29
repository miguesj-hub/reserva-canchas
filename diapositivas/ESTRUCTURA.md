# Estructura de la presentación — qué va en cada diapositiva

Guion de la exposición final (**entregable E6**). Cada bloque dice qué criterio
de la rúbrica defiende y cuánto dura. El orden no es arbitrario: sigue el peso
de la rúbrica y coloca la demostración en el centro, no al final.

## De dónde sale esta estructura

El documento de alcance no describe la presentación más allá de definir el
entregable **E6 — «Presentación final del proyecto con demostración en vivo de
los flujos principales»**. Lo que se evalúa, por tanto, es la **rúbrica** (§6) y
los **criterios de aceptación** (§7). Esta estructura está construida para
recorrer los siete criterios de la rúbrica en orden de peso:

| Criterio de la rúbrica | Peso | Dónde se defiende |
|---|---|---|
| Alcance funcional implementado | 25 % | Bloques 1 y **9 (demo)** |
| Arquitectura de microfrontends | 15 % | Bloque 4 |
| Arquitectura de microservicios | 15 % | Bloque 5 |
| Modelo de datos y persistencia | 15 % | Bloque 6 |
| Reglas de negocio y validaciones | 10 % | Bloque 7 |
| Módulo de reportes básicos | 10 % | Bloque 8 |
| Calidad técnica y documentación | 10 % | Bloques 2 y 10 |

El 25 % de mayor peso **no se gana en una diapositiva, se gana en la demo**. De
ahí que la demo se lleve cuatro de los veinte minutos y tenga su propio guion
paso a paso.

## Presupuesto de tiempo

Dos presupuestos. El de 20 minutos es el que está escrito en los `\bloque{...}`
de las secciones; si el docente concede 30, la columna de la derecha dice dónde
poner los diez minutos extra (y no es en arquitectura: es en la demo).

| # | Bloque | 20 min | 30 min | Expone |
|---|---|---|---|---|
| — | Portada y agenda | 0,5 | 0,5 | Quien abra |
| 1 | El problema y el alcance | 1,5 | 2 | Arquitectura |
| 2 | Cómo lo construimos | 1,5 | 2,5 | Arquitectura |
| 3 | Arquitectura de la solución | 2 | 3,5 | Arquitectura |
| 4 | Frontend: Module Federation | 2 | 3 | Frontend |
| 5 | Backend: microservicios | 2 | 3 | Backend |
| 6 | Modelo de datos | 1 | 2 | Backend |
| 7 | Reglas de negocio | 2 | 3 | Backend |
| 8 | Reportes | 1 | 1,5 | Frontend |
| 9 | **Demostración en vivo** | **4** | **6** | Demo |
| 10 | Calidad y despliegue | 1 | 1,5 | Arquitectura |
| 11 | Cierre | 1,5 | 2 | Todos |
| | **Total** | **20** | **30,5** | |

Las preguntas van aparte. Si el turno de preguntas está dentro del tiempo
asignado, recorta el bloque 2 primero y el 3 después; **nunca la demo**.

---

## Bloque por bloque

> Los números de la columna `#` cuentan **láminas de contenido**, no páginas del
> PDF: entre bloque y bloque, metropolis intercala una lámina separadora, y
> mientras la guía esté activa también la ficha del bloque. En el PDF de
> entrega (`\guiafalse`) son 49 páginas: 28 de contenido, 11 separadoras y 10
> de respaldo.

### Portada y agenda — 0,5 min

| # | Diapositiva | Contenido |
|---|---|---|
| 1 | Portada | Título, subtítulo, los cuatro integrantes, programa y curso. No se lee en voz alta |
| 2 | Qué vamos a ver | Los once bloques en dos columnas, con la demo destacada. Veinte segundos |

La agenda existe para una cosa: que la sala sepa que la demo llega pronto. Eso
es lo que compra atención durante los bloques de arquitectura.

### 1 · El problema y el alcance — 1,5 min · *Alcance funcional (25 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 3 | El problema | El club, los dos roles, en una frase. Al lado, **lo que NO está en alcance** (§3.5 del documento) |
| 4 | Las cuatro historias | Usuario final y administrador, sus historias, y el anuncio de que se verán corriendo |

Enunciar lo que queda fuera es tan importante como lo que está dentro: demuestra
que se leyó el documento de alcance y evita la pregunta «¿y los pagos?».

**Aquí no se afirma que funciona.** Eso se demuestra en el bloque 9. Esta lámina
y la tabla de criterios del cierre son el mismo compromiso, al principio y al
final.

### 2 · Cómo lo construimos — 1,5 min · *Calidad y documentación (10 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 5 | Especificación primero, no *vibe coding* | Las dos filosofías enfrentadas, y por qué este proyecto pide la segunda |
| 6 | El flujo y lo que dejó como evidencia | constitución → spec → plan → tasks → implementación → pruebas, y qué compró |

Enlaza con la sesión 08 del curso (*Vibe Coding vs. Spec-Driven Development*).
Es el bloque que explica por qué el resto de la charla puede enseñar
trazabilidad de un requisito a una línea de código: no es casualidad, es el
método.

Va aquí y no al final porque prepara la tabla del bloque 7, donde cada regla de
negocio apunta a una clase y a un test con nombre propio.

### 3 · Arquitectura de la solución — 2 min · *Base de los criterios 4 y 5*

| # | Diapositiva | Contenido |
|---|---|---|
| 7 | Cómo describimos la arquitectura | Modelo C4, cuatro vistas, un solo origen (Structurizr DSL) |
| 8 | **V-01 Contexto** | Lámina completa. Socio y administrador frente al sistema |
| 9 | **V-02 Contenedores** | Lámina completa. Las once piezas. Señalar el `edge` |
| 10 | Tres decisiones (ADR) | Solapamiento en la base · una base por servicio · un origen único |

La lámina de decisiones es la que hay que saber defender. Si solo queda tiempo
para explicar una, la primera: es la que demuestra que la regla crítica no
depende de que el código se porte bien.

Los diagramas se proyectan a lámina completa, sin título ni pie que les roben
altura. Si hay que entrecerrar los ojos para leer una etiqueta, la lámina no
sirve.

### 4 · Frontend: Module Federation — 2 min · *Microfrontends (15 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 11 | Un host y tres remotes | Tabla: `shell` (host), `mf-reservas`, `mf-administracion`, `mf-reportes` |
| 12 | Cómo se integran en ejecución | Fragmento de `rsbuild.config.ts`: `remotes` y `shared`. Diez líneas, no el archivo |
| 13 | **La prueba de que son independientes** | Reconstruir un solo remote con el sistema en pie |

La rúbrica pide shell y **al menos dos** remotes «integrados **y desplegables de
forma independiente**». Lo primero lo enseña todo el mundo; **lo segundo casi
nadie**. La diapositiva 13 es la que marca la diferencia — y si la demo va
sobrada de tiempo, se hace en vivo.

Ten el comando escrito y probado. Improvisar Docker delante del proyector es la
forma más rápida de perder dos minutos.

### 5 · Backend: microservicios Spring Boot — 2 min · *Microservicios (15 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 14 | Cuatro servicios y un gateway | Tabla servicio → base → responsabilidad. `ms-reportes` **sin base de datos** |
| 15 | **V-03 Componentes de `ms-reservas`** | Lámina completa. Adaptadores fuera, dominio dentro |
| 16 | Contrato antes que código | Swagger/OpenAPI, propagación de rol en el gateway, comunicación síncrona |

Que `ms-reportes` no tenga base propia es un detalle que merece énfasis: es una
decisión, no una carencia. Un almacén analítico habría sido más arquitectura de
la que este alcance necesita.

Abre Swagger en vivo si el proyector coopera; si no, la captura. Decir que la
API está documentada vale menos que enseñarla.

### 6 · Modelo de datos — 1 min · *Modelo de datos y persistencia (15 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 17 | **Modelo entidad-relación** | Lámina completa. Tres bases separadas, no tres esquemas del mismo modelo |
| 18 | La independencia es verificable | Un rol por servicio; referencia por identificador, no clave foránea cruzada |

El argumento fuerte: la independencia de datos **no es una convención de
equipo, es un permiso denegado por PostgreSQL**. Ten preparado el `psql` que lo
demuestra por si alguien duda.

### 7 · Reglas de negocio — 2 min · *Reglas y validaciones (10 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 19 | Ocho reglas, ocho lugares | Tabla RN-01…RN-08 → dónde vive cada una. No se lee entera |
| 20 | **RN-02: por qué no basta con validar en el servicio** | La carrera entre dos peticiones, la restricción `EXCLUDE`, la prueba de concurrencia |

La rúbrica dice literalmente «en especial la validación de solapamiento de
horarios». Por eso RN-02 tiene una diapositiva para ella sola.

La historia que hay que contar: dos peticiones simultáneas preguntan «¿está
libre?», las dos oyen que sí, las dos insertan. La comprobación en el servicio
es necesaria para dar un mensaje decente; **la restricción de la base es la que
hace que la regla sea cierta**.

### 8 · Reportes — 1 min · *Reportes básicos (10 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 21 | Cuatro indicadores | Reservas por cancha/deporte · ocupación · cancelaciones · mayor y menor demanda |

La rúbrica pide que los datos sean «consistentes respecto a las reservas
registradas». Anuncia aquí la prueba: en la demo se crea una reserva y se vuelve
a esta pantalla a ver el número moverse. Eso es lo que separa un reporte de una
pantalla con datos de adorno.

### 9 · Demostración en vivo — 4 min · *Alcance funcional (25 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 22 | El guion de la demo | Los ocho pasos, socio y administrador. Se proyecta mientras se cambia de ventana |
| 23 | Antes de empezar | Lista de comprobación previa. **Para el ensayo, no para el aula** |

**Los ocho pasos:**

1. Entrar como socio y ver disponibilidad de una cancha para hoy.
2. Reservar un bloque libre.
3. Intentar reservar **el mismo bloque** desde otra sesión → rechazado (RN-02).
4. Ver «mis reservas» y cancelar una.
5. Comprobar que el bloque volvió a estar libre (RN-05).
6. Como administrador: crear una cancha y verla en el catálogo del socio.
7. Cancelar la reserva de otro usuario (RN-03).
8. Abrir reportes: el número refleja lo que acaba de pasar.

El paso 3 es el momento importante de toda la charla: es el 10 % de reglas de
negocio y parte del 25 % de alcance, demostrado en diez segundos.

**Regla de la casa:** el sistema se levanta **antes** de entrar al aula. Un
`docker compose up` en frío tarda minutos, y son minutos de silencio.

**Plan B:** un vídeo corto de la demo, ya en el escritorio, por si falla la red
o el proyector. Grábalo.

### 10 · Calidad y despliegue — 1 min · *Calidad y documentación (10 %)*

| # | Diapositiva | Contenido |
|---|---|---|
| 24 | Un solo comando | Las cifras: 1 comando · 11 contenedores · 1 requisito (Docker) |
| 25 | Atributos de calidad | Mantenibilidad, escalabilidad, seguridad, disponibilidad → **mecanismo concreto** de cada uno |

Enlaza con la sesión de atributos de calidad del curso. Un atributo sin
mecanismo es una intención: no digas «es mantenible», di «el dominio no conoce
ni HTTP ni JPA, y cada regla tiene su prueba».

Que no haga falta instalar Java, Node ni PostgreSQL no es comodidad: es que la
evaluación no dependa de qué tenga instalado quien evalúa.

### 11 · Cierre — 1,5 min

| # | Diapositiva | Contenido |
|---|---|---|
| 26 | **Los seis criterios de aceptación** | Tabla §7 del alcance, con la evidencia de cada uno |
| 27 | Lecciones y trabajo futuro | Dos columnas, concretas |
| 28 | Gracias / ¿Preguntas? | Lámina *standout* |

La diapositiva 26 es la que el evaluador busca. **Revisa las marcas la víspera,
con el sistema delante**: marca cumplido solo lo que hayas visto correr ese día.
Un criterio dado por bueno que luego falla en la demo cuesta más que uno
declarado pendiente.

En «lecciones», honestidad concreta, no humildad genérica. Y «trabajo futuro»
que no sea la lista de cosas fuera de alcance: repetir el enunciado no es
aprendizaje.

---

## Láminas de respaldo (apéndice)

No cuentan en la numeración ni en la barra de progreso. Son las respuestas ya
maquetadas a las preguntas que uno espera:

- Índice de respaldo (para el ponente)
- V-04 Despliegue y el papel del `edge`
- Componentes del `shell`, `ms-canchas`, `ms-usuarios`, `ms-reportes`, `api-gateway`
- Reglas de negocio → códigos HTTP
- Estrategia de pruebas
- Preguntas que esperamos

**Apunta el número de cada lámina de respaldo en un papel** cuando la
presentación esté cerrada. Buscar una pasando páginas delante del público
arruina el efecto.

### Preguntas que conviene tener ensayadas

- ¿Por qué microservicios para un sistema de este tamaño?
- ¿Qué pasa si `ms-canchas` está caído cuando alguien reserva?
- ¿Por qué no una cola de mensajes entre servicios?
- ¿Cómo escalarían si mañana hubiera cien clubes?
- ¿Module Federation no acopla los remotes al shell por la versión de React?
- ¿Cómo evitan que un remote roto tumbe toda la aplicación?

Ensáyalas en voz alta. Una respuesta pensada en el momento suena a que no se
pensó nunca.

---

## Lo que falta rellenar

Los marcadores `\ph{...}` de la plantilla, en ámbar, señalan lo que aún no está:

| Dónde | Qué falta |
|---|---|
| `config/datos.tex` | Universidad, docente, ciudad, y **quién expone cada bloque** |
| Diapositiva 12 | Fragmento real de `rsbuild.config.ts` del shell (diez líneas) |
| Diapositiva 13 | Comando exacto de reconstrucción de un solo remote |
| Diapositiva 16 | Captura de Swagger UI de `ms-reservas` |
| Diapositiva 18 | Comando `psql` que demuestra el permiso denegado |
| Diapositiva 20 | Fragmento del DDL con la restricción `EXCLUDE` |
| Diapositiva 21 | Captura del panel de reportes |
| Diapositiva 25 | Cifra de cobertura o número de pruebas |
| Diapositiva 27 | La tercera lección y el trabajo futuro reales |
| Respaldo | Códigos HTTP verificados contra el controlador, pirámide de pruebas |

Verifica cada código HTTP contra el controlador antes de exponer: un número
inventado ahí se nota enseguida.
