package com.ups.reservacanchas.reservas.domain.exception;

/**
 * El rol no permite la operación (RN-03, FR-018). Se traduce a 403.
 *
 * Es 403 y no 404 a propósito: cancelar la reserva de otro y fingir que no
 * existe ocultaría el motivo real y complicaría depurar.
 */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
