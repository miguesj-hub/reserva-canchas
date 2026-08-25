package com.ups.reservacanchas.reportes.domain;

import java.time.LocalDate;

/**
 * El rango sobre el que se calcula cualquier indicador. Sin anotaciones: este
 * servicio no tiene base de datos y su dominio no sabe de HTTP ni de JPA.
 *
 * Que sea un tipo y no dos `LocalDate` sueltos es lo que permite que la
 * invariante —hasta no puede ser anterior a desde— viva en un solo sitio, y que
 * el número de días del período se calcule igual en los cuatro indicadores.
 */
public record PeriodSummary(LocalDate desde, LocalDate hasta) {

    public PeriodSummary {
        if (desde == null || hasta == null) {
            throw new IllegalArgumentException("El reporte necesita un rango de fechas completo.");
        }
    }

    public boolean contiene(LocalDate fecha) {
        return fecha != null && !fecha.isBefore(desde) && !fecha.isAfter(hasta);
    }

    /** Ambos extremos incluidos: un rango de un solo día son 1 día, no 0. */
    public long dias() {
        return java.time.temporal.ChronoUnit.DAYS.between(desde, hasta) + 1;
    }
}
