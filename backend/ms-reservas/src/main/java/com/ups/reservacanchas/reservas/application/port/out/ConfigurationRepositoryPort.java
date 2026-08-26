package com.ups.reservacanchas.reservas.application.port.out;

import java.util.Optional;

/**
 * Puerto hacia la tabla `configuracion`. Hoy tiene una sola clave,
 * `max_reservas_activas` (RN-06).
 *
 * Es un parámetro, no una pantalla: §3.2 no lista ninguna de configuración y
 * añadirla sería alcance nuevo.
 */
public interface ConfigurationRepositoryPort {

    Optional<String> valorDe(String clave);
}
