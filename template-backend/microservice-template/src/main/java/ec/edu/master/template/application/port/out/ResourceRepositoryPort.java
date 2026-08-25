package ec.edu.master.template.application.port.out;

import ec.edu.master.template.domain.Resource;
import java.util.List;
import java.util.Optional;

/**
 * Output port: what the domain needs from persistence, expressed in domain
 * terms (Resource), not JPA. ResourceRepositoryAdapter
 * (adapter.out.persistence) implements it against the database.
 */
public interface ResourceRepositoryPort {

    Resource save(Resource resource);

    Optional<Resource> findById(Long id);

    List<Resource> findAll();

    boolean existsByNameIgnoreCase(String name);

    boolean existsById(Long id);

    void deleteById(Long id);
}
