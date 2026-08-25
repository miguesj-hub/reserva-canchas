package com.ups.reservacanchas.canchas.domain;

import java.time.LocalDateTime;

/**
 * Bloqueo de mantenimiento de una cancha (FR-034).
 *
 * Impide reservas nuevas en su rango, pero **no cancela las existentes**: §3.3.3
 * describe que sea el administrador quien las cancele desde el listado global.
 * Cancelarlas automáticamente decidiría por él sobre reservas ya confirmadas.
 */
public class MaintenanceBlock {

    private final Long id;
    private final Long canchaId;
    private final LocalDateTime desde;
    private final LocalDateTime hasta;
    private final String motivo;

    public MaintenanceBlock(Long canchaId, LocalDateTime desde, LocalDateTime hasta, String motivo) {
        this(null, canchaId, desde, hasta, motivo);
    }

    public MaintenanceBlock(Long id, Long canchaId, LocalDateTime desde, LocalDateTime hasta, String motivo) {
        if (desde == null || hasta == null) {
            throw new IllegalArgumentException("Un bloqueo necesita inicio y fin.");
        }
        if (!hasta.isAfter(desde)) {
            throw new IllegalArgumentException(
                    "El fin del bloqueo (" + hasta + ") debe ser posterior a su inicio (" + desde + ").");
        }
        this.id = id;
        this.canchaId = canchaId;
        this.desde = desde;
        this.hasta = hasta;
        this.motivo = motivo;
    }

    /**
     * ¿Cae este bloque horario dentro del bloqueo? Fin exclusivo en ambos lados,
     * igual que TimeSlot en ms-reservas: un bloqueo que termina a las 10:00 no
     * inutiliza el bloque de 10:00 a 11:00.
     */
    public boolean cubre(LocalDateTime inicioBloque, LocalDateTime finBloque) {
        return inicioBloque.isBefore(hasta) && desde.isBefore(finBloque);
    }

    public Long getId() { return id; }
    public Long getCanchaId() { return canchaId; }
    public LocalDateTime getDesde() { return desde; }
    public LocalDateTime getHasta() { return hasta; }
    public String getMotivo() { return motivo; }
}
