package com.ups.reservacanchas.usuarios.adapter.out.persistence;

import com.ups.reservacanchas.usuarios.domain.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Mapeo JPA. Detalle interno del adaptador de persistencia: package-private,
 * porque nada fuera de este paquete debe usarlo — solo UserRepositoryAdapter,
 * que lo traduce a/desde el domain.User que conoce el resto de la aplicación.
 *
 * El DDL NO vive aquí: lo versiona Flyway en db/migration/V1__usuarios.sql.
 * Con `ddl-auto: validate`, este mapeo solo se compara contra el esquema real;
 * si no coinciden, el servicio no arranca en lugar de fallar más tarde con una
 * columna inesperada.
 */
@Entity
@Table(name = "usuario")
class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60, unique = true)
    private String username;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "password_hash", nullable = false, length = 72)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role rol;

    @Column(nullable = false)
    private boolean activo;

    // Lo pone el DEFAULT now() de la tabla: se lee, nunca se escribe.
    @Column(name = "creado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    protected UserEntity() {}

    UserEntity(Long id, String username, String nombre, String passwordHash, Role rol, boolean activo) {
        this.id = id;
        this.username = username;
        this.nombre = nombre;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.activo = activo;
    }

    Long getId() { return id; }
    String getUsername() { return username; }
    String getNombre() { return nombre; }
    String getPasswordHash() { return passwordHash; }
    Role getRol() { return rol; }
    boolean isActivo() { return activo; }
    LocalDateTime getCreadoEn() { return creadoEn; }
}
