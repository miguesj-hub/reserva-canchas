package ec.edu.master.template.application.port.in;

import ec.edu.master.template.dto.CreateResourceRequest;
import ec.edu.master.template.dto.ResourceResponse;
import ec.edu.master.template.dto.UpdateResourceRequest;
import java.util.List;

/**
 * Input port: the operations the outside world can ask of the domain.
 * ResourceController (adapter.in.web) only knows this interface, never the
 * implementation (ResourceService).
 */
public interface ResourceUseCase {

    ResourceResponse create(CreateResourceRequest request);

    ResourceResponse get(Long id);

    List<ResourceResponse> list();

    ResourceResponse update(Long id, UpdateResourceRequest request);

    void delete(Long id);
}
