package com.ups.reservacanchas.canchas.dto;

import java.time.LocalDateTime;

/** Lo que ve el cliente HTTP. Lo consume también ms-reservas para FR-010. */
public record BloqueoResponse(
        Long id,
        Long canchaId,
        LocalDateTime desde,
        LocalDateTime hasta,
        String motivo) {}
