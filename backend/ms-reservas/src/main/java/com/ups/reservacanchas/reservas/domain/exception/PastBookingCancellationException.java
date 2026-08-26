package com.ups.reservacanchas.reservas.domain.exception;

/**
 * RN-04: la hora de inicio ya ocurrió, así que no se cancela. Se traduce a 409.
 * Aplica igual al ADMINISTRADOR: la regla es del calendario, no del rol.
 */
public class PastBookingCancellationException extends RuntimeException {

    public PastBookingCancellationException(String message) {
        super(message);
    }
}
