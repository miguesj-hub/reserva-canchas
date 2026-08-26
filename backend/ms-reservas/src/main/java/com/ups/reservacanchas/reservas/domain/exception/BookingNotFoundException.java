package com.ups.reservacanchas.reservas.domain.exception;

/** La reserva no existe. Se traduce a 404. */
public class BookingNotFoundException extends RuntimeException {

    public BookingNotFoundException(String message) {
        super(message);
    }
}
