package com.ups.reservacanchas.usuarios.domain;

import java.time.LocalDateTime;

/**
 * Modelo de dominio. Sin ninguna anotación de framework: el núcleo de negocio
 * no sabe que existe una base relacional. El mapeo a la tabla vive en
 * adapter.out.persistence.UserEntity.
 *
 * Guarda el hash de la contraseña, nunca la contraseña en claro, y no sabe con
 * qué algoritmo se calculó: comparar un hash con una contraseña es trabajo de
 * quien tiene el algoritmo, no del modelo.
 */
public class User {

    private final Long id;
    private final String username;
    private final String nombre;
    private final String passwordHash;
    private final Role rol;
    private boolean activo;
    private final LocalDateTime creadoEn;

    /** Alta pública: siempre USUARIO_FINAL y activo (FR-001). */
    public User(String username, String nombre, String passwordHash) {
        this(null, username, nombre, passwordHash, Role.USUARIO_FINAL, true, null);
    }

    public User(
            Long id,
            String username,
            String nombre,
            String passwordHash,
            Role rol,
            boolean activo,
            LocalDateTime creadoEn) {
        this.id = id;
        this.username = username;
        this.nombre = nombre;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.activo = activo;
        this.creadoEn = creadoEn;
    }

    /** FR-046. Inactivar no toca las reservas: son de otro dominio (FR-047). */
    public void cambiarEstado(boolean activo) {
        this.activo = activo;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getNombre() { return nombre; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRol() { return rol; }
    public boolean isActivo() { return activo; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
