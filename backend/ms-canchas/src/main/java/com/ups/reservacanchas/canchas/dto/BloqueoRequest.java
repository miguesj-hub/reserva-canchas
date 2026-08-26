package com.ups.reservacanchas.canchas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Registro de un bloqueo de mantenimiento (FR-034).
 *
 * Los instantes son `date-time` sin zona: una sola zona horaria en todo el
 * sistema, la local de la instalación (contracts/README.md § Formatos).
 */
public record BloqueoRequest(
        @NotNull LocalDateTime desde,
        @NotNull LocalDateTime hasta,
        @Size(max = 200) String motivo) {}
