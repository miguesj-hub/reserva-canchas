package com.ups.reservacanchas.reportes.domain;

import java.util.List;

/**
 * Cancelaciones de un período (FR-040).
 *
 * Se cuentan por **fecha de cancelación**, no por la del bloque reservado: la
 * pregunta que responde el indicador es "cuánto se canceló este mes", y una
 * reserva de diciembre cancelada en octubre es una cancelación de octubre.
 */
public record CancellationReport(int total, List<ConteoPorCancha> porCancha) {

    public record ConteoPorCancha(Long canchaId, String canchaNombre, String deporte, int reservas) {}
}
