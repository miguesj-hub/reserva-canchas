package com.ups.reservacanchas.reportes.dto;

import java.time.LocalDateTime;

/** Cuerpo de error uniforme en los cuatro servicios (contracts/README.md). */
public record ErrorResponse(
        LocalDateTime timestamp, int status, String error, String message, String path) {}
