-- ---------------------------------------------------------------------------
-- V2__seed_canchas.sql — catálogo de arranque.
--
-- Tres cosas que el seed tiene que garantizar y por qué:
--
-- 1. **Al menos una cancha por deporte**, con horario 07:00–22:00, para que el
--    filtro por deporte de la pantalla de disponibilidad tenga las tres
--    opciones desde el primer arranque.
-- 2. **Una cancha inactiva**, para poder demostrar FR-011 —que no se ofrece—
--    sin tener que inactivar una a mano antes de la demostración.
-- 3. **Demanda desigual entre canchas**, que la consigue V3__seed_reservas.sql
--    de ms-reservas repartiendo sus reservas de forma despareja sobre estas
--    canchas: el ranking de §3.3.5 necesita un extremo alto y uno bajo, y con
--    todas las canchas igual de ocupadas no mostraría nada.
--
-- Los ids van explícitos porque el seed de reservas se refiere a ellos y vive
-- en otra base, sin clave foránea posible.
-- ---------------------------------------------------------------------------

INSERT INTO cancha (id, nombre, deporte, hora_apertura, hora_cierre, activa) VALUES
    (1, 'Pádel 1 — Cristal',    'PADEL',   '07:00', '22:00', true),
    (2, 'Pádel 2 — Muro',       'PADEL',   '07:00', '22:00', true),
    (3, 'Tenis 1 — Polvo',      'TENIS',   '07:00', '22:00', true),
    (4, 'Básquet 1 — Techada',  'BASQUET', '07:00', '22:00', true),
    (5, 'Tenis 2 — En obra',    'TENIS',   '08:00', '20:00', false);

ALTER TABLE cancha ALTER COLUMN id RESTART WITH 6;
