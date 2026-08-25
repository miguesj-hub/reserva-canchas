package com.ups.reservacanchas.reservas.domain;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Un bloque horario: la unidad reservable (RN-01).
 *
 * La duración es de una hora, la franja que RN-01 da como ejemplo y que el spec
 * fija como decisión (§ Decisiones, "Duración del bloque horario"). Está aquí y
 * no repartida por el servicio para que cambiarla sea un solo cambio.
 *
 * El fin es exclusivo: un bloque 10:00–11:00 no choca con uno 11:00–12:00. Es la
 * misma semántica que el '[)' de la restricción EXCLUDE en la base, y tienen
 * que coincidir o la comprobación previa y la de la base discreparían.
 */
public record TimeSlot(LocalTime inicio, LocalTime fin) {

    public static final Duration DURACION = Duration.ofHours(1);

    public TimeSlot {
        if (inicio == null || fin == null) {
            throw new IllegalArgumentException("Un bloque necesita hora de inicio y de fin.");
        }
        if (!fin.isAfter(inicio)) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la de inicio.");
        }
    }

    /** El bloque de una hora que empieza a esa hora. */
    public static TimeSlot deUnaHoraDesde(LocalTime inicio) {
        return new TimeSlot(inicio, inicio.plus(DURACION));
    }

    /** Solape con fin exclusivo, igual que el tsrange '[)' de la base. */
    public boolean seSolapaCon(TimeSlot otro) {
        return inicio.isBefore(otro.fin) && otro.inicio.isBefore(fin);
    }

    public LocalDateTime inicioEn(LocalDate fecha) {
        return LocalDateTime.of(fecha, inicio);
    }

    public LocalDateTime finEn(LocalDate fecha) {
        return LocalDateTime.of(fecha, fin);
    }
}
