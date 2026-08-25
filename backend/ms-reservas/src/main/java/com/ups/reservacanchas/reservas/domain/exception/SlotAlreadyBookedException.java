package com.ups.reservacanchas.reservas.domain.exception;

/**
 * RN-02: ese bloque ya tiene una reserva confirmada. El adaptador web la
 * traduce a 409.
 *
 * Llega por dos caminos con el mismo cuerpo: la comprobación previa de
 * BookingService, que da el mensaje claro en el caso normal, y la restricción
 * EXCLUDE de PostgreSQL traducida por BookingRepositoryAdapter, que cubre la
 * carrera entre dos peticiones simultáneas (R-004). El cliente no puede
 * distinguirlos, y no debe.
 */
public class SlotAlreadyBookedException extends RuntimeException {

    public SlotAlreadyBookedException(String message) {
        super(message);
    }
}
