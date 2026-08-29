package com.ups.reservacanchas.reservas.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Tope de reservas activas simultáneas por usuario final (RN-06). */
public record ConfiguracionResponse(
        @Schema(description = "Tope de reservas activas simultáneas por usuario final", example = "3")
        int maxReservasActivas) {}
