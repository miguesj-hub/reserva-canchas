package com.ups.reservacanchas.canchas.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Mapeo JPA del bloqueo. Package-private, como el resto del adaptador.
 *
 * `cancha_id` es un bigint y no una relación @ManyToOne: la clave foránea existe
 * en la base (ambas tablas viven en canchas_db), pero mapearla como relación
 * obligaría a cargar la cancha entera para guardar un bloqueo, sin que nada lo
 * necesite.
 */
@Entity
@Table(name = "bloqueo_mantenimiento")
class MaintenanceBlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cancha_id", nullable = false)
    private Long canchaId;

    @Column(nullable = false)
    private LocalDateTime desde;

    @Column(nullable = false)
    private LocalDateTime hasta;

    @Column(length = 200)
    private String motivo;

    protected MaintenanceBlockEntity() {}

    MaintenanceBlockEntity(Long id, Long canchaId, LocalDateTime desde, LocalDateTime hasta, String motivo) {
        this.id = id;
        this.canchaId = canchaId;
        this.desde = desde;
        this.hasta = hasta;
        this.motivo = motivo;
    }

    Long getId() { return id; }
    Long getCanchaId() { return canchaId; }
    LocalDateTime getDesde() { return desde; }
    LocalDateTime getHasta() { return hasta; }
    String getMotivo() { return motivo; }
}
