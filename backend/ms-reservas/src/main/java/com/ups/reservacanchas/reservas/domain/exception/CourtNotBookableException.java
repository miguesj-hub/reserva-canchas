package com.ups.reservacanchas.reservas.domain.exception;

/**
 * La cancha existe pero no admite esta reserva. Se traduce a 422, no a 409.
 *
 * La diferencia importa: un 409 es un conflicto que puede desaparecer solo —el
 * bloque puede liberarse—, mientras que esto no cambia por reintentar. Cubre la
 * cancha inactiva (FR-011), el bloque fuera del horario de atención y la fecha
 * ya pasada (FR-016).
 */
public class CourtNotBookableException extends RuntimeException {

    public CourtNotBookableException(String message) {
        super(message);
    }
}
