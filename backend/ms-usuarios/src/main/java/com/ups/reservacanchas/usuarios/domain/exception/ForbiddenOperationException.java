package com.ups.reservacanchas.usuarios.domain.exception;

/**
 * FR-048: la gestión de usuarios es exclusiva del ADMINISTRADOR. Se traduce a 403.
 *
 * La regla vive en UserService y no en el controlador, para poder probarla sin
 * levantar Spring ni fabricar cabeceras HTTP.
 */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
