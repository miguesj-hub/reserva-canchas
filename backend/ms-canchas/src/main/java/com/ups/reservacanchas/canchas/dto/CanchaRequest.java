package com.ups.reservacanchas.canchas.dto;

import com.ups.reservacanchas.canchas.domain.Sport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Alta y edición de una cancha (contracts/canchas.yaml).
 *
 * `deporte` es el enum y no un String: un valor fuera de la lista se rechaza
 * con 400 al deserializar, sin que ninguna validación tenga que recordarlo
 * (R-008).
 *
 * Las horas viajan como "HH:mm" y se validan con un patrón antes de parsearse:
 * así un "25:00" da 400 con un mensaje de campo, y no un 500 al parsear.
 */
public record CanchaRequest(
        @NotBlank @Size(min = 1, max = 120) String nombre,
        @NotNull Sport deporte,
        @NotBlank
        @Pattern(regexp = "^([01][0-9]|2[0-3]):[0-5][0-9]$", message = "debe tener el formato HH:mm")
        String horaApertura,
        @NotBlank
        @Pattern(regexp = "^([01][0-9]|2[0-3]):[0-5][0-9]$", message = "debe tener el formato HH:mm")
        String horaCierre,
        Boolean activa) {

    /** El contrato marca `activa` con default true: omitirlo crea una cancha activa. */
    public boolean activaODefecto() {
        return activa == null || activa;
    }
}
