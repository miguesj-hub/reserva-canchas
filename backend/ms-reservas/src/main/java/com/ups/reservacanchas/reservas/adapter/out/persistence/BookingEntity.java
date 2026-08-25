package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.domain.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Mapeo JPA. Package-private: solo BookingRepositoryAdapter lo usa.
 *
 * `cancha_id` y `usuario_id` son bigint sin relación JPA, porque no hay nada a
 * lo que relacionarlos en esta base (Principio IV).
 */
@Entity
@Table(name = "reserva")
class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cancha_id", nullable = false)
    private Long canchaId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    /**
     * Solo se persisten CONFIRMADA y CANCELADA. FINALIZADA se deriva al leer
     * (Booking#estadoVigente) y nunca llega hasta aquí.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus estado;

    // Lo pone el DEFAULT now() de la tabla. @Generated hace que Hibernate lo
    // relea justo después del INSERT: sin eso, la respuesta del POST llevaría
    // creadaEn nulo y la del GET siguiente sí traería el valor.
    @Generated(event = EventType.INSERT)
    @Column(name = "creada_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime creadaEn;

    @Column(name = "cancelada_en")
    private LocalDateTime canceladaEn;

    protected BookingEntity() {}

    BookingEntity(
            Long id,
            Long canchaId,
            Long usuarioId,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin,
            BookingStatus estado,
            LocalDateTime canceladaEn) {
        this.id = id;
        this.canchaId = canchaId;
        this.usuarioId = usuarioId;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.estado = estado;
        this.canceladaEn = canceladaEn;
    }

    Long getId() { return id; }
    Long getCanchaId() { return canchaId; }
    Long getUsuarioId() { return usuarioId; }
    LocalDate getFecha() { return fecha; }
    LocalTime getHoraInicio() { return horaInicio; }
    LocalTime getHoraFin() { return horaFin; }
    BookingStatus getEstado() { return estado; }
    LocalDateTime getCreadaEn() { return creadaEn; }
    LocalDateTime getCanceladaEn() { return canceladaEn; }
}
