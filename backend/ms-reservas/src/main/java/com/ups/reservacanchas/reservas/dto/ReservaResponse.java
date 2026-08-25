package com.ups.reservacanchas.reservas.dto;

import com.ups.reservacanchas.reservas.domain.BookingStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lo que ve el cliente HTTP.
 *
 * `canchaNombre` y `deporte` vienen desnormalizados desde ms-canchas para que
 * la pantalla no tenga que encadenar una llamada por reserva solo para poner un
 * título en una tarjeta.
 *
 * `usuarioNombre` queda null fuera del listado global del administrador, que
 * llega con US2.
 */
public record ReservaResponse(
        Long id,
        Long canchaId,
        String canchaNombre,
        String deporte,
        Long usuarioId,
        String usuarioNombre,
        LocalDate fecha,
        String horaInicio,
        String horaFin,
        BookingStatus estado,
        LocalDateTime creadaEn,
        LocalDateTime canceladaEn) {}
