package com.ups.reservacanchas.reservas.application.port.in;

import com.ups.reservacanchas.reservas.dto.ConfiguracionResponse;

/**
 * Puerto de entrada de la configuración de la política de reservas
 * (feature 002, US2).
 *
 * El `rol` es un parámetro explícito, igual que en BookingUseCase: llega en
 * X-User-Role, escrita por el gateway, y este servicio no autentica. Pasarlo
 * por la firma es lo que permite probar FR-056 sin levantar Spring ni fabricar
 * cabeceras HTTP.
 */
public interface ConfigurationUseCase {

    /** FR-052. Solo ADMINISTRADOR (FR-056). */
    ConfiguracionResponse consultar(String rol);

    /** FR-053 y FR-054. Solo ADMINISTRADOR (FR-056). */
    ConfiguracionResponse cambiarTope(int maxReservasActivas, String rol);
}
