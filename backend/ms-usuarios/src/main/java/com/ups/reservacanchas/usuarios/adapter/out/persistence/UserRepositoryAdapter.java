package com.ups.reservacanchas.usuarios.adapter.out.persistence;

import com.ups.reservacanchas.usuarios.application.port.out.UserRepositoryPort;
import com.ups.reservacanchas.usuarios.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de salida (persistencia): implementa el puerto contra Spring Data
 * JPA, traduciendo entre el domain.User que conoce la aplicación y la
 * UserEntity que conoce la base.
 */
@Repository
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserJpaRepository jpaRepository;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public User save(User user) {
        UserEntity entity = new UserEntity(
                user.getId(),
                user.getUsername(),
                user.getNombre(),
                user.getPasswordHash(),
                user.getRol(),
                user.isActivo());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return jpaRepository.findByUsername(username).map(this::toDomain);
    }

    @Override
    public boolean existsByUsername(String username) {
        return jpaRepository.existsByUsername(username);
    }

    @Override
    public List<User> findAll() {
        return jpaRepository.findAll(org.springframework.data.domain.Sort.by("id")).stream()
                .map(this::toDomain)
                .toList();
    }

    private User toDomain(UserEntity e) {
        return new User(
                e.getId(),
                e.getUsername(),
                e.getNombre(),
                e.getPasswordHash(),
                e.getRol(),
                e.isActivo(),
                e.getCreadoEn());
    }
}
