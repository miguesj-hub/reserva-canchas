package com.ups.reservacanchas.usuarios.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Verificación de credenciales (POST /auth/login). No emite ningún token
 * (R-003): la autenticación posterior es HTTP Basic contra el gateway. Sirve
 * para que el shell sepa si la credencial vale y a quién pertenece.
 */
public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password) {}
