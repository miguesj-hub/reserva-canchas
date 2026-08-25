package com.ups.reservacanchas.reservas.domain.exception;

/**
 * La cancha no existe. Se traduce a 404.
 *
 * Es distinta de CourtNotBookableException: aquella dice "existe pero no sirve
 * para esto" (422). contracts/reservas.yaml pide 404 en la consulta de
 * disponibilidad cuando la cancha no existe, y sin este tipo no habría forma de
 * producirlo sin mentir con el nombre de otra excepción.
 */
public class CourtNotFoundException extends RuntimeException {

    public CourtNotFoundException(String message) {
        super(message);
    }
}
