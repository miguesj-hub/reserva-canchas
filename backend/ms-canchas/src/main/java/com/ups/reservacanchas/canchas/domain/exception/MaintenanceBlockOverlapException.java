package com.ups.reservacanchas.canchas.domain.exception;

/**
 * Ya existe un bloqueo que se solapa con el que se intenta registrar. El
 * adaptador web la traduce a 409.
 *
 * Dos bloqueos solapados sobre la misma cancha no aportan nada —el rango
 * bloqueado es el mismo— y complican leer el calendario de mantenimiento.
 */
public class MaintenanceBlockOverlapException extends RuntimeException {

    public MaintenanceBlockOverlapException(String message) {
        super(message);
    }
}
