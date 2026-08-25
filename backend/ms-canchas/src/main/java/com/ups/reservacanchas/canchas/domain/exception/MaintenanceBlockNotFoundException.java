package com.ups.reservacanchas.canchas.domain.exception;

/** El bloqueo no existe. Se traduce a 404. */
public class MaintenanceBlockNotFoundException extends RuntimeException {

    public MaintenanceBlockNotFoundException(String message) {
        super(message);
    }
}
