-- Lo mismo que hace infra/postgres/init/02-extensiones.sql en el sistema real.
--
-- V1__reservas.sql crea la restricción EXCLUDE que implementa RN-02, y un
-- índice GiST no sabe comparar un bigint con '=' sin btree_gist. En el
-- despliegue la extensión la instala el script de inicialización del volumen;
-- en pruebas hay que instalarla aquí, antes de que Flyway migre, o la primera
-- migración falla.
CREATE EXTENSION IF NOT EXISTS btree_gist;
