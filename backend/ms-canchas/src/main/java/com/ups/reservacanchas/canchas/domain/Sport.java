package com.ups.reservacanchas.canchas.domain;

/**
 * Los tres deportes del club (R-008). Enumeración cerrada: un valor fuera de
 * esta lista se rechaza con 400, no se acepta como texto libre. "Fútbol" no
 * está en el alcance.
 */
public enum Sport {
    PADEL,
    TENIS,
    BASQUET
}
