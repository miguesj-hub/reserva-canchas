# Quickstart — levantar y validar el sistema

**Fase 1** · 2026-08-24 · [plan.md](./plan.md) · [contracts/](./contracts/) · [data-model.md](./data-model.md)

Un solo comando deja el sistema completo arriba, con datos de prueba, sin ningún paso manual
(Principio VII). Es también el guion de la demostración: los cinco escenarios de validación cubren
los seis criterios de aceptación de §7.

```bash
git clone <repo> && cd reserva-canchas
docker compose up
# abrir http://localhost
```

Requisito único: Docker 24+ con Compose v2. No hace falta instalar Java, Node ni PostgreSQL.

## Estado de partida

`docker-compose.yml` hoy define solo cuatro servicios de frontend, todos bajo los perfiles
`[frontend, full]`, y declara las dos redes `frontend` y `backend` aunque nada use la segunda.
Completarlo es trabajo de la Historia 1.

> Al abrirlo hay una errata que rompe el arranque: `shell` tiene `restart: unless-stoped`, con una
> `p`. Compose rechaza el valor. Se corrige al tocar el archivo.

## Lo que hay que añadir

### `docker-compose.yml`

Se conservan los cuatro servicios de frontend tal como están —solo cambian de perfil a `full`— y se
suman ocho:

| Servicio | Imagen o build | Red | Puerto | Depende de |
|---|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `backend` | 5432 | — |
| `ms-usuarios` | `backend/ms-usuarios` | `backend` | 8081 | `postgres` sano |
| `ms-canchas` | `backend/ms-canchas` | `backend` | 8082 | `postgres` sano |
| `ms-reservas` | `backend/ms-reservas` | `backend` | 8083 | `postgres` sano, `ms-canchas` sano |
| `ms-reportes` | `backend/ms-reportes` | `backend` | 8084 | `ms-reservas` y `ms-canchas` sanos |
| `gateway` | `backend/api-gateway` | `backend` | 8080 | los cuatro sanos |
| `edge` | `nginx:1.27-alpine` | **`frontend` y `backend`** | **80** | `gateway`, `shell`, los tres remotes |

Puntos que no son negociables porque los fija el DSL o la constitución:

- **El edge es el único contenedor conectado a las dos redes.** Es lo que impide que el navegador
  llegue a un microservicio y lo que obliga a que todo pase por el gateway.
- **`depends_on` con `condition: service_healthy`**, apoyado en el `health` de Actuator de cada
  servicio y en `pg_isready` para PostgreSQL. Sin esto el arranque es una carrera: Flyway intenta
  migrar contra una base que todavía no acepta conexiones.
- **Un usuario de base distinto por servicio**, por variable de entorno. `ms-reservas` no recibe
  jamás la credencial de `canchas_db` (Principio IV).
- **`ms-reportes` no recibe ninguna credencial de base**: no tiene ninguna.
- **Volumen `pgdata`** para los datos. Los scripts de `infra/postgres/init/` corren solo cuando está
  vacío; por eso `docker compose down -v` es lo que fuerza un arranque limpio.
- El perfil `frontend` se conserva para trabajar solo en microfrontends sin levantar el backend.

### `infra/postgres/init/`

Se ejecutan una sola vez, en orden alfabético, cuando el volumen está vacío.

- `01-bases-y-roles.sql` — crea `usuarios_db`, `canchas_db` y `reservas_db`, y un rol por base.
  Revoca `CONNECT` a `PUBLIC` sobre cada una y lo concede solo a su dueño. Es lo que convierte la
  independencia de datos en algo que la base impone, no en una convención que alguien recuerda.
- `02-extensiones.sql` — `CREATE EXTENSION btree_gist` en `reservas_db`. Sin esto, la restricción
  `EXCLUDE` de RN-02 no se puede crear y la primera migración de `ms-reservas` falla.

### `infra/edge/nginx.conf`

Un solo origen, `http://localhost`. Es lo que elimina el CORS de los chunks federados en lugar de
parchearlo con cabeceras permisivas en cada servicio.

```nginx
server {
    listen 80;

    # El shell en la raíz
    location / {
        proxy_pass http://shell:80;
    }

    # Cada remote bajo el prefijo con el que se compiló (PUBLIC_PATH)
    location /mf-reservas/       { proxy_pass http://mf-reservas:80/; }
    location /mf-administracion/ { proxy_pass http://mf-administracion:80/; }
    location /mf-reportes/       { proxy_pass http://mf-reportes:80/; }

    # La API, al gateway. Único camino del navegador hacia el backend.
    location /api/ {
        proxy_pass http://gateway:8080;
        proxy_set_header Host $host;
    }
}
```

El `PUBLIC_PATH` con el que se construye cada remote —ya presente en el compose actual— tiene que
coincidir exactamente con su `location`. Si no, el remote carga su `remoteEntry.js` pero pide sus
chunks contra una ruta que no existe, y falla solo al navegar a esa sección.

### Dockerfile por microservicio

Los cinco proyectos no tienen Dockerfile todavía; `template-backend/microservice-template/` sí, y es
de donde sale. Construcción en dos etapas: `maven` con el wrapper para compilar, `eclipse-temurin:21-jre`
para ejecutar.

## Verificar que levantó

```bash
docker compose ps                      # los doce servicios en estado healthy
curl http://localhost/api/canchas -u cliente1:cliente1   # el catálogo sembrado
open http://localhost                  # la aplicación
```

Swagger de cada servicio, por su puerto directo: `http://localhost:8081/swagger-ui.html` y sus
hermanos en 8082, 8083 y 8084.

## Usuarios de prueba

Los siembra `V2__seed_usuarios.sql`. Van también en el manual de despliegue (E5).

| Usuario | Contraseña | Rol | Para qué |
|---|---|---|---|
| `admin` | `admin` | ADMINISTRADOR | Historias 2, 3 y 4 |
| `cliente1` | `cliente1` | USUARIO_FINAL | Historia 1 |
| `cliente2` | `cliente2` | USUARIO_FINAL | El segundo lado del escenario de concurrencia |
| `inactivo` | `inactivo` | USUARIO_FINAL, inactivo | Demostrar FR-005 y la Historia 4 |

## Escenarios de validación

Cada uno se ejecuta contra el sistema recién levantado y cubre criterios concretos.

### V1 — Reservar y cancelar (US1 · §7.1, §7.3)

1. Entrar como `cliente1`, ir a Disponibilidad, elegir una cancha de pádel y una fecha futura.
2. Comprobar que se ven los bloques del horario de atención, libres y ocupados.
3. Reservar un bloque libre → 201, aparece en Mis reservas como CONFIRMADA.
4. Volver a Disponibilidad: el bloque figura ocupado.
5. Intentar reservar ese mismo bloque desde otra sesión → **409** con el motivo en pantalla (RN-02).
6. Cancelar la reserva desde Mis reservas → pasa a CANCELADA.
7. Volver a Disponibilidad: el bloque está libre otra vez (RN-05).

### V2 — La carrera de RN-02 (SC-004)

El escenario que ninguna comprobación previa cubre y que la restricción `EXCLUDE` sí.

```bash
# Dos peticiones simultáneas de dos usuarios distintos sobre el mismo bloque
BODY='{"canchaId":1,"fecha":"2026-09-15","horaInicio":"19:00"}'
curl -s -o /dev/null -w "%{http_code}\n" -u cliente1:cliente1 \
     -H 'Content-Type: application/json' -d "$BODY" http://localhost/api/reservas &
curl -s -o /dev/null -w "%{http_code}\n" -u cliente2:cliente2 \
     -H 'Content-Type: application/json' -d "$BODY" http://localhost/api/reservas &
wait
```

**Esperado**: un `201` y un `409`, en cualquier orden. Nunca dos `201`. SC-004 pide 10 repeticiones
con el mismo resultado.

### V3 — Catálogo y cancelación administrativa (US2 · §7.2)

1. Entrar como `admin`, crear una cancha de básquet con horario 07:00–22:00.
2. Verla aparecer en Disponibilidad desde la sesión de `cliente1`.
3. Editarle el horario a 09:00–20:00 y comprobar que cambian los bloques ofrecidos.
4. Registrar un bloqueo de mantenimiento y comprobar que sus bloques dejan de ser reservables.
5. Inactivarla y comprobar que deja de ofrecerse, sin que desaparezcan las reservas ya hechas.
6. Desde Gestión de reservas, cancelar una reserva de `cliente1` y verla cancelada en su sesión.

### V4 — Los cuatro indicadores (US3 · §7.4 · SC-006)

1. Entrar como `admin`, abrir Reportes y elegir un rango que incluya el seed.
2. Verificar los cuatro: reservas por cancha y por deporte, ocupación por cancha, cancelaciones del
   período, y el ranking con sus extremos de mayor y menor demanda.
3. Contar a mano sobre el listado global de reservas del mismo rango: los números deben coincidir.
4. Cancelar una reserva del rango y recargar: una reserva menos, una cancelación más.
5. Intentar `GET /api/reportes/ocupacion` como `cliente1` → **403**.

### V5 — Acceso y roles (US4 · FR-005, FR-006)

1. Intentar iniciar sesión como `inactivo` → rechazado, con el motivo.
2. Como `admin`, activar a `inactivo` desde Gestión de usuarios; entrar con él → funciona.
3. Volver a inactivarlo; sus reservas siguen existiendo (FR-047).
4. Sin pasar por la pantalla, comprobar que el rol se aplica igual:

```bash
# Un usuario final intentando crear una cancha
curl -s -o /dev/null -w "%{http_code}\n" -u cliente1:cliente1 \
     -H 'Content-Type: application/json' \
     -d '{"nombre":"X","deporte":"PADEL","horaApertura":"07:00","horaCierre":"22:00"}' \
     http://localhost/api/canchas          # esperado: 403

# Una cabecera de identidad falsificada por el cliente
curl -s -u cliente1:cliente1 -H 'X-User-Role: ADMINISTRADOR' \
     http://localhost/api/usuarios          # esperado: 403 — el gateway la descarta
```

El segundo comando es el que prueba que la confianza entre gateway y microservicios es segura.

## Arranque limpio

```bash
docker compose down -v && docker compose up
```

Borra el volumen, así que los scripts de `infra/postgres/init/` y el seed vuelven a correr. Es la
comprobación de la compuerta 7 y debe dejar el sistema en el mismo estado que la primera vez: el
seed usa fechas relativas al arranque, no absolutas, para que las reservas confirmadas sigan siendo
futuras y RN-04 se pueda demostrar cancelando en vivo.
