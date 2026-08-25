package com.ups.reservacanchas.reportes.dto;

import java.util.List;

/**
 * Los cuatro indicadores en una respuesta. Conveniencia para el panel del
 * administrador (R-005), que los muestra acotados al día en curso y si no
 * encadenaría cuatro llamadas.
 *
 * No es un quinto indicador: no añade ningún dato que los otros cuatro no den.
 */
public record Resumen(
        ReservasPorPeriodo reservas,
        List<OcupacionCancha> ocupacion,
        Cancelaciones cancelaciones,
        RankingDemanda demanda) {}
