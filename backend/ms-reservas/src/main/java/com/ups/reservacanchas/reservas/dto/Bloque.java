package com.ups.reservacanchas.reservas.dto;

/**
 * Un bloque en la respuesta de disponibilidad. Solo LIBRE es reservable.
 *
 * MANTENIMIENTO existe en el contrato desde ya, pero nada lo produce todavía:
 * los bloqueos de mantenimiento (FR-010) se administran en US2. Declararlo
 * ahora evita que la pantalla tenga que cambiar de tipo más adelante.
 */
public record Bloque(String horaInicio, String horaFin, Estado estado) {

    public enum Estado {
        LIBRE,
        OCUPADO,
        MANTENIMIENTO
    }
}
