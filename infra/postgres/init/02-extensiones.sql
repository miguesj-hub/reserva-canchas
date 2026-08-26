-- ---------------------------------------------------------------------------
-- 02-extensiones.sql — extensiones por base.
--
-- btree_gist es requisito de la restricción que implementa RN-02:
--
--     EXCLUDE USING gist (cancha_id WITH =, tsrange(...) WITH &&)
--
-- Un índice GiST no sabe comparar un `bigint` con `=` sin esta extensión, así
-- que sin ella la primera migración de ms-reservas (V1__reservas.sql) falla al
-- crear la restricción. Ver data-model.md § La restricción que implementa RN-02.
--
-- Se crea como superusuario, antes de que exista ninguna tabla; reservas_app la
-- usa sin necesitar privilegios para instalarla.
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

\connect reservas_db

CREATE EXTENSION IF NOT EXISTS btree_gist;
