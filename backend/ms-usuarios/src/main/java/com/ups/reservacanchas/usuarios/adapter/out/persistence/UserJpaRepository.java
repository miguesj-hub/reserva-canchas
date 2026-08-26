package com.ups.reservacanchas.usuarios.adapter.out.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Detalle de Spring Data, usado solo por UserRepositoryAdapter. */
interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    boolean existsByUsername(String username);
}
