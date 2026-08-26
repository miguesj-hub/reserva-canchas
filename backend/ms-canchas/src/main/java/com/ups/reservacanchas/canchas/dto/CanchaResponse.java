package com.ups.reservacanchas.canchas.dto;

import com.ups.reservacanchas.canchas.domain.Sport;

/**
 * Lo que ve el cliente HTTP (contracts/canchas.yaml). Las horas viajan como
 * "HH:mm" y no como un instante: un horario de atención es una hora del reloj
 * de la instalación, no un punto en el tiempo.
 */
public record CanchaResponse(
        Long id,
        String nombre,
        Sport deporte,
        String horaApertura,
        String horaCierre,
        boolean activa) {}
