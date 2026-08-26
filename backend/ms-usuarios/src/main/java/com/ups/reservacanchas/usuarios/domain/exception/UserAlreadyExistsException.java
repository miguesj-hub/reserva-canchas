package com.ups.reservacanchas.usuarios.domain.exception;

/** El username ya pertenece a otra cuenta (FR-002). El adaptador web la traduce a 409. */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
