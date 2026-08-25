package com.ups.reservacanchas.reservas.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

/** Detalle de Spring Data, usado solo por ConfigurationRepositoryAdapter. */
interface ConfigurationJpaRepository extends JpaRepository<ConfigurationEntity, String> {}
