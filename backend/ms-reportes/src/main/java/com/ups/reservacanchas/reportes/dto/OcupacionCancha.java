package com.ups.reservacanchas.reportes.dto;

/**
 * Indicador 2 (FR-039). Se devuelven las tres magnitudes y no solo el
 * porcentaje: sin el numerador y el denominador, un 50 % sobre dos horas y otro
 * sobre doscientas se leen igual, y el administrador no puede juzgar cuál
 * importa.
 */
public record OcupacionCancha(
        Long canchaId,
        String canchaNombre,
        String deporte,
        double horasReservadas,
        double horasDisponibles,
        double porcentaje) {}
