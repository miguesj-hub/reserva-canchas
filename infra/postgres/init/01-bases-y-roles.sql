-- ---------------------------------------------------------------------------
-- 01-bases-y-roles.sql — aislamiento de datos entre microservicios (Principio IV)
--
-- Lo ejecuta el entrypoint de postgres UNA SOLA VEZ, cuando el volumen `pgdata`
-- está vacío, en orden alfabético y contra la base por defecto como superusuario.
-- Para volver a correrlo: `docker compose down -v && docker compose up`.
--
-- Cada base tiene un rol propietario que NO puede conectarse a las otras dos.
-- Así, si algún día un servicio intenta leer la base de otro, falla al conectar
-- en lugar de pasar desapercibido en revisión. Ver data-model.md § Aislamiento.
--
-- ms-reportes no recibe rol: no tiene base propia, agrega por REST.
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

-- Las contraseñas llegan por variable de entorno del contenedor: no se versiona
-- ninguna credencial en este archivo. docker-compose.yml las inyecta.
\getenv usuarios_pass USUARIOS_DB_PASSWORD
\getenv canchas_pass  CANCHAS_DB_PASSWORD
\getenv reservas_pass RESERVAS_DB_PASSWORD

-- --- Roles -----------------------------------------------------------------
CREATE ROLE usuarios_app LOGIN PASSWORD :'usuarios_pass';
CREATE ROLE canchas_app  LOGIN PASSWORD :'canchas_pass';
CREATE ROLE reservas_app LOGIN PASSWORD :'reservas_pass';

-- --- Bases, cada una con su dueño ------------------------------------------
-- El dueño de la base es también dueño de su esquema `public` (PostgreSQL 15+),
-- así que Flyway puede crear tablas sin ningún GRANT adicional.
CREATE DATABASE usuarios_db OWNER usuarios_app;
CREATE DATABASE canchas_db  OWNER canchas_app;
CREATE DATABASE reservas_db OWNER reservas_app;

-- --- Sin permisos cruzados --------------------------------------------------
-- Por defecto PUBLIC puede conectarse a cualquier base: se le quita y se
-- concede el CONNECT solo al rol dueño.
REVOKE CONNECT ON DATABASE usuarios_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE canchas_db  FROM PUBLIC;
REVOKE CONNECT ON DATABASE reservas_db FROM PUBLIC;

GRANT CONNECT ON DATABASE usuarios_db TO usuarios_app;
GRANT CONNECT ON DATABASE canchas_db  TO canchas_app;
GRANT CONNECT ON DATABASE reservas_db TO reservas_app;
