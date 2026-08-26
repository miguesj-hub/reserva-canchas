package com.ups.reservacanchas.reservas.domain.exception;

/** RN-06: el usuario alcanzó el tope de reservas activas. Se traduce a 409. */
public class ActiveBookingLimitExceededException extends RuntimeException {

    public ActiveBookingLimitExceededException(String message) {
        super(message);
    }
}
