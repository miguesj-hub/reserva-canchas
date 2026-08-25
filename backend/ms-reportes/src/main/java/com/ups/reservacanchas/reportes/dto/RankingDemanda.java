package com.ups.reservacanchas.reportes.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Indicador 4 (FR-041). Los dos extremos vienen señalados aparte para que la
 * pantalla no tenga que deducirlos del array, que es donde se cuelan los fallos
 * de "primero" y "último" cuando la lista está vacía.
 */
public record RankingDemanda(
        LocalDate desde,
        LocalDate hasta,
        List<FilaRanking> ranking,
        FilaRanking mayorDemanda,
        FilaRanking menorDemanda) {}
