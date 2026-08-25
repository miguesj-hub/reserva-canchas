package com.ups.reservacanchas.reportes.domain.exception;

/** Rango de fechas ausente o invertido (FR-044). El adaptador web lo traduce a 400. */
public class InvalidDateRangeException extends RuntimeException {

    public InvalidDateRangeException(String message) {
        super(message);
    }
}
