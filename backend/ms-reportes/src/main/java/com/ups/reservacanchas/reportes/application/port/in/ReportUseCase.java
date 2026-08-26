package com.ups.reservacanchas.reportes.application.port.in;

import com.ups.reservacanchas.reportes.dto.Cancelaciones;
import com.ups.reservacanchas.reportes.dto.OcupacionCancha;
import com.ups.reservacanchas.reportes.dto.RankingDemanda;
import com.ups.reservacanchas.reportes.dto.ReservasPorPeriodo;
import com.ups.reservacanchas.reportes.dto.Resumen;
import java.time.LocalDate;
import java.util.List;

/**
 * Puerto de entrada de los cuatro indicadores de §3.3.5.
 *
 * Todas reciben el `rol` explícitamente: llega en X-User-Role, escrita por el
 * gateway. FR-043 lo aplica ReportService, no el controlador, para poder
 * probarlo sin levantar Spring.
 */
public interface ReportUseCase {

    /** Indicador 1 — reservas por cancha y por deporte (FR-038). */
    ReservasPorPeriodo reservas(LocalDate desde, LocalDate hasta, String rol);

    /** Indicador 2 — porcentaje de ocupación por cancha (FR-039). */
    List<OcupacionCancha> ocupacion(LocalDate desde, LocalDate hasta, String rol);

    /** Indicador 3 — cancelaciones del período (FR-040). */
    Cancelaciones cancelaciones(LocalDate desde, LocalDate hasta, String rol);

    /** Indicador 4 — ranking de canchas por demanda (FR-041). */
    RankingDemanda demanda(LocalDate desde, LocalDate hasta, String rol);

    /** Los cuatro juntos, para el panel del administrador (R-005). */
    Resumen resumen(LocalDate desde, LocalDate hasta, String rol);
}
