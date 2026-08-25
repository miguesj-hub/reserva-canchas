package com.ups.reservacanchas.reportes.application.port.out;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Puerto hacia ms-reservas. **No hacia reservas_db**: este servicio no tiene
 * base, ni driver JDBC, ni credencial. Es la aplicación del Principio IV, y
 * resuelve a favor de §4.3 la ambigüedad de la tabla de §4.2.
 *
 * Dos operaciones y no una porque los indicadores preguntan cosas distintas:
 * tres de ellos filtran por la fecha del bloque y el de cancelaciones por la
 * fecha en que se canceló, que son rangos independientes.
 */
public interface BookingsClientPort {

    /** Las reservas cuyo BLOQUE cae en el rango, en cualquier estado. */
    List<Reserva> reservasDelPeriodo(LocalDate desde, LocalDate hasta);

    /** Las canceladas, para filtrarlas después por su fecha de cancelación. */
    List<Reserva> canceladas();

    record Reserva(
            Long id,
            Long canchaId,
            Long usuarioId,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin,
            String estado,
            LocalDateTime canceladaEn) {

        /** FR-038: lo que efectivamente ocupó la cancha. Excluye las canceladas. */
        public boolean cuentaComoUso() {
            return "CONFIRMADA".equals(estado) || "FINALIZADA".equals(estado);
        }

        public double horas() {
            return java.time.Duration.between(horaInicio, horaFin).toMinutes() / 60d;
        }
    }
}
