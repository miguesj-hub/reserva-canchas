package com.ups.reservacanchas.reservas.application.port.out;

import java.time.LocalTime;
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

    record Cancha(
            Long id,
            String nombre,
            String deporte,
            LocalTime horaApertura,
            LocalTime horaCierre,
            boolean activa) {}
}
