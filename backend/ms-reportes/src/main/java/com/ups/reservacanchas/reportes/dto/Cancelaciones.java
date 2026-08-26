package com.ups.reservacanchas.reportes.dto;

import java.time.LocalDate;
import java.util.List;

/** Indicador 3 (FR-040): cancelaciones del período, por fecha de cancelación. */
public record Cancelaciones(
        LocalDate desde,
        LocalDate hasta,
        int total,
        List<ConteoCancha> porCancha) {}
