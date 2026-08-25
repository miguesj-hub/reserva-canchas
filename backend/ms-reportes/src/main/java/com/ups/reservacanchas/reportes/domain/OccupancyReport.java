package com.ups.reservacanchas.reportes.domain;

/**
 * Ocupación de una cancha en un período (FR-039): horas reservadas sobre horas
 * disponibles del horario de atención en los días del rango.
 *
 * El porcentaje se calcula aquí y no en el adaptador web, para que el número que
 * se muestra y el que se probaría sean el mismo.
 */
public record OccupancyReport(
        Long canchaId,
        String canchaNombre,
        String deporte,
        double horasReservadas,
        double horasDisponibles) {

    public double porcentaje() {
        // Una cancha con horario de duración cero no existe (lo impide el CHECK
        // de la tabla), pero dividir por cero aquí produciría NaN y ensuciaría
        // el JSON con un valor que ningún cliente sabe interpretar.
        if (horasDisponibles <= 0) {
            return 0d;
        }
        return Math.round(horasReservadas / horasDisponibles * 1000d) / 10d;
    }
}
