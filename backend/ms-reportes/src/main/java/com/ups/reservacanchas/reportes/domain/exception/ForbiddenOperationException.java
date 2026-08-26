package com.ups.reservacanchas.reportes.domain.exception;

/** FR-043: el módulo de reportes es solo del ADMINISTRADOR. Se traduce a 403. */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
