package com.ups.reservacanchas.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

/**
 * Petición de reserva (contracts/reservas.yaml).
 *
 * **Sin `usuarioId`**: el dueño es siempre quien hace la petición, tomado de
 * X-User-Id. Aceptarlo en el cuerpo permitiría reservar a nombre de otro.
 *
 * Sin `horaFin`: el bloque dura una hora y el fin se deriva. Aceptarlo abriría
 * la puerta a reservas de duración arbitraria, que RN-01 no contempla.
 */
public record ReservaRequest(
        @NotNull Long canchaId,
        @NotNull LocalDate fecha,
        @NotBlank
        @Pattern(regexp = "^([01][0-9]|2[0-3]):[0-5][0-9]$", message = "debe tener el formato HH:mm")
        String horaInicio) {}
