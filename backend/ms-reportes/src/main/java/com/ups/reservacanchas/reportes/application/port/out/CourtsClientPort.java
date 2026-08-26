package com.ups.reservacanchas.reportes.application.port.out;

import java.time.LocalTime;
import java.util.List;

/**
 * Puerto hacia ms-canchas. Aporta el denominador de la ocupación —el horario de
 * atención— y los nombres con los que se presentan los indicadores.
 *
 * Devuelve también las canchas inactivas: una cancha inactivada a mitad de mes
 * tuvo reservas ese mes, y omitirla haría que los números no cuadraran contra
 * el listado global (FR-042).
 */
public interface CourtsClientPort {

    List<Cancha> todas();

    record Cancha(
            Long id, String nombre, String deporte,
            LocalTime horaApertura, LocalTime horaCierre, boolean activa) {

        /** Horas de atención de un día. Es el denominador por día de FR-039. */
        public double horasPorDia() {
            return java.time.Duration.between(horaApertura, horaCierre).toMinutes() / 60d;
        }
    }
}
