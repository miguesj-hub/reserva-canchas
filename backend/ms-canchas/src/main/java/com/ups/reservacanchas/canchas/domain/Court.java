package com.ups.reservacanchas.canchas.domain;

/**
 * Modelo de dominio de una cancha. Sin anotaciones de framework: el mapeo a la
 * tabla vive en adapter.out.persistence.CourtEntity.
 */
public class Court {

    private final Long id;
    private String nombre;
    private Sport deporte;
    private OpeningHours horario;
    private boolean activa;

    public Court(String nombre, Sport deporte, OpeningHours horario, boolean activa) {
        this(null, nombre, deporte, horario, activa);
    }

    public Court(Long id, String nombre, Sport deporte, OpeningHours horario, boolean activa) {
        this.id = id;
        this.nombre = nombre;
        this.deporte = deporte;
        this.horario = horario;
        this.activa = activa;
    }

    /** FR-030. Cambiar el horario cambia los bloques que la disponibilidad ofrece. */
    public void actualizar(String nombre, Sport deporte, OpeningHours horario, boolean activa) {
        this.nombre = nombre;
        this.deporte = deporte;
        this.horario = horario;
        this.activa = activa;
    }

    /** FR-031. Inactivar no borra ni cancela nada (FR-032). */
    public void cambiarEstado(boolean activa) {
        this.activa = activa;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public Sport getDeporte() { return deporte; }
    public OpeningHours getHorario() { return horario; }
    public boolean isActiva() { return activa; }
}
