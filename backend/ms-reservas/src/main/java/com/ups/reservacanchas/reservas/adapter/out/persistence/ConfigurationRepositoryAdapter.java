package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adaptador de salida hacia la tabla `configuracion`.
 *
 * Se lee en cada creación de reserva y no se cachea: cambiar el tope de RN-06
 * surte efecto en la siguiente petición, sin reiniciar el servicio, que es lo
 * que hace que "configurable" signifique algo (FR-053).
 *
 * Si algún día se añade caché a `valorDe`, FR-053 pasa a exigir que `guardar`
 * la invalide. Está anotado también en R-010 de la feature 002.
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

    @Override
    @Transactional
    public void guardar(String clave, String valor) {
        ConfigurationEntity fila = jpaRepository.findById(clave)
                .orElseGet(() -> new ConfigurationEntity(clave, valor));
        fila.setValor(valor);
        jpaRepository.save(fila);
    }
}
