package com.ups.reservacanchas.reservas.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Todos los bloques del horario de atención de una cancha en una fecha, en
 * orden (FR-008): también los ocupados. La pantalla necesita verlos para
 * mostrar la rejilla completa, no solo los huecos.
 */
public record DisponibilidadResponse(Long canchaId, LocalDate fecha, List<Bloque> bloques) {}
