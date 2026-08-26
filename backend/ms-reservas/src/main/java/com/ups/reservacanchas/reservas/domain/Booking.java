package com.ups.reservacanchas.reservas.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Modelo de dominio de una reserva. Sin anotaciones: el mapeo vive en
 * adapter.out.persistence.BookingEntity.
 *
 * Guarda `canchaId` y `usuarioId` como números sueltos y no como referencias:
 * la cancha y el usuario viven en otras bases, a las que esta conexión no llega
 * (Principio IV). Que la cancha exista y admita el bloque lo comprueba
 * BookingService llamando a ms-canchas antes de persistir.
 */
public class Booking {

    private final Long id;
    private final Long canchaId;
    private final Long usuarioId;
    private final LocalDate fecha;
    private final TimeSlot bloque;
    private BookingStatus estado;
    private final LocalDateTime creadaEn;
    private LocalDateTime canceladaEn;

    /** RN-08: toda reserva nace CONFIRMADA. No hay forma de crearla en otro estado. */
    public Booking(Long canchaId, Long usuarioId, LocalDate fecha, TimeSlot bloque) {
        this(null, canchaId, usuarioId, fecha, bloque, BookingStatus.CONFIRMADA, null, null);
    }

    public Booking(
            Long id,
            Long canchaId,
            Long usuarioId,
            LocalDate fecha,
            TimeSlot bloque,
            BookingStatus estado,
            LocalDateTime creadaEn,
            LocalDateTime canceladaEn) {
        this.id = id;
        this.canchaId = canchaId;
        this.usuarioId = usuarioId;
        this.fecha = fecha;
        this.bloque = bloque;
        this.estado = estado;
        this.creadaEn = creadaEn;
        this.canceladaEn = canceladaEn;
    }

    /**
     * El estado tal como debe verse ahora (FR-027).
     *
     * Una reserva confirmada cuyo bloque ya terminó es FINALIZADA, aunque en la
     * base siga escrito CONFIRMADA. Derivarlo al leer, en vez de tener un
     * proceso que recorra la tabla marcando filas, es lo que garantiza que
     * nunca esté desactualizado.
     */
    public BookingStatus estadoVigente(LocalDateTime ahora) {
        if (estado == BookingStatus.CONFIRMADA && !bloque.finEn(fecha).isAfter(ahora)) {
            return BookingStatus.FINALIZADA;
        }
        return estado;
    }

    /** RN-06: solo cuentan las confirmadas que todavía no han terminado. */
    public boolean cuentaComoActiva(LocalDateTime ahora) {
        return estadoVigente(ahora) == BookingStatus.CONFIRMADA;
    }

    /** RN-04: solo se cancela antes de que el bloque empiece. */
    public boolean sePuedeCancelarEn(LocalDateTime ahora) {
        return estadoVigente(ahora) == BookingStatus.CONFIRMADA
                && bloque.inicioEn(fecha).isAfter(ahora);
    }

    public boolean perteneceA(Long otroUsuarioId) {
        return usuarioId.equals(otroUsuarioId);
    }

    /**
     * RN-05: pasa a CANCELADA y su bloque queda libre. La fila no se borra —la
     * restricción EXCLUDE solo alcanza a las confirmadas, así que dejar de
     * serlo es lo que libera el horario, y conservarla mantiene la traza que
     * pide RN-08 y el dato que necesita el reporte de cancelaciones.
     */
    public void cancelar(LocalDateTime ahora) {
        this.estado = BookingStatus.CANCELADA;
        this.canceladaEn = ahora;
    }

    public Long getId() { return id; }
    public Long getCanchaId() { return canchaId; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDate getFecha() { return fecha; }
    public TimeSlot getBloque() { return bloque; }
    public BookingStatus getEstado() { return estado; }
    public LocalDateTime getCreadaEn() { return creadaEn; }
    public LocalDateTime getCanceladaEn() { return canceladaEn; }
}
