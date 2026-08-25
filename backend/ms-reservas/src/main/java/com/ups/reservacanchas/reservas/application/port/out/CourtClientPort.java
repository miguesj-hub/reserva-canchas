package com.ups.reservacanchas.reservas.application.port.out;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Puerto hacia ms-canchas. **No hacia canchas_db**: este servicio no tiene la
 * credencial de esa base y su rol no puede conectarse a ella (Principio IV).
 * Lo implementa CourtClientAdapter sobre HTTP.
 *
 * El record vive dentro del puerto y no en domain/ porque no es una entidad de
 * este dominio: es la foto que ms-canchas devuelve de algo que le pertenece a
 * él. Este servicio la lee y no la guarda.
 */
public interface CourtClientPort {

    Optional<Cancha> buscar(Long canchaId);

    /**
     * Los bloqueos de mantenimiento que afectan a esa cancha ese día (FR-010).
     * También viven en canchas_db, así que también se preguntan por HTTP.
     */
    List<Bloqueo> bloqueosDe(Long canchaId, LocalDate fecha);

    record Cancha(
            Long id,
            String nombre,
            String deporte,
            LocalTime horaApertura,
            LocalTime horaCierre,
            boolean activa) {}

    /**
     * Un rango bloqueado por mantenimiento. Fin exclusivo, igual que TimeSlot:
     * un bloqueo que termina a las 10:00 no inutiliza el bloque de 10:00 a 11:00.
     */
    record Bloqueo(LocalDateTime desde, LocalDateTime hasta) {

        public boolean cubre(LocalDateTime inicioBloque, LocalDateTime finBloque) {
            return inicioBloque.isBefore(hasta) && desde.isBefore(finBloque);
        }
    }
}
