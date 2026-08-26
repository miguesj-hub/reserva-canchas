package com.ups.reservacanchas.canchas.dto;

import java.time.LocalDateTime;

/**
 * Cuerpo de error uniforme en los cuatro servicios (contracts/README.md).
 * Lo produce ErrorHandler, único punto donde una excepción de dominio se
 * convierte en un código HTTP.
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path) {}
