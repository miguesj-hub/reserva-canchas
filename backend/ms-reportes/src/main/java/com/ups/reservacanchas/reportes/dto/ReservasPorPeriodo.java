package com.ups.reservacanchas.reportes.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Indicador 1 (FR-038): reservas por cancha y por deporte.
 *
 * Cuenta las CONFIRMADAS y FINALIZADAS cuyo bloque cae en el rango. Las
 * canceladas tienen su propio indicador y no se suman aquí: mezclar lo que
 * ocurrió con lo que se deshizo daría un número que no significa nada.
 */
public record ReservasPorPeriodo(
        LocalDate desde,
        LocalDate hasta,
        int total,
        List<ConteoCancha> porCancha,
        List<ConteoDeporte> porDeporte) {}
