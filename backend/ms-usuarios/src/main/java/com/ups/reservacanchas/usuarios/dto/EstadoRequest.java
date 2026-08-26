package com.ups.reservacanchas.usuarios.dto;

import jakarta.validation.constraints.NotNull;

/** Cuerpo de PATCH /api/usuarios/{id}/estado (FR-046). */
public record EstadoRequest(@NotNull Boolean activo) {}
