package com.ups.reservacanchas.reservas.application.port.out;

import java.util.Optional;

/**
 * Puerto hacia la tabla `configuracion`. Hoy tiene una sola clave,
 * `max_reservas_activas` (RN-06).
 *
 * Se lee en cada creación de reserva y se escribe desde la pantalla de
 * administración: la enmienda 1.3.0 de la constitución declaró en alcance la
 * configuración del tope, por traza a la regla y no a una fila de §3.1.
 */
public interface ConfigurationRepositoryPort {

    Optional<String> valorDe(String clave);

    /** Crea la clave si no existe y la sobrescribe si existe (FR-053). */
    void guardar(String clave, String valor);
}
