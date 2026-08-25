package com.ups.reservacanchas.usuarios.application.port.out;

import com.ups.reservacanchas.usuarios.domain.User;
import java.util.Optional;

/**
 * Puerto de salida: lo que el dominio necesita de la persistencia, expresado
 * en términos de dominio (User), no de JPA. Lo implementa
 * UserRepositoryAdapter (adapter.out.persistence) contra la base.
 */
public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
