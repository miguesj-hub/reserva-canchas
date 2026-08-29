package com.ups.reservacanchas.reservas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Cambio del tope de RN-06.
 *
 * `Integer` y no `int`: con el primitivo, un cuerpo sin el campo llegaría como
 * 0 y @NotNull nunca dispararía, de modo que la petición se rechazaría con un
 * mensaje sobre el mínimo en vez de sobre el campo que falta (FR-054).
 */
public record ConfiguracionRequest(
        @NotNull(message = "maxReservasActivas es obligatorio")
        @Min(value = 1, message = "El tope debe ser un entero mayor o igual a 1")
        @Schema(description = "Nuevo tope de reservas activas simultáneas", example = "3")
        Integer maxReservasActivas) {}
