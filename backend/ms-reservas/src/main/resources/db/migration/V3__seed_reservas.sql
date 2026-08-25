-- ---------------------------------------------------------------------------
-- V3__seed_reservas.sql — reservas de ejemplo en los tres estados de RN-08.
--
-- **Fechas relativas al arranque, no absolutas.** Es la diferencia entre una
-- demostración que funciona hoy y una que caduca: las confirmadas caen en el
-- futuro para poder cancelarlas en vivo y enseñar RN-04 y RN-05, y las
-- terminadas en el pasado reciente para que los reportes tengan de qué hablar.
-- Con fechas fijas, a la semana siguiente todo sería pasado y la mitad de la
-- demostración dejaría de poder hacerse.
--
-- Tres condiciones que el seed respeta y por qué:
--
--   · Sin solapamientos entre confirmadas de la misma cancha: la restricción
--     EXCLUDE rechazaría el INSERT y la migración fallaría al arrancar.
--   · Ningún usuario supera el tope de RN-06 (3 activas): si el seed lo
--     superara, `cliente1` no podría reservar en la demostración.
--   · Demanda desigual entre canchas —Pádel 1 concentra la mayoría— para que el
--     ranking de §3.3.5 tenga un extremo alto y otro bajo que mostrar.
--
-- Los usuarios son los de usuarios_db (1 admin, 2 cliente1, 3 cliente2) y las
-- canchas las de canchas_db (1-4 activas). No hay clave foránea posible: viven
-- en otras bases.
-- ---------------------------------------------------------------------------

-- --- Confirmadas futuras: lo que se puede cancelar en vivo (RN-04, RN-05) ---
INSERT INTO reserva (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado) VALUES
    (1, 2, CURRENT_DATE + 1, '19:00', '20:00', 'CONFIRMADA'),
    (1, 3, CURRENT_DATE + 1, '20:00', '21:00', 'CONFIRMADA'),
    (3, 2, CURRENT_DATE + 2, '18:00', '19:00', 'CONFIRMADA'),
    (4, 3, CURRENT_DATE + 3, '10:00', '11:00', 'CONFIRMADA');

-- --- Pasadas: se leen como FINALIZADA, sin que nada las marque -------------
-- El estado escrito sigue siendo CONFIRMADA; Booking#estadoVigente lo deriva al
-- leer comparando la hora de fin con el ahora (FR-027).
INSERT INTO reserva (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado) VALUES
    (1, 2, CURRENT_DATE - 2, '19:00', '20:00', 'CONFIRMADA'),
    (1, 3, CURRENT_DATE - 3, '18:00', '19:00', 'CONFIRMADA'),
    (1, 2, CURRENT_DATE - 5, '20:00', '21:00', 'CONFIRMADA'),
    (2, 3, CURRENT_DATE - 4, '09:00', '10:00', 'CONFIRMADA'),
    (3, 2, CURRENT_DATE - 6, '17:00', '18:00', 'CONFIRMADA');

-- --- Canceladas: alimentan el reporte de cancelaciones del período ---------
INSERT INTO reserva (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, cancelada_en) VALUES
    (1, 3, CURRENT_DATE - 1, '21:00', '22:00', 'CANCELADA', now() - interval '2 days'),
    (4, 2, CURRENT_DATE + 4, '11:00', '12:00', 'CANCELADA', now() - interval '1 day');
