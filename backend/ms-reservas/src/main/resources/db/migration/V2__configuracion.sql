-- ---------------------------------------------------------------------------
-- V2__configuracion.sql — parámetros del sistema.
--
-- Una sola fila obligatoria: el tope de reservas activas de RN-06. Se lee por
-- ConfigurationRepositoryPort en cada creación, así que cambiar el valor con un
-- UPDATE surte efecto sin reiniciar nada.
--
-- Es un parámetro, no una pantalla: §3.2 no lista ninguna de configuración y
-- añadirla sería alcance nuevo.
-- ---------------------------------------------------------------------------

CREATE TABLE configuracion (
    clave varchar(60)  PRIMARY KEY,
    valor varchar(120) NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES ('max_reservas_activas', '3');
