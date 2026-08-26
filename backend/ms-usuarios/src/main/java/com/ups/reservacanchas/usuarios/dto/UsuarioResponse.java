package com.ups.reservacanchas.usuarios.dto;

import com.ups.reservacanchas.usuarios.domain.Role;

/**
 * Lo que ve el cliente HTTP. **Nunca incluye el hash de la contraseña**: es la
 * razón por la que existe este record y no se serializa el dominio.
 */
public record UsuarioResponse(
        Long id,
        String username,
        String nombre,
        Role rol,
        boolean activo) {}
