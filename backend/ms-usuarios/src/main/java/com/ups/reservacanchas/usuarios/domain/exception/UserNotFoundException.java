package com.ups.reservacanchas.usuarios.domain.exception;

/** El usuario no existe. El adaptador web la traduce a 404. */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }
}
