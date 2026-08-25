# Manual de despliegue — Sistema de Reserva de Canchas Deportivas

**Entregable E5** · Proyecto integrador de Aplicaciones Empresariales

Este manual describe cómo levantar, verificar y operar el sistema completo. La
descripción de lo que hace cada pieza está en el informe (E1); aquí solo lo
necesario para ponerlo en marcha.

## 1. Requisito único

**Docker 24 o superior, con Compose v2.** Nada más.

No hace falta instalar Java, Node, Maven ni PostgreSQL: todo se compila y se
ejecuta dentro de contenedores. Es una decisión deliberada —el Principio VII de
la constitución del proyecto exige que el sistema levante con un solo comando— y
también lo que hace que la evaluación no dependa de qué tenga instalado quien
evalúa.

Comprobar la versión:

```bash
docker --version        # Docker version 24.x o superior
docker compose version  # Docker Compose version v2.x
```

## 2. Levantar el sistema

```bash
git clone <url-del-repositorio> && cd reserva-canchas
docker compose up
```

Y abrir **<http://localhost>**.

El primer arranque compila once imágenes y tarda varios minutos; los siguientes
son cuestión de segundos. Para dejarlo en segundo plano y esperar a que todo
esté sano:

```bash
docker compose up -d --wait
```

Cuando termina, `docker compose ps` debe mostrar los once servicios en estado
`healthy`.

### Si el puerto 8080 está ocupado

El gateway se publica en el 8080 del anfitrión. Si esa máquina ya lo usa, el
arranque falla con `port is already allocated`. Se cambia sin tocar el compose:

```bash
GATEWAY_PORT=18080 docker compose up -d --wait
```

Todos los puertos publicados admiten esa sustitución: `SHELL_PORT`,
`MF_RESERVAS_PORT`, `MF_ADMINISTRACION_PORT`, `MF_REPORTES_PORT`,
`MS_USUARIOS_PORT`, `MS_CANCHAS_PORT`, `MS_RESERVAS_PORT`, `MS_REPORTES_PORT`,
`GATEWAY_PORT`, `POSTGRES_PORT` y `EDGE_PORT`.

Nada de esto afecta a la aplicación: el navegador solo usa
**<http://localhost>**, el puerto 80 del edge.

## 3. Qué se levanta

| Servicio | Imagen o build | Red | Puerto | Para qué |
|---|---|---|---|---|
| `edge` | `nginx:1.27-alpine` | frontend + backend | 80 | Único origen: sirve el shell, los remotes y `/api` |
| `shell` | `frontend/shell` | frontend | 3000 | Host de los microfrontends, sesión y enrutado |
| `mf-reservas` | `frontend/mf-reservas` | frontend | 3001 | Disponibilidad, nueva reserva, mis reservas |
| `mf-administracion` | `frontend/mf-administracion` | frontend | 3002 | Canchas, reservas y usuarios |
| `mf-reportes` | `frontend/mf-reportes` | frontend | 3003 | Los cuatro indicadores |
| `gateway` | `backend/api-gateway` | backend | 8080 | Verifica la credencial y rutea |
| `ms-usuarios` | `backend/ms-usuarios` | backend | 8081 | Registro, autenticación y usuarios |
| `ms-canchas` | `backend/ms-canchas` | backend | 8082 | Catálogo, horarios y bloqueos |
| `ms-reservas` | `backend/ms-reservas` | backend | 8083 | Reservas y disponibilidad |
| `ms-reportes` | `backend/ms-reportes` | backend | 8084 | Indicadores; **sin base de datos** |
| `postgres` | `postgres:16-alpine` | backend | 5432 | Las tres bases, aisladas por credenciales |

**El `edge` es el único contenedor conectado a las dos redes.** Es lo que impide
que el navegador alcance un microservicio saltándose el gateway.

Los puertos de los microservicios se publican solo para inspeccionar su Swagger;
la aplicación no los usa.

## 4. Usuarios de prueba

Los siembra la migración `V2__seed_usuarios.sql` en el primer arranque.

| Usuario | Contraseña | Rol | Para qué sirve |
|---|---|---|---|
| `admin` | `admin` | ADMINISTRADOR | Catálogo, listado global de reservas, usuarios y reportes |
| `cliente1` | `cliente1` | USUARIO_FINAL | El recorrido de reserva y cancelación |
| `cliente2` | `cliente2` | USUARIO_FINAL | El segundo lado del escenario de concurrencia |
| `inactivo` | `inactivo` | USUARIO_FINAL, inactivo | Demostrar el rechazo de una cuenta inactiva |

Las contraseñas se guardan hasheadas con BCrypt; en la base no hay ninguna en
claro. Son credenciales de demostración: **en un despliegue real se cambian
antes de exponer el sistema**.

El catálogo y las reservas de ejemplo también se siembran. Las reservas usan
fechas relativas al arranque, no absolutas, para que las confirmadas sigan
siendo futuras y se puedan cancelar en vivo por mucho tiempo que pase desde que
se escribió el seed.

## 5. Verificar que levantó bien

```bash
docker compose ps                                        # los once en healthy
curl -u cliente1:cliente1 http://localhost/api/canchas    # el catálogo sembrado
open http://localhost                                     # la aplicación
```

El Swagger de cada microservicio, por su puerto directo:

- <http://localhost:8081/swagger-ui.html> — usuarios y autenticación
- <http://localhost:8082/swagger-ui.html> — canchas
- <http://localhost:8083/swagger-ui.html> — reservas
- <http://localhost:8084/swagger-ui.html> — reportes

## 6. Operación

### Arranque limpio

```bash
docker compose down -v && docker compose up -d --wait
```

El `-v` borra el volumen `pgdata`. Es lo que hace que vuelvan a ejecutarse los
scripts de `infra/postgres/init/` y las migraciones con su seed, dejando el
sistema exactamente como la primera vez.

**Sin `-v` los datos se conservan** entre arranques: es lo que se quiere entre
sesiones de trabajo, y lo que NO se quiere antes de una demostración.

### Detener sin borrar

```bash
docker compose down     # para los contenedores, conserva los datos
```

### Ver los registros

```bash
docker compose logs -f ms-reservas     # uno
docker compose logs -f                 # todos
```

### Reconstruir tras un cambio de código

```bash
docker compose up -d --wait --build ms-reservas
```

Sin `--build`, Compose reutiliza la imagen anterior y el cambio no surte efecto.
Es la equivocación más fácil de cometer.

### Trabajar solo en el frontend

```bash
docker compose up shell mf-reservas mf-administracion mf-reportes
```

Levanta los cuatro microfrontends sin el backend. Las llamadas a `/api` fallarán,
que es lo esperado.

## 7. Configuración

Todo se configura por variables de entorno, con valores por defecto que
funcionan sin definir ninguna. Las que importan:

| Variable | Por defecto | Qué controla |
|---|---|---|
| `POSTGRES_PASSWORD` | `postgres` | Contraseña del superusuario de PostgreSQL |
| `USUARIOS_DB_PASSWORD` | `usuarios_app` | Contraseña del rol de `usuarios_db` |
| `CANCHAS_DB_PASSWORD` | `canchas_app` | Contraseña del rol de `canchas_db` |
| `RESERVAS_DB_PASSWORD` | `reservas_app` | Contraseña del rol de `reservas_db` |
| `GATEWAY_PORT` | `8080` | Puerto del gateway en el anfitrión |
| `EDGE_PORT` | `80` | Puerto por el que se sirve la aplicación |

Se definen en un archivo `.env` en la raíz, que Compose lee solo:

```
POSTGRES_PASSWORD=una-contraseña-larga
USUARIOS_DB_PASSWORD=otra
CANCHAS_DB_PASSWORD=otra-más
RESERVAS_DB_PASSWORD=y-otra
```

**Ese archivo no se versiona** — está en `.gitignore`. Las contraseñas de base
se aplican al crear el volumen: si se cambian con `pgdata` ya existente, los
servicios no podrán conectarse. Hay que hacer `docker compose down -v` primero.

Cada microservicio recibe **solo la credencial de su propia base**. `ms-reportes`
no recibe ninguna porque no tiene base: obtiene todo por HTTP de `ms-reservas` y
`ms-canchas`.

## 8. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `port is already allocated` al arrancar | Otro proceso usa ese puerto | `GATEWAY_PORT=18080 docker compose up -d` |
| `/api/...` devuelve **502** | El gateway aún no está sano | Esperar; el edge resuelve los destinos en cada petición y se recupera solo |
| `/api/...` devuelve **503** | El microservicio destino no responde | `docker compose logs <servicio>` |
| Un microservicio reinicia en bucle | Flyway falló, o la base rechazó la conexión | `docker compose logs <servicio>`; si se cambiaron contraseñas, `down -v` |
| Los frontends quedan `unhealthy` | Su healthcheck no responde | `docker compose logs shell` |
| Un cambio de código no se refleja | Se levantó sin `--build` | `docker compose up -d --build <servicio>` |
| La sesión se cierra sola | La cuenta fue inactivada | El gateway verifica la credencial en cada petición; volver a entrar |

## 9. Ejecutar las pruebas

Las pruebas de reglas de negocio no necesitan base de datos ni Spring, pero sí
un JDK 21. Las de arranque (`*ApplicationTests`) levantan un PostgreSQL efímero
con Testcontainers, así que necesitan además acceso al demonio de Docker. Si la
máquina no tiene JDK 21, todo se ejecuta en contenedor:

```bash
docker volume create rc-m2
docker run --rm -v "$PWD/backend/ms-reservas:/build" -v rc-m2:/root/.m2 -w /build \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  eclipse-temurin:21-jdk-alpine ./mvnw -B test
```

Las 70 pruebas de los cinco servicios pasan.

La prueba de concurrencia de RN-02 sí necesita PostgreSQL real, y se ejecuta con
el sistema levantado:

```bash
docker run --rm --network reserva-canchas_backend \
  -v "$PWD/backend/ms-reservas:/build" -v rc-m2:/root/.m2 -w /build \
  -e RESERVAS_IT_DB_URL="jdbc:postgresql://postgres:5432/reservas_db" \
  eclipse-temurin:21-jdk-alpine ./mvnw -B test -Dtest=ConcurrenciaReservaIT
```

Diez repeticiones, y en todas exactamente una reserva se confirma.
