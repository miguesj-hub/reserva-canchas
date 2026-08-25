package com.ups.reservacanchas.reservas.domain;

/**
 * Los tres estados de RN-08 (R-007).
 *
 * CANCELADA y FINALIZADA son terminales: de CANCELADA no se vuelve (FR-023) y
 * FINALIZADA no se puede cancelar (FR-028).
 *
 * FINALIZADA no se persiste nunca: se deriva al leer, comparando la hora de fin
 * con el instante actual (ver Booking#estadoVigente). Así el estado no puede
 * quedar desactualizado por un proceso que no corrió.
 */
public enum BookingStatus {
    CONFIRMADA,
    CANCELADA,
    FINALIZADA
}
