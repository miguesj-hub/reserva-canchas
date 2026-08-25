package com.ups.reservacanchas.canchas.domain.exception;

/** La cancha no existe. El adaptador web la traduce a 404. */
public class CourtNotFoundException extends RuntimeException {

    public CourtNotFoundException(String message) {
        super(message);
    }
}
