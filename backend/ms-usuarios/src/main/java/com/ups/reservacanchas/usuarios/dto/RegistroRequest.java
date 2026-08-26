package com.ups.reservacanchas.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Alta pública de una cuenta (contracts/auth-usuarios.yaml, POST /auth/registro).
 *
 * No lleva `rol`: el registro crea siempre un USUARIO_FINAL y los
 * administradores se aprovisionan con el seed. Aceptar el rol como entrada
 * dejaría que cualquiera se registrase como administrador.
 */
public record RegistroRequest(
        @NotBlank @Size(min = 3, max = 60) String username,
        @NotBlank @Size(min = 1, max = 120) String nombre,
        @NotBlank @Size(min = 6, max = 72) String password) {}
