package ec.edu.master.template.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data detail, used only by ResourceRepositoryAdapter. */
interface ResourceJpaRepository extends JpaRepository<ResourceJpaEntity, Long> {

    boolean existsByNameIgnoreCase(String name);
}
