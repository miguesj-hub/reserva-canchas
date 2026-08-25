package ec.edu.master.template.adapter.out.persistence;

import ec.edu.master.template.application.port.out.ResourceRepositoryPort;
import ec.edu.master.template.domain.Resource;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Output adapter (persistence): implements the port against Spring Data JPA,
 * translating between the domain.Resource the application knows and the
 * ResourceJpaEntity the database knows.
 */
@Repository
public class ResourceRepositoryAdapter implements ResourceRepositoryPort {

    private final ResourceJpaRepository jpaRepository;

    public ResourceRepositoryAdapter(ResourceJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Resource save(Resource resource) {
        ResourceJpaEntity entity = new ResourceJpaEntity(
                resource.getId(), resource.getName(), resource.getDescription(), resource.isActive());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<Resource> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Resource> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsByNameIgnoreCase(String name) {
        return jpaRepository.existsByNameIgnoreCase(name);
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private Resource toDomain(ResourceJpaEntity e) {
        return new Resource(e.getId(), e.getName(), e.getDescription(), e.isActive(), e.getCreatedAt());
    }
}
