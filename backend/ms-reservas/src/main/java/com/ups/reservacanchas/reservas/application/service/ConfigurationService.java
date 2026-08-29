package com.ups.reservacanchas.reservas.application.service;

import com.ups.reservacanchas.reservas.application.port.in.ConfigurationUseCase;
import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.dto.ConfiguracionResponse;
import org.springframework.stereotype.Service;

/**
 * Lectura y cambio del tope de reservas activas de RN-06 (FR-052 a FR-056).
 *
 * Va aparte de BookingService a propósito: ese ya concentra RN-01 a RN-06 y
 * RN-08, y esto es una responsabilidad de administración, no de reserva. La
 * decisión está en R-010 de la feature 002.
 *
 * Quien APLICA RN-06 sigue siendo BookingService.verificarTope; este servicio
 * solo gobierna el parámetro que aquel lee. Por eso la prueba de que bajar el
 * tope no toca las reservas ya confirmadas (FR-055) vive en
 * BookingServiceCreacionTest y no aquí: la regla no se movió de sitio.
 */
@Service
public class ConfigurationService implements ConfigurationUseCase {

    /** La misma clave que lee BookingService. Si cambia, cambia en los dos. */
    static final String CLAVE_TOPE = "max_reservas_activas";

    /** El mismo valor por defecto que BookingService, para no divergir. */
    static final int TOPE_POR_DEFECTO = 3;

    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private final ConfigurationRepositoryPort configuracion;

    public ConfigurationService(ConfigurationRepositoryPort configuracion) {
        this.configuracion = configuracion;
    }

    @Override
    public ConfiguracionResponse consultar(String rol) {
        exigirAdministrador(rol);
        return new ConfiguracionResponse(topeVigente());
    }

    @Override
    public ConfiguracionResponse cambiarTope(int maxReservasActivas, String rol) {
        exigirAdministrador(rol);

        // Segunda línea de defensa. La primera es @Min(1) sobre el cuerpo, que
        // devuelve 400; esta cubre cualquier otra vía de entrada al caso de uso
        // y hace que la regla viva en la aplicación y no solo en el adaptador
        // (Principio II).
        if (maxReservasActivas < 1) {
            throw new IllegalArgumentException(
                    "El tope debe ser un entero mayor o igual a 1; llegó " + maxReservasActivas + ".");
        }

        configuracion.guardar(CLAVE_TOPE, String.valueOf(maxReservasActivas));
        return new ConfiguracionResponse(maxReservasActivas);
    }

    /**
     * FR-056. Mismo criterio que el resto del servicio: el rol llega del
     * gateway y aquí solo se comprueba.
     */
    private void exigirAdministrador(String rol) {
        if (!ROL_ADMINISTRADOR.equals(rol)) {
            throw new ForbiddenOperationException(
                    "Solo un administrador puede consultar o cambiar el tope de reservas activas.");
        }
    }

    /**
     * Si la clave no está o trae basura, se responde el valor por defecto en
     * lugar de fallar: es exactamente lo que hace BookingService al aplicar la
     * regla, y responder otra cosa aquí mostraría en pantalla un tope distinto
     * del que el sistema aplica de verdad.
     */
    private int topeVigente() {
        return configuracion.valorDe(CLAVE_TOPE)
                .map(valor -> {
                    try {
                        return Integer.parseInt(valor.trim());
                    } catch (NumberFormatException e) {
                        return TOPE_POR_DEFECTO;
                    }
                })
                .orElse(TOPE_POR_DEFECTO);
    }
}
