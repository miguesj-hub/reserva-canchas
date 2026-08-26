package com.ups.reservacanchas.canchas.adapter.out.persistence;

import com.ups.reservacanchas.canchas.domain.Sport;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;

/**
 * Mapeo JPA. Detalle interno del adaptador: package-private, solo
 * CourtRepositoryAdapter lo usa y lo traduce a/desde domain.Court.
 *
 * El DDL lo versiona Flyway (V1__canchas.sql); `ddl-auto: validate` solo
 * compara este mapeo contra el esquema real.
 */
@Entity
@Table(name = "cancha")
class CourtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Sport deporte;

    @Column(name = "hora_apertura", nullable = false)
    private LocalTime horaApertura;

    @Column(name = "hora_cierre", nullable = false)
    private LocalTime horaCierre;

    @Column(nullable = false)
    private boolean activa;

    protected CourtEntity() {}

    CourtEntity(Long id, String nombre, Sport deporte, LocalTime horaApertura, LocalTime horaCierre, boolean activa) {
        this.id = id;
        this.nombre = nombre;
        this.deporte = deporte;
        this.horaApertura = horaApertura;
        this.horaCierre = horaCierre;
        this.activa = activa;
    }

    Long getId() { return id; }
    String getNombre() { return nombre; }
    Sport getDeporte() { return deporte; }
    LocalTime getHoraApertura() { return horaApertura; }
    LocalTime getHoraCierre() { return horaCierre; }
    boolean isActiva() { return activa; }
}
