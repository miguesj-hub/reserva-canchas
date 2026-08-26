package com.ups.reservacanchas.canchas.domain;

import java.time.Duration;
import java.time.LocalTime;

/**
 * Horario de atención de una cancha (RN-07). Es lo que delimita qué bloques
 * existen: la disponibilidad no inventa horas fuera de aquí (FR-008).
 *
 * Objeto de valor: no tiene identidad propia ni vive en su propia tabla, es
 * parte de la cancha. Que sea un tipo y no dos `LocalTime` sueltos es lo que
 * permite que la invariante "cierra después de abrir" viva en un solo sitio.
 */
public record OpeningHours(LocalTime apertura, LocalTime cierre) {

    public OpeningHours {
        if (apertura == null || cierre == null) {
            throw new IllegalArgumentException("El horario de atención necesita hora de apertura y de cierre.");
        }
        if (!cierre.isAfter(apertura)) {
            throw new IllegalArgumentException(
                    "La hora de cierre (" + cierre + ") debe ser posterior a la de apertura (" + apertura + ").");
        }
    }

    /** ¿Cabe entero dentro del horario un bloque que empieza a esta hora? */
    public boolean contieneBloqueQueEmpiezaA(LocalTime inicio, Duration duracion) {
        if (inicio.isBefore(apertura)) {
            return false;
        }
        LocalTime fin = inicio.plus(duracion);
        // fin.isAfter(inicio) descarta el bloque que cruzaría la medianoche:
        // LocalTime da la vuelta al llegar a las 24:00 y compararlo sin más
        // dejaría pasar un 23:30-00:30.
        return fin.isAfter(inicio) && !fin.isAfter(cierre);
    }
}
