package com.ups.reservacanchas.reportes.dto;

/** Conteo de reservas de una cancha. Lleva el nombre para que la pantalla no encadene llamadas. */
public record ConteoCancha(Long canchaId, String canchaNombre, String deporte, int reservas) {}
