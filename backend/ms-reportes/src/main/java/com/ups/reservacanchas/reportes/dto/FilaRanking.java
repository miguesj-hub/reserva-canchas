package com.ups.reservacanchas.reportes.dto;

/** Una posición del ranking. La 1 es la de mayor demanda. */
public record FilaRanking(
        int posicion, Long canchaId, String canchaNombre, String deporte, int reservas) {}
