package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de salida hacia la tabla `configuracion`.
 *
 * Se lee en cada creación de reserva y no se cachea: cambiar el tope de RN-06
 * con un UPDATE surte efecto sin reiniciar el servicio, que es lo que hace que
 * "configurable" signifique algo.
 */
@Repository
public class ConfigurationRepositoryAdapter implements ConfigurationRepositoryPort {

    private final ConfigurationJpaRepository jpaRepository;

    public ConfigurationRepositoryAdapter(ConfigurationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<String> valorDe(String clave) {
        return jpaRepository.findById(clave).map(ConfigurationEntity::getValor);
    }
}
