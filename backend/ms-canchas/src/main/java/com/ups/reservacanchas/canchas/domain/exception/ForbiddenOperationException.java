package com.ups.reservacanchas.canchas.domain.exception;

/**
 * RN-07: solo el ADMINISTRADOR gestiona el catálogo. Se traduce a 403.
 *
 * La regla vive en CourtService y no en el controlador, para poder probarla sin
 * levantar Spring ni fabricar cabeceras HTTP.
 */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
