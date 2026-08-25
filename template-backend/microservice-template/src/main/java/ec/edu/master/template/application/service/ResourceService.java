package ec.edu.master.template.application.service;

import ec.edu.master.template.application.port.in.ResourceUseCase;
import ec.edu.master.template.application.port.out.ResourceRepositoryPort;
import ec.edu.master.template.domain.Resource;
import ec.edu.master.template.domain.exception.BusinessRuleException;
import ec.edu.master.template.domain.exception.NotFoundException;
import ec.edu.master.template.dto.CreateResourceRequest;
import ec.edu.master.template.dto.ResourceResponse;
import ec.edu.master.template.dto.UpdateResourceRequest;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Implements the use case. Depends only on the output port (interface),
 * never on Spring Data or JPA directly — whoever wires the implementation
 * (ResourceRepositoryAdapter) resolves that.
 */
@Service
public class ResourceService implements ResourceUseCase {

    private final ResourceRepositoryPort repository;

    public ResourceService(ResourceRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public ResourceResponse create(CreateResourceRequest request) {
        if (repository.existsByNameIgnoreCase(request.name())) {
            throw new BusinessRuleException(
                    "DUPLICATE_NAME", "A resource with that name already exists.");
        }
        Resource resource = new Resource(request.name(), request.description());
        return toResponse(repository.save(resource));
    }

    @Override
    public ResourceResponse get(Long id) {
        return toResponse(findOrFail(id));
    }

    @Override
    public List<ResourceResponse> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public ResourceResponse update(Long id, UpdateResourceRequest request) {
        Resource resource = findOrFail(id);
        resource.update(request.name(), request.description(), request.active());
        return toResponse(repository.save(resource));
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Resource " + id + " does not exist");
        }
        repository.deleteById(id);
    }

    private Resource findOrFail(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource " + id + " does not exist"));
    }

    private ResourceResponse toResponse(Resource r) {
        return new ResourceResponse(
                r.getId(), r.getName(), r.getDescription(), r.isActive(), r.getCreatedAt());
    }
}
