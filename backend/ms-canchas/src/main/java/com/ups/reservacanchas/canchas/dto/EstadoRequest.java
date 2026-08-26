package com.ups.reservacanchas.canchas.dto;

import jakarta.validation.constraints.NotNull;

/** Cuerpo de PATCH /api/canchas/{id}/estado (FR-031). */
public record EstadoRequest(@NotNull Boolean activa) {}
